import { NextResponse, type NextRequest } from "next/server";
import { RateLimiter, clientIp, normalizeQuery } from "@/lib/search/query";
import { searchSite } from "@/lib/search/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 30 searches a minute per IP, per server instance. */
const limiter = new RateLimiter(30, 60_000);

/**
 * GET /api/search?q=… → { q, source, results: [{ id, kind, title, section, url, snippet, score }] }
 *
 * `source` is "hybrid" (Postgres full text + gte-small vectors, fused) or
 * "keyword" (keyword-only, in Postgres or in memory when the database or
 * the embed function isn't reachable). Snippets mark highlights with
 * U+E000 … U+E001 (lib/search/types.ts HIGHLIGHT), never HTML.
 */
export async function GET(request: NextRequest) {
  const check = normalizeQuery(request.nextUrl.searchParams.get("q"));
  if (!check.ok) return NextResponse.json({ q: check.q, error: check.error }, { status: 400 });

  const ip = clientIp(request.headers);
  if (!limiter.take(ip)) {
    return NextResponse.json({ q: check.q, error: "Too many searches. Try again in a minute." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfter(ip)) } });
  }

  const res = await searchSite(check.q);
  return NextResponse.json(res, {
    headers: {
      // Answers change only when the index does; let the edge reuse one for a few minutes.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
