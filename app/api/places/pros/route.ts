import type { NextRequest } from "next/server";
import { inCounty, isCountyKey, isProKind, placesEnabled } from "@/lib/places/google";
import { placesJson, placesLimiter } from "@/lib/places/route-helpers";
import { clientIp } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/places/pros?county=sarasota&kind=movers → { places: Place[] }
 *
 * The best-rated movers, painters, handymen or house cleaners in Sarasota
 * County, Manatee County or both, live from Google. 404 when
 * GOOGLE_MAPS_API_KEY isn't set.
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
    return placesJson({ places: await inCounty(county, kind) });
  } catch (err) {
    console.error("[places/pros]", err instanceof Error ? err.message : err);
    return placesJson({ error: "Google didn’t answer. Try again in a moment." }, 502);
  }
}
