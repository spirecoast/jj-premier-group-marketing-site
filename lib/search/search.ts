import "server-only";
import { getDb } from "@/lib/db";
import { embedConfig, embedQuery } from "./embed";
import { keywordSearch } from "./fallback";
import { getChunksCached } from "./load";
import { RateLimiter, SCORING, SQL_ROWS, TtlCache, cacheKey, emptyAnswer, indexFilledSql, rowsToHits, scoredSql, type ScoredRow } from "./query";
import { tidySnippet } from "./snippet";
import type { SearchResponse } from "./types";

/**
 * One search, wherever it's asked from (GET /api/search, the /search page):
 *
 *   1. A cached answer for the same query from the last five minutes.
 *   2. Hybrid: embed the query with the `embed` Edge Function, then
 *      search_scored() in Postgres (full text + pgvector, each scored on a
 *      fixed scale and fused by weighted sum, with an absolute threshold).
 *      If the query can't be embedded, the same function runs keyword-only.
 *      A query nothing reaches the threshold for gets no results.
 *   3. Fallback: keyword search in memory over the same chunks, when there's
 *      no DATABASE_URL, the database errors, the index has nothing yet, or a
 *      keyword-only search found nothing.
 *
 * The page never breaks: every failure falls through to the next step.
 */

const cache = new TtlCache<SearchResponse>(5 * 60 * 1000, 500);
const DB_TIMEOUT_MS = 5_000;

const withTimeout = <T>(p: Promise<T>, ms: number, what: string) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms))]);

async function hybrid(q: string): Promise<SearchResponse | null> {
  if (!process.env.DATABASE_URL) return null;
  const config = embedConfig();
  let embedding: number[] | null = null;
  if (config) {
    try {
      embedding = await embedQuery(q, config);
    } catch (err) {
      console.warn("[search] query embedding failed, keyword only:", err instanceof Error ? err.message : String(err));
    }
  }
  try {
    const db = getDb();
    const rows = (await withTimeout(db.execute(scoredSql({ q, embedding, matchCount: SQL_ROWS })), DB_TIMEOUT_MS, "search_scored")) as unknown as ScoredRow[];
    const results = rowsToHits([...rows], tidySnippet).slice(0, SCORING.matchCount);
    if (results.length) return { q, source: embedding ? "hybrid" : "keyword", results };
    // Nothing reached the score threshold. With an embedding and a filled
    // index that's the answer (noise returns nothing); otherwise the index may
    // be empty, or keyword-only was too strict, so let the fallback try.
    const [filled] = embedding ? ((await withTimeout(db.execute(indexFilledSql()), DB_TIMEOUT_MS, "index check")) as unknown as { filled: boolean }[]) : [];
    return emptyAnswer({ embedded: embedding !== null, indexFilled: filled?.filled === true }) === "none" ? { q, source: "hybrid", results: [] } : null;
  } catch (err) {
    console.warn("[search] search_scored failed, using the fallback:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/** The /search page's own per-IP limit: past it the page answers from memory, without the database or the model. */
export const pageLimiter = new RateLimiter(60, 60_000);

export async function searchSiteKeywordOnly(q: string): Promise<SearchResponse> {
  return { q, source: "keyword", results: keywordSearch(await getChunksCached(), q, SCORING.matchCount) };
}

export async function searchSite(q: string): Promise<SearchResponse> {
  const key = cacheKey(q);
  const hit = cache.get(key);
  if (hit) return hit;
  const res = (await hybrid(q)) ?? (await searchSiteKeywordOnly(q));
  cache.set(key, res);
  return res;
}
