import type { NextRequest } from "next/server";
import { isNightKind, nearVenue, placesEnabled, venueLatLng } from "@/lib/places/google";
import { intParam, placesJson, placesLimiter } from "@/lib/places/route-helpers";
import { clientIp } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/places/night?venue=van-wezel&kind=dinner&day=5&at=1080
 * → { places: Place[] }
 *
 * The best-rated restaurants, bars or hotels near one of Encore's venues,
 * live from Google. `day` (0 Sunday) and `at` (minute of the day) keep
 * restaurants and bars to the ones open then. Only venues with coordinates
 * on file can be asked about, so the key can't be used to search anywhere
 * else. 404 when GOOGLE_MAPS_API_KEY isn't set.
 */
export async function GET(request: NextRequest) {
  if (!placesEnabled()) return placesJson({ error: "Not available" }, 404);
  const q = request.nextUrl.searchParams;
  const venue = q.get("venue") ?? "";
  const kind = q.get("kind") ?? "";
  if (!venueLatLng(venue) || !isNightKind(kind)) return placesJson({ error: "Unknown venue or kind" }, 400);
  const day = intParam(q.get("day"), 0, 6);
  const minutes = intParam(q.get("at"), 0, 1439);

  const ip = clientIp(request.headers);
  if (!placesLimiter.take(ip)) return placesJson({ error: "Too many requests. Try again in a minute." }, 429, { "Retry-After": String(placesLimiter.retryAfter(ip)) });

  try {
    const places = await nearVenue(venue, kind, day != null && minutes != null ? { day, minutes } : undefined);
    return placesJson({ places });
  } catch (err) {
    console.error("[places/night]", err instanceof Error ? err.message : err);
    return placesJson({ error: "Google didn’t answer. Try again in a moment." }, 502);
  }
}
