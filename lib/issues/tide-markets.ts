import type { MarketSlug } from "./render";

/**
 * Which market a county sale counts toward in Tide, by its situs ZIP.
 *
 * Source: the Atlas dataset, neighborhood-data/data/neighborhoods.search.json
 * (2,088 areas, communities and enclaves, each with its `market` and `zips`).
 * A ZIP goes to the market with the most Atlas entries listing it; the
 * counts are in the comments. ZIPs with fewer than two Atlas entries are left
 * out (33598 Wimauma, one Bradenton entry; 34251 Myakka City, one Lakewood
 * Ranch entry), as are the ZIPs Atlas doesn't reach at all (Venice, Nokomis,
 * Osprey, North Port, Englewood). Atlas draws Bradenton to include Palmetto,
 * Parrish, Ellenton and the Anna Maria Island cities, so Tide does too.
 *
 * One override from the sales record itself: a sale whose postal city the
 * county gives as LAKEWOOD RANCH counts toward Lakewood Ranch whatever its ZIP.
 *
 * lib/issues/tide-monthly.test.ts recomputes this table from the Atlas file
 * and fails when they drift apart; regenerate it from the same rule then.
 */
export const ZIP_MARKET: Readonly<Record<string, MarketSlug>> = {
  "34201": "bradenton", // bradenton 43, sarasota 4 (University Park)
  "34202": "lakewood-ranch", // lakewood-ranch 102, bradenton 14
  "34203": "bradenton", // bradenton 146, sarasota 1
  "34205": "bradenton", // bradenton 129
  "34207": "bradenton", // bradenton 103
  "34208": "bradenton", // bradenton 141
  "34209": "bradenton", // bradenton 218
  "34210": "bradenton", // bradenton 68
  "34211": "lakewood-ranch", // lakewood-ranch 21, bradenton 20
  "34212": "bradenton", // bradenton 54, lakewood-ranch 1
  "34215": "bradenton", // bradenton 6 (Cortez)
  "34216": "bradenton", // bradenton 18 (Anna Maria)
  "34217": "bradenton", // bradenton 122 (Holmes Beach, Bradenton Beach)
  "34219": "bradenton", // bradenton 91 (Parrish)
  "34221": "bradenton", // bradenton 237 (Palmetto)
  "34222": "bradenton", // bradenton 45 (Ellenton)
  "34228": "sarasota", // sarasota 17 (Longboat Key)
  "34231": "sarasota", // sarasota 19
  "34232": "sarasota", // sarasota 33
  "34233": "sarasota", // sarasota 13
  "34234": "sarasota", // sarasota 12
  "34235": "sarasota", // sarasota 25
  "34236": "sarasota", // sarasota 18
  "34237": "sarasota", // sarasota 13
  "34238": "sarasota", // sarasota 43
  "34239": "sarasota", // sarasota 15
  "34240": "sarasota", // sarasota 16, lakewood-ranch 12
  "34241": "sarasota", // sarasota 19
  "34242": "sarasota", // sarasota 11
  "34243": "sarasota", // sarasota 114
};

/** Postal cities that decide the market on their own. */
export const CITY_MARKET: Readonly<Record<string, MarketSlug>> = {
  "LAKEWOOD RANCH": "lakewood-ranch",
};

/** The rule above, as code, for the drift test: ZIP → market by Atlas majority, at least two entries. */
export function zipMarketsFromAtlas(rows: { market: string; zips?: string[] }[]): Record<string, MarketSlug> {
  const counts = new Map<string, Map<string, number>>();
  for (const r of rows) {
    for (const z of r.zips ?? []) {
      const m = counts.get(z) ?? new Map<string, number>();
      m.set(r.market, (m.get(r.market) ?? 0) + 1);
      counts.set(z, m);
    }
  }
  const out: Record<string, MarketSlug> = {};
  for (const [zip, m] of [...counts.entries()].sort()) {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    if (total < 2) continue;
    const [top] = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    out[zip] = top![0] as MarketSlug;
  }
  return out;
}
