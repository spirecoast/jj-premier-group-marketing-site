import { sql, type SQL } from "drizzle-orm";
import { EMBED_DIMS } from "./embed";
import { SEARCH_KINDS, variedResults, type SearchHit, type SearchKind } from "./types";

/**
 * The query side, minus the I/O: validating what was typed, the SQL that
 * calls search_scored(), a per-IP rate limit and a short cache. The route
 * and the page wire these to the database and the Edge Function in
 * lib/search/search.ts.
 */

export const QUERY_LIMITS = { min: 2, max: 200 } as const;

/**
 * How search_scored() (0011_search_score_fusion.sql) puts the two signals on
 * one scale. Every candidate gets both scores, each on a fixed 0..1 scale:
 *
 *   semantic = (cosine - cosFloor) / (cosCeiling - cosFloor), clamped. On the
 *              live index gte-small puts gibberish at 0.79–0.82 and strong
 *              matches at 0.90–0.94.
 *   keyword  = sqrt(IDF-weighted share of the query's words in the chunk).
 *   score    = semanticWeight * semantic + (1 - semanticWeight) * keyword,
 *              plus titleBoost when the title is exactly the query.
 *
 * Rows under minScore are dropped, so noise returns nothing: with these
 * numbers a chunk with no word in common needs cosine >= 0.845, and one with
 * no semantic signal needs every word. Tuned on lib/search/eval/queries.json
 * with scripts/search-eval.ts; docs/SITE.md has the numbers and how to re-tune.
 */
export const SCORING = {
  matchCount: 10,
  semanticWeight: 0.8,
  cosFloor: 0.82,
  cosCeiling: 0.92,
  titleBoost: 0.15,
  minScore: 0.2,
  candidates: 40,
} as const;

/** Rows asked of the database per search: enough that ten are left after the per-page cap. */
export const SQL_ROWS = 30;

export type QueryCheck = { ok: true; q: string } | { ok: false; q: string; error: string };

/** Trim, fold runs of whitespace and control characters, and check the length. */
export function normalizeQuery(raw: unknown): QueryCheck {
  const q = (typeof raw === "string" ? raw : "")
    .replace(/[\u0000-\u001f\u007f\uE000\uE001]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (q.length < QUERY_LIMITS.min) return { ok: false, q, error: `Type at least ${QUERY_LIMITS.min} characters.` };
  if (q.length > QUERY_LIMITS.max) return { ok: false, q, error: `Keep it under ${QUERY_LIMITS.max} characters.` };
  return { ok: true, q };
}

/** pgvector's text form, after checking the vector is what the column holds. */
export function vectorLiteral(v: number[]): string {
  if (v.length !== EMBED_DIMS || !v.every((x) => Number.isFinite(x))) throw new Error(`Expected ${EMBED_DIMS} finite numbers`);
  return `[${v.join(",")}]`;
}

export type ScoringSettings = { -readonly [K in keyof typeof SCORING]: number };

export type ScoredParams = {
  q: string;
  /** null when the query couldn't be embedded: the function then scores on keywords alone. */
  embedding: number[] | null;
} & Partial<ScoringSettings>;

/**
 * The call to search_scored(), fully parameterised. A null embedding asks for
 * keyword matches only: semantic is 0, so only chunks with every word pass.
 */
export function scoredSql(p: ScoredParams): SQL {
  const s: ScoringSettings = { ...SCORING };
  for (const k of Object.keys(SCORING) as (keyof ScoringSettings)[]) {
    const v = p[k];
    if (typeof v === "number" && Number.isFinite(v)) s[k] = v;
  }
  const matchCount = Math.max(1, Math.min(50, Math.trunc(s.matchCount)));
  const candidates = Math.max(1, Math.min(200, Math.trunc(s.candidates)));
  const vec = p.embedding === null ? null : vectorLiteral(p.embedding);
  return sql`select id, kind, title, section_title, url, snippet, score from public.search_scored(${p.q}, ${vec}::extensions.vector(384), ${matchCount}::int, ${s.semanticWeight}::float, ${s.cosFloor}::float, ${s.cosCeiling}::float, ${s.titleBoost}::float, ${s.minScore}::float, ${candidates}::int) order by score desc, cosine desc, keyword desc, id`;
}

/** Whether the index has any embedded rows: asked only when a search came back empty. */
export const indexFilledSql = (): SQL => sql`select exists (select 1 from public.search_documents where embedding is not null) as filled`;

/**
 * What an empty answer from search_scored() means. With an embedding and a
 * filled index it's final: nothing reached the threshold, so the query gets
 * no results (gibberish shouldn't come back as keyword near-misses from the
 * in-memory fallback). Before the first index, or when the search ran on
 * keywords alone (every word required), the fallback gets a try.
 */
export function emptyAnswer(o: { embedded: boolean; indexFilled: boolean }): "none" | "fallback" {
  return o.embedded && o.indexFilled ? "none" : "fallback";
}

export type ScoredRow = { id: string; kind: string; title: string; section_title: string | null; url: string; snippet: string | null; score: number | string };

const isKind = (k: string): k is SearchKind => (SEARCH_KINDS as readonly string[]).includes(k);

/**
 * Rows from search_scored() as hits, best first. Unknown kinds and unsafe urls
 * are dropped, and so are later parts of a chunk already shown ("…~2") and
 * more than three sections of one page (variedResults).
 */
export function rowsToHits(rows: ScoredRow[], tidy: (s: string) => string): SearchHit[] {
  const keep = variedResults();
  return rows
    .filter((r) => isKind(r.kind) && typeof r.url === "string" && r.url.startsWith("/") && !r.url.startsWith("//"))
    .filter(keep)
    .map((r) => ({
      id: r.id,
      kind: r.kind as SearchKind,
      title: r.title,
      section: r.section_title,
      url: r.url,
      snippet: tidy(r.snippet ?? ""),
      score: Number(r.score),
    }));
}

/* ---- Rate limit and cache ------------------------------------------------- */

/**
 * A fixed-window counter per key, in memory. Per server instance, so it's a
 * speed bump against a script hammering the Edge Function, not a quota.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; reset: number }>();
  constructor(
    readonly limit: number,
    readonly windowMs: number,
    private now: () => number = Date.now,
  ) {}

  /** True when the request is allowed. */
  take(key: string): boolean {
    const t = this.now();
    const cur = this.hits.get(key);
    if (!cur || cur.reset <= t) {
      if (this.hits.size > 5000) this.sweep(t);
      this.hits.set(key, { count: 1, reset: t + this.windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= this.limit;
  }

  retryAfter(key: string): number {
    const cur = this.hits.get(key);
    return cur ? Math.max(1, Math.ceil((cur.reset - this.now()) / 1000)) : 1;
  }

  private sweep(t: number) {
    for (const [k, v] of this.hits) if (v.reset <= t) this.hits.delete(k);
  }
}

/** A small TTL cache with oldest-first eviction. */
export class TtlCache<V> {
  private map = new Map<string, { at: number; value: V }>();
  constructor(
    readonly ttlMs: number,
    readonly max: number,
    private now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (this.now() - e.at > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: V): void {
    this.map.delete(key);
    this.map.set(key, { at: this.now(), value });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
}

/** The cache key: case and spacing don't change the answer. */
export const cacheKey = (q: string) => q.toLowerCase();

/** The visitor's IP from the proxy headers, or "unknown". */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip")?.trim() || "unknown";
}
