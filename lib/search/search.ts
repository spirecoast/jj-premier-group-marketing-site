import "server-only";
import { getDb } from "@/lib/db";
import { embedConfig, embedQuery } from "./embed";
import { keywordSearch } from "./fallback";
import { getChunksCached } from "./load";
import { FUSION, RateLimiter, TtlCache, cacheKey, hybridSql, rowsToHits, type HybridRow } from "./query";
import { tidySnippet } from "./snippet";
import type { SearchResponse } from "./types";

/**
 * One search, wherever it's asked from (GET /api/search, the /search page):
 *
 *   1. A cached answer for the same query from the last five minutes.
 *   2. Hybrid: embed the query with the `embed` Edge Function, then
 *      search_hybrid() in Postgres (full text + pgvector, fused with RRF).
 *      If the query can't be embedded, the same function runs keyword-only.
 *   3. Fallback: keyword search in memory over the same chunks, when there's
 *      no DATABASE_URL, the database errors, or the index has nothing yet.
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
    const rows = (await withTimeout(getDb().execute(hybridSql({ q, embedding, matchCount: 30 })), DB_TIMEOUT_MS, "search_hybrid")) as unknown as HybridRow[];
    const results = rowsToHits([...rows], tidySnippet).slice(0, FUSION.matchCount);
    // Nothing back can mean an index that hasn't been filled yet; let the fallback try.
    if (!results.length) return null;
    return { q, source: embedding ? "hybrid" : "keyword", results };
  } catch (err) {
    console.warn("[search] search_hybrid failed, using the fallback:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/** The /search page's own per-IP limit: past it the page answers from memory, without the database or the model. */
export const pageLimiter = new RateLimiter(60, 60_000);

export async function searchSiteKeywordOnly(q: string): Promise<SearchResponse> {
  return { q, source: "keyword", results: keywordSearch(await getChunksCached(), q, FUSION.matchCount) };
}

export async function searchSite(q: string): Promise<SearchResponse> {
  const key = cacheKey(q);
  const hit = cache.get(key);
  if (hit) return hit;
  const res = (await hybrid(q)) ?? (await searchSiteKeywordOnly(q));
  cache.set(key, res);
  return res;
}
