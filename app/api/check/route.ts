import { NextResponse, type NextRequest } from "next/server";
import { GUIDES } from "@/lib/guides";
import { evacGuidePiece, floodGuidePiece } from "@/lib/check/guide";
import { parseAddress } from "@/lib/check/parse";
import { cachedCheck, checkLimiter, dailyCap, runCheck } from "@/lib/check/server";
import { clientIp } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/check?address=1660+Ringling+Blvd&zip=34236
 *
 * Atlas Check: for one address in Manatee or Sarasota County, the evacuation
 * zone (the county's layer), the FEMA flood zone and its map panel (the
 * National Flood Hazard Layer) and the roll's facts for the parcel (the
 * county's parcel layer), plus the last qualified sale in the county sales
 * file and the guides' words for the zone. Every fact carries the layer it
 * came from, the page to check it on and the day it was read.
 *
 * 400 for an address without a number, a street or a ZIP; 404 when neither
 * county's roll nor the Census geocoder knows it; 422 when it's outside the
 * two counties; 429 past the per-visitor or daily limit; 503 when the
 * sources can't be reached. Nothing about who owns a parcel is requested or
 * returned. Answers cache for an hour at the edge.
 */

const CACHE = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { "Cache-Control": status === 200 ? CACHE : "no-store", ...headers } });

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const parsed = parseAddress((p.get("address") ?? "").slice(0, 120), (p.get("zip") ?? "").slice(0, 10));
  if ("error" in parsed) return json({ ok: false, error: parsed.error }, 400);

  let out = cachedCheck(parsed);
  if (!out) {
    const ip = clientIp(request.headers);
    if (!checkLimiter.take(ip)) return json({ ok: false, error: "rate" }, 429, { "Retry-After": String(checkLimiter.retryAfter(ip)) });
    if (!dailyCap.take("all")) return json({ ok: false, error: "rate" }, 429, { "Retry-After": String(dailyCap.retryAfter("all")) });
    out = await runCheck(parsed);
  }
  if (!out.ok) {
    const status = out.error === "not-found" ? 404 : out.error === "outside" ? 422 : 503;
    return json({ ok: false, error: out.error, query: { display: parsed.display } }, status);
  }
  const r = out.result;
  const flood = r.flood.status === "ok" ? r.flood.value : null;
  return json({
    ok: true,
    query: { display: parsed.display, number: parsed.number, zip: parsed.zip },
    result: r,
    sale: out.sale,
    saleWindowStart: out.saleWindowStart,
    salesThrough: out.salesThrough,
    guides: { flood: floodGuidePiece(GUIDES, flood?.zone ?? null), evacuation: evacGuidePiece(GUIDES) },
  });
}
