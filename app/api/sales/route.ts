import { NextResponse } from "next/server";
import { formatSaleAddress, getSalesManifest, rollChanged, searchByStreet, type County, type Sale } from "@/lib/sales";

/**
 * GET /api/sales?street=Lilac+Sky&zip=34211[&city=][&county=manatee|sarasota]
 *
 * The "What sold on your street" search. Reads the county files on the
 * server (lib/sales), returns at most 50 rows plus a computed summary, and
 * never an owner, grantor or grantee name (stripped at ingest). Inputs are
 * length-capped; responses cache for a minute at the edge.
 */

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

function clip(v: string | null, max: number): string {
  return (v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

/** The public shape of a sale: the property and the transaction, nothing about who. */
function publicRow(s: Sale) {
  return {
    county: s.county,
    address: formatSaleAddress(s),
    city: s.city,
    zip: s.zip,
    saleDate: s.saleDate,
    salePrice: s.salePrice,
    livingArea: s.livingArea,
    pricePerSqft: s.livingArea && s.propertyUse !== "vacant" && !rollChanged(s) ? Math.round(s.salePrice / s.livingArea) : null,
    /** The roll's building facts changed after the sale (03/04, or built after the sale year). */
    rollChanged: rollChanged(s),
    yearBuilt: s.yearBuilt,
    beds: s.beds,
    baths: s.baths,
    propertyUse: s.propertyUse,
    qualCode: s.qualCode,
    instrument: s.instrument,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const street = clip(url.searchParams.get("street"), 80);
  const zipRaw = clip(url.searchParams.get("zip"), 10);
  // A ZIP is five digits, with or without the +4; anything else is a 400, not silently trimmed.
  const zipOk = !zipRaw || /^\d{5}(-\d{4})?$/.test(zipRaw);
  const zip = zipOk ? zipRaw.slice(0, 5) : "";
  const city = clip(url.searchParams.get("city"), 40);
  const countyParam = clip(url.searchParams.get("county"), 10).toLowerCase();
  const county: County | undefined = countyParam === "manatee" || countyParam === "sarasota" ? countyParam : undefined;

  const manifest = await getSalesManifest();
  const source = manifest
    ? {
        asOf: manifest.generatedAt.slice(0, 10),
        windowStart: manifest.windowStart,
        windowMonths: manifest.windowMonths,
        counties: Object.values(manifest.counties).map((c) => c.label),
      }
    : null;

  if (!manifest) {
    return NextResponse.json({ ok: false, error: "no-data", source }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (street.length < 2) {
    return NextResponse.json({ ok: false, error: "street", source }, { status: 400, headers: { "Cache-Control": CACHE } });
  }
  if (!zipOk) {
    return NextResponse.json({ ok: false, error: "zip", source }, { status: 400, headers: { "Cache-Control": CACHE } });
  }

  const result = await searchByStreet({ street, zip: zip || undefined, city: city || undefined, county, limit: 50 });
  if (result.match === "ambiguous") {
    // Several streets or ZIPs answer to that name; the page asks for the ZIP instead of blending them.
    return NextResponse.json(
      { ok: false, error: "zip-required", query: { street, zip: null, city: null, county: county ?? null }, streets: result.streets, zips: result.zips, total: result.total, source },
      { status: 400, headers: { "Cache-Control": CACHE } },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      query: { street, zip: zip || null, city: city || null, county: county ?? null },
      match: result.match,
      streets: result.streets,
      zips: result.zips,
      total: result.total,
      rows: result.rows.map(publicRow),
      // Computed in lib/sales over every match on the street, not only the 50 rows sent.
      summary: result.summary,
      truncated: result.total > result.rows.length,
      source,
    },
    { headers: { "Cache-Control": CACHE } },
  );
}
