import type { NextRequest } from "next/server";
import { inCounty, isCountyKey, isProKind, placesEnabled } from "@/lib/places/google";
import { placesFailure, placesJson, placesLimiter, takeVisitorList } from "@/lib/places/route-helpers";
import { clientIp } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/places/pros?county=sarasota&kind=movers → { places: Place[] }
 *
 * The best-rated movers, painters, handymen or house cleaners in Sarasota
 * County, Manatee County or both, live from Google. 404 when Places is off
 * (no key, or no database for the cap); 429 once today's or this month's cap
 * is used, or this visitor's share of today's (lib/places/budget.ts), with
 * `capped: true`.
 */
export async function GET(request: NextRequest) {
  if (!placesEnabled()) return placesJson({ error: "Not available" }, 404);
  const q = request.nextUrl.searchParams;
  const county = q.get("county") ?? "";
  const kind = q.get("kind") ?? "";
  if (!isCountyKey(county) || !isProKind(kind)) return placesJson({ error: "Unknown county or kind" }, 400);

  const ip = clientIp(request.headers);
  if (!placesLimiter.take(ip)) return placesJson({ error: "Too many requests. Try again in a minute." }, 429, { "Retry-After": String(placesLimiter.retryAfter(ip)) });

  try {
    // This visitor's share of the day first, then the site-wide cap (lib/places/budget.ts).
    await takeVisitorList(ip);
    return placesJson({ places: await inCounty(county, kind) });
  } catch (err) {
    return placesFailure(err, "places/pros");
  }
}
