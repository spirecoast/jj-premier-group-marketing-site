import { NextResponse, type NextRequest } from "next/server";
import { placePhoto, placesEnabled } from "@/lib/places/google";
import { isPhotoName, type PhotoFailure } from "@/lib/places/photo";
import { placesJson } from "@/lib/places/route-helpers";
import { RateLimiter, clientIp } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A Nearby list shows up to five photos; 40 a minute per IP, per server instance, only keeps a script off the database. */
const photoLimiter = new RateLimiter(40, 60_000);

const STATUS: Record<PhotoFailure, number> = { name: 400, key: 404, visitor: 429, day: 429, month: 429, error: 503, google: 502 };

/**
 * GET /api/places/photo?name=places/{place}/photos/{photo}
 * → 302 to the photo on Google's image host
 *
 * One thumbnail for the Planner's Nearby lists (components/places/place-tabs.tsx).
 * The name comes from the list (/api/places/night), which only hands out
 * names when the whole list's photos fit the caps. Each photo is counted
 * for this visitor and on the Place Photos SKU before Google is asked
 * (lib/places/budget.ts), and refused when either count is used up or
 * can't be read. The key stays here: the browser is sent to Google's own
 * image address, which carries no key, and caches it only as Google's
 * headers allow; nothing is stored on this side and the redirect itself is
 * no-store. Any answer but the redirect is an error the page reads as "no
 * photo", so the row shows without one. 404 when Places is off.
 */
export async function GET(request: NextRequest) {
  if (!placesEnabled()) return placesJson({ error: "Not available" }, 404);
  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!isPhotoName(name)) return placesJson({ error: "Unknown photo" }, 400);

  const ip = clientIp(request.headers);
  if (!photoLimiter.take(ip)) return placesJson({ error: "Too many requests" }, 429, { "Retry-After": String(photoLimiter.retryAfter(ip)) });

  const photo = await placePhoto(name, ip);
  if (photo.ok) {
    return new NextResponse(null, { status: 302, headers: { Location: photo.uri, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
  if (photo.reason === "google") console.error("[places/photo] Google didn’t return a photo");
  return placesJson({ error: "No photo" }, STATUS[photo.reason]);
}
