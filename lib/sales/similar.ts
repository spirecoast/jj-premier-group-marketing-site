import { groupSummary, rollChanged, type GroupSummary } from "./stats";
import type { Sale } from "./types";

/**
 * "Similar sales nearby" on Home Value: the evidence a seller would want
 * next to their own house's record, never a number in place of it. Pure.
 *
 * A sale is similar when it's the same kind of home (the county's use
 * bucket), its recorded living area is within 20% of the house's, the
 * roll's facts are the ones that were paid for, and it closed in the twelve
 * months before the record's newest sale. Nearby is read the most precise
 * way the record allows:
 *   1. distance, when both parcels have coordinates (Manatee): within half
 *      a mile, widening to one and then two miles until three are found;
 *   2. otherwise the same subdivision, as the county names it;
 *   3. otherwise the same ZIP.
 * The house's own sales are never in the list.
 */

export type SimilarBasis = { kind: "distance"; miles: number } | { kind: "subdivision"; name: string } | { kind: "zip"; zip: string };

export type SimilarResult = { basis: SimilarBasis; rows: (Sale & { miles?: number })[]; summary: GroupSummary; sizeFrom: number; sizeTo: number; since: string };

export const SIMILAR_RADII = [0.5, 1, 2] as const;
export const SIMILAR_MIN = 3;
export const SIMILAR_MAX_ROWS = 8;
export const SIZE_TOLERANCE = 0.2;

const EARTH_MILES = 3958.8;
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h));
}

/** The day twelve months before `iso` (YYYY-MM-DD). */
export function monthsBefore(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1 - months, d));
  return t.toISOString().slice(0, 10);
}

/**
 * The similar sales for one house (its newest sale on the record), from
 * every row in the county files. Null when the house has no recorded size
 * or isn't a home, or when nothing similar is found.
 */
export function similarSales(house: Sale, rows: Sale[], newest: string): SimilarResult | null {
  if (!house.livingArea || house.propertyUse === "vacant" || house.propertyUse === "other") return null;
  const since = monthsBefore(newest, 12);
  const sizeFrom = Math.round(house.livingArea * (1 - SIZE_TOLERANCE));
  const sizeTo = Math.round(house.livingArea * (1 + SIZE_TOLERANCE));
  const pool = rows.filter(
    (r) =>
      r.parcelId !== house.parcelId &&
      r.county === house.county &&
      r.propertyUse === house.propertyUse &&
      r.saleDate >= since &&
      r.livingArea !== null &&
      r.livingArea >= sizeFrom &&
      r.livingArea <= sizeTo &&
      !rollChanged(r),
  );
  const done = (basis: SimilarBasis, list: (Sale & { miles?: number })[]): SimilarResult => ({ basis, rows: list.slice(0, SIMILAR_MAX_ROWS), summary: groupSummary(list), sizeFrom, sizeTo, since });
  const newestFirst = (a: Sale, b: Sale) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : 0);

  if (typeof house.lat === "number" && typeof house.lng === "number") {
    const here = { lat: house.lat, lng: house.lng };
    const placed = pool
      .filter((r): r is Sale & { lat: number; lng: number } => typeof r.lat === "number" && typeof r.lng === "number")
      .map((r) => ({ ...r, miles: milesBetween(here, r) }));
    for (const radius of SIMILAR_RADII) {
      const within = placed.filter((r) => r.miles <= radius).sort((a, b) => a.miles - b.miles || newestFirst(a, b));
      if (within.length >= SIMILAR_MIN) return done({ kind: "distance", miles: radius }, within);
    }
  }
  if (house.subdivision) {
    const same = pool.filter((r) => r.subdivision === house.subdivision).sort(newestFirst);
    if (same.length >= SIMILAR_MIN) return done({ kind: "subdivision", name: house.subdivision }, same);
  }
  const zip = pool.filter((r) => r.zip === house.zip).sort(newestFirst);
  return zip.length ? done({ kind: "zip", zip: house.zip }, zip) : null;
}
