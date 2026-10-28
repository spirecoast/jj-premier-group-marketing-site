import { NextResponse } from "next/server";
import {
  MAX_ROWS,
  alsoInSubdivision,
  findParcelSales,
  formatSaleAddress,
  fullStreet,
  getSalesManifest,
  parcelCount,
  parseTypedUnit,
  placeBasis,
  placeFor,
  placesForRows,
  rollChanged,
  searchByArea,
  searchByStreet,
  similarForParcel,
  titleSubdivision,
  stripTypedUnit,
  type County,
  type Sale,
} from "@/lib/sales";

/**
 * GET /api/sales?street=Lilac+Sky&zip=34211[&city=][&county=manatee|sarasota][&number=5133]
 * GET /api/sales?place=the-lake-club
 *
 * The "What sold on your street" search, and with `number` the "This
 * address on the record" lookup at /sell/home-value. Reads the county files
 * on the server (lib/sales), returns every row on the street (up to 1,000,
 * newest first) plus a computed summary, and never an owner, grantor or
 * grantee name (stripped at ingest). A typed `city` is resolved to the ZIPs
 * the county files it in. With `number` (digits, at most eight) the response
 * adds `parcel`: that house's own qualified sales, newest first, or an empty
 * list when the number is not on the roll; the ZIP may be left out when the
 * street runs through one ZIP only. An ambiguous street (several spellings
 * or ZIPs) answers 400 `zip-required` with `options`, one per street-and-ZIP
 * pair, for the page to offer. When the typed street is a place name
 * instead (an Atlas area or a postal city), `place` names it so the page can
 * offer "Sales in {place}"; `?place=<slug>` then answers with every sale in
 * that place's ZIPs (newest 200) and the summary over all of them.
 *
 * Joined to places (lib/sales/places.ts): a street result carries `places`,
 * the Atlas places its sales belong to by subdivision and the areas that
 * list its ZIP; a street with fewer than three sales carries `alsoIn`, the
 * other sales in its subdivision; a house the record knows carries
 * `similar`, the same kind of home within 20% of its size sold nearby in
 * the last twelve months (lib/sales/similar.ts). Coordinates never leave
 * the server; a similar row says how far it is, rounded to a tenth of a
 * mile. Inputs are length-capped; responses cache for a minute at the edge.
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
  const placeSlug = clip(url.searchParams.get("place"), 80);

  const manifest = await getSalesManifest();
  const source = manifest
    ? {
        asOf: manifest.generatedAt.slice(0, 10),
        windowStart: manifest.windowStart,
        windowMonths: manifest.windowMonths,
        counties: Object.values(manifest.counties).map((c) => c.label),
        /** How far each county's file reaches: the honest "as of" for a street in that county. */
        through: (Object.entries(manifest.counties) as [County, { label: string; to: string | null }][]).map(([k, c]) => ({ county: k, label: c.label, to: c.to })),
      }
    : null;

  if (!manifest) {
    return NextResponse.json({ ok: false, error: "no-data", source }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  // Every sale in a place's ZIPs: the second path, from the "Sales in {place}" chip.
  if (placeSlug) {
    if (!/^[a-z0-9:-]+$/.test(placeSlug)) {
      return NextResponse.json({ ok: false, error: "place", source }, { status: 400, headers: { "Cache-Control": CACHE } });
    }
    const area = await searchByArea({ place: placeSlug, limit: 200 });
    if (!area) {
      return NextResponse.json({ ok: false, error: "place", source }, { status: 404, headers: { "Cache-Control": CACHE } });
    }
    return NextResponse.json(
      {
        ok: true,
        query: { street: null, zip: null, city: null, county: null, number: null, place: placeSlug },
        match: "area" as const,
        place: { slug: area.place.slug, name: area.place.name, zips: area.place.zips, basis: area.basis },
        streets: area.streets,
        zips: area.place.zips,
        options: [],
        total: area.total,
        rows: area.rows.map(publicRow),
        summary: area.summary,
        truncated: area.total > area.rows.length,
        source,
      },
      { headers: { "Cache-Control": CACHE } },
    );
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

  // A number and a street repeat across towns, so the parcel lookup needs a
  // ZIP; without one, the street search first says whether there is only
  // one, and the lookup takes it.
  let parcelZip = zip;
  if (number && !zip) {
    const probe = await searchByStreet({ street: stripTypedUnit(street), city: city || undefined, county, limit: 1 });
    if (probe.match === "ambiguous") {
      return NextResponse.json(
        { ok: false, error: "zip-required", query: { street, zip: null, city: city || null, county: county ?? null, number }, streets: probe.streets, zips: probe.zips, options: probe.options, total: probe.total, source },
        { status: 400, headers: { "Cache-Control": CACHE } },
      );
    }
    parcelZip = probe.zips.length === 1 ? probe.zips[0]! : "";
  }

  // The parcel first: when the house is on the roll, the street section is
  // the street the county files it under, not the typed spelling (which can
  // fold to a neighbouring key). A typed unit ("#204") belongs to the parcel
  // lookup, not the street key.
  const parcelRows = number && parcelZip ? await findParcelSales({ number, street, zip: parcelZip }) : number ? [] : null;
  const streetQuery = parcelRows?.length ? { street: fullStreet(parcelRows[0]!), zip: parcelRows[0]!.zip } : { street: stripTypedUnit(street), zip: zip || undefined };
  const result = await searchByStreet({ ...streetQuery, city: city || undefined, county, limit: MAX_ROWS });
  if (result.match === "ambiguous") {
    // Several streets or ZIPs answer to that name; the page offers each as a chip instead of blending them,
    // and the place the words name, if they name one ("Lake Club" is The Lake Club before it is Club Ln).
    const named = await placeFor(stripTypedUnit(street));
    return NextResponse.json(
      {
        ok: false,
        error: "zip-required",
        query: { street, zip: null, city: city || null, county: county ?? null, number: number || null },
        streets: result.streets,
        zips: result.zips,
        options: result.options,
        total: result.total,
        ...(named ? { place: { slug: named.slug, name: named.name, zips: named.zips, basis: await placeBasis(named.slug) } } : {}),
        source,
      },
      { status: 400, headers: { "Cache-Control": CACHE } },
    );
  }
  // Similar homes nearby, as evidence beside the house's own record.
  const similar = parcelRows?.length ? await similarForParcel(parcelRows[0]!) : null;
  // The Atlas places the street belongs to, and the rest of its subdivision when it has few sales of its own.
  const [places, alsoIn] = result.rows.length ? await Promise.all([placesForRows(result.rows), alsoInSubdivision(result.rows)]) : [[], null];
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
  // A street box that names a place rather than a street: offered as a second path when the street search found nothing exact.
  const place = result.match === "exact" ? null : await placeFor(stripTypedUnit(street));
  return NextResponse.json(
    {
      ok: true,
      query: { street, zip: zip || null, city: city || null, county: county ?? null, number: number || null },
      match: result.match,
      streets: result.streets,
      zips: result.zips,
      options: [],
      total: result.total,
      rows: result.rows.map(publicRow),
      // Computed in lib/sales over every match on the street, not only the rows sent.
      summary: result.summary,
      truncated: result.total > result.rows.length,
      ...(parcel ? { parcel } : {}),
      ...(similar
        ? {
            similar: {
              basis: similar.basis.kind === "subdivision" ? { kind: "subdivision", name: titleSubdivision(similar.basis.name) } : similar.basis,
              sizeFrom: similar.sizeFrom,
              sizeTo: similar.sizeTo,
              since: similar.since,
              summary: similar.summary,
              rows: similar.rows.map((r) => ({ ...publicRow(r), ...(typeof r.miles === "number" ? { miles: Math.round(r.miles * 10) / 10 } : {}) })),
            },
          }
        : {}),
      ...(places.length ? { places } : {}),
      ...(alsoIn ? { alsoIn: { subdivision: titleSubdivision(alsoIn.subdivision), total: alsoIn.total, summary: alsoIn.summary, rows: alsoIn.rows.map(publicRow) } } : {}),
      ...(place ? { place: { slug: place.slug, name: place.name, zips: place.zips, basis: await placeBasis(place.slug) } } : {}),
      source,
    },
    { headers: { "Cache-Control": CACHE } },
  );
}
