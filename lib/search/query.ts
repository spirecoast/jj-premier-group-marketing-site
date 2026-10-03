import { sql, type SQL } from "drizzle-orm";
import { EMBED_DIMS } from "./embed";
import { SEARCH_KINDS, variedResults, type SearchHit, type SearchKind } from "./types";

/**
 * The query side, minus the I/O: validating what was typed, the SQL that
 * calls search_hybrid(), a per-IP rate limit and a short cache. The route
 * and the page wire these to the database and the Edge Function in
 * lib/search/search.ts.
 */

export const QUERY_LIMITS = { min: 2, max: 200 } as const;

/**
 * The fusion settings. RRF k = 50 and equal weights are the Supabase guide's
 * defaults. On the live index (October 2026), gte-small put gibberish
 * ("xyzzy blorp", "asdf qwerty") at 0.79 to 0.81 against the short event
 * listings and real questions at 0.82 and up. So a neighbour below 0.80 isn't
 * a semantic match, and when nothing matches by keyword at all, the best
 * semantic match must reach 0.83 or the search returns nothing.
 */
export const FUSION = { matchCount: 10, fullTextWeight: 1, semanticWeight: 1, rrfK: 50, minSimilarity: 0.8, semanticOnlyMin: 0.83 } as const;

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

/**
 * A unit vector for keyword-only searches (when the query couldn't be
 * embedded): the semantic side is switched off by a similarity floor no
 * vector can reach, so only full-text matches come back.
 */
export const KEYWORD_ONLY_VECTOR: number[] = Array.from({ length: EMBED_DIMS }, (_, i) => (i === 0 ? 1 : 0));

export type HybridParams = {
  q: string;
  embedding: number[] | null;
  matchCount?: number;
  fullTextWeight?: number;
  semanticWeight?: number;
  rrfK?: number;
  minSimilarity?: number;
  semanticOnlyMin?: number;
};

/** The call to search_hybrid(), fully parameterised. A null embedding asks for keyword matches only. */
export function hybridSql(p: HybridParams): SQL {
  const keywordOnly = p.embedding === null;
  const vec = vectorLiteral(p.embedding ?? KEYWORD_ONLY_VECTOR);
  const matchCount = Math.max(1, Math.min(30, Math.trunc(p.matchCount ?? FUSION.matchCount)));
  // When no row matched by keyword, keep the results only if the best one is a
  // strong semantic match (FUSION.semanticOnlyMin); otherwise the query is noise.
  return sql`with h as (select id, kind, title, section_title, url, snippet, score, keyword_rank from public.search_hybrid(${p.q}, ${vec}::extensions.vector(384), ${matchCount}::int, ${p.fullTextWeight ?? FUSION.fullTextWeight}::float, ${keywordOnly ? 0 : (p.semanticWeight ?? FUSION.semanticWeight)}::float, ${p.rrfK ?? FUSION.rrfK}::int, ${keywordOnly ? 2 : (p.minSimilarity ?? FUSION.minSimilarity)}::float)) select id, kind, title, section_title, url, snippet, score from h where exists (select 1 from h where keyword_rank is not null) or (select max(1 - (d.embedding operator(extensions.<=>) ${vec}::extensions.vector(384))) from public.search_documents d join h on h.id = d.id) >= ${p.semanticOnlyMin ?? FUSION.semanticOnlyMin}::float order by score desc`;
}

export type HybridRow = { id: string; kind: string; title: string; section_title: string | null; url: string; snippet: string | null; score: number | string };

const isKind = (k: string): k is SearchKind => (SEARCH_KINDS as readonly string[]).includes(k);

/**
 * Rows from search_hybrid() as hits, best first. Unknown kinds and unsafe urls
 * are dropped, and so are later parts of a chunk already shown ("…~2") and
 * more than three sections of one page (variedResults).
 */
export function rowsToHits(rows: HybridRow[], tidy: (s: string) => string): SearchHit[] {
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
