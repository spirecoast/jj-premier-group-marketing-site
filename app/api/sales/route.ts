import { NextResponse } from "next/server";
import { findParcelSales, formatSaleAddress, fullStreet, getSalesManifest, parcelCount, parseTypedUnit, rollChanged, searchByStreet, stripTypedUnit, type County, type Sale } from "@/lib/sales";

/**
 * GET /api/sales?street=Lilac+Sky&zip=34211[&city=][&county=manatee|sarasota][&number=5133]
 *
 * The "What sold on your street" search, and with `number` the "This
 * address on the record" lookup at /sell/home-value. Reads the county files
 * on the server (lib/sales), returns at most 50 rows plus a computed
 * summary, and never an owner, grantor or grantee name (stripped at
 * ingest). With `number` (digits, at most eight; a ZIP is then required)
 * the response adds `parcel`: that house's own qualified sales, newest
 * first, or an empty list when the number is not on the roll. Inputs are
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
  // A house number is one to eight digits; anything else is a 400, not silently trimmed.
  const numberRaw = clip(url.searchParams.get("number"), 12);
  const numberOk = !numberRaw || /^\d{1,8}$/.test(numberRaw);
  const number = numberOk ? numberRaw : "";

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
  if (!numberOk) {
    return NextResponse.json({ ok: false, error: "number", source }, { status: 400, headers: { "Cache-Control": CACHE } });
  }
  if (number && !zip) {
    // A number and a street repeat across towns; the parcel lookup needs the ZIP to be exact.
    return NextResponse.json({ ok: false, error: "zip-required", query: { street, zip: null, city: null, county: county ?? null }, streets: [], zips: [], total: 0, source }, { status: 400, headers: { "Cache-Control": CACHE } });
  }

  // The parcel first: when the house is on the roll, the street section is
  // the street the county files it under, not the typed spelling (which can
  // fold to a neighbouring key). A typed unit ("#204") belongs to the parcel
  // lookup, not the street key.
  const parcelRows = number ? await findParcelSales({ number, street, zip }) : null;
  const streetQuery = parcelRows?.length ? { street: fullStreet(parcelRows[0]), zip: parcelRows[0].zip } : { street: stripTypedUnit(street), zip: zip || undefined };
  const result = await searchByStreet({ ...streetQuery, city: city || undefined, county, limit: 50 });
  if (result.match === "ambiguous") {
    // Several streets or ZIPs answer to that name; the page asks for the ZIP instead of blending them.
    return NextResponse.json(
      { ok: false, error: "zip-required", query: { street, zip: null, city: null, county: county ?? null }, streets: result.streets, zips: result.zips, total: result.total, source },
      { status: 400, headers: { "Cache-Control": CACHE } },
    );
  }
  // The parcel's own sales: exact number, street and ZIP, or an empty list the page states plainly.
  const parcel = parcelRows
    ? {
        number,
        unit: parseTypedUnit(street) || null,
        /** More than one means the number has several units on the roll. */
        parcels: parcelCount(parcelRows),
        rows: parcelRows.slice(0, 50).map(publicRow),
      }
    : null;
  return NextResponse.json(
    {
      ok: true,
      query: { street, zip: zip || null, city: city || null, county: county ?? null, number: number || null },
      match: result.match,
      streets: result.streets,
      zips: result.zips,
      total: result.total,
      rows: result.rows.map(publicRow),
      // Computed in lib/sales over every match on the street, not only the 50 rows sent.
      summary: result.summary,
      truncated: result.total > result.rows.length,
      ...(parcel ? { parcel } : {}),
      source,
    },
    { headers: { "Cache-Control": CACHE } },
  );
}
