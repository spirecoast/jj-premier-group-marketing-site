import type { Sale } from "./types";

/**
 * The computed figures over a set of county sales, shared by the server
 * module (lib/sales/index.ts), the Tide issue builder (lib/issues) and the
 * unit tests. Pure: no file reads, no server-only marker.
 */

export type SalesSummary = {
  count: number;
  /** Sales the roll shows as a building (anything but vacant). */
  homes: number;
  /** Sales the roll still shows as vacant: lots, and new builds the roll has not caught up with. */
  lots: number;
  /** Median of price ÷ living area over homes with a recorded living area that are not roll-changed; null when fewer than two. */
  medianPricePerSqft: number | null;
  /** How many sales went into the $/sqft median. */
  sqftSampleSize: number;
  medianPrice: number | null;
  from: string | null;
  to: string | null;
};

/** "N TAMIAMI TRL", "69TH ST NW": the street as the county spells it, without a house number. */
export function fullStreet(s: Sale): string {
  return [s.predir, s.street, s.suffix, s.postdir].filter(Boolean).join(" ");
}

/**
 * True when the roll's building facts are not the ones that were paid for:
 * a 03/04 code (the appraiser says so), or a year built after the sale year
 * (a new build the roll caught up with later). Such rows stay in the count
 * and the table but out of the $/sqft median.
 */
export function rollChanged(s: Sale): boolean {
  if (s.qualCode === "03" || s.qualCode === "04") return true;
  const saleYear = Number(s.saleDate.slice(0, 4));
  return Boolean(s.yearBuilt && saleYear && s.yearBuilt > saleYear);
}

/** The middle value; the mean of the two middle values for an even count. Null for none. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Computed, never typed: count, homes and lots, date range, median price,
 * and the median price per living square foot over the homes whose roll
 * facts are the ones that were paid for (see rollChanged).
 */
export function summarize(rows: Sale[]): SalesSummary {
  const perSqft = rows
    .filter((r) => r.propertyUse !== "vacant" && !rollChanged(r) && r.livingArea && r.livingArea > 0)
    .map((r) => r.salePrice / (r.livingArea as number));
  const lots = rows.filter((r) => r.propertyUse === "vacant").length;
  const dates = rows.map((r) => r.saleDate).sort();
  return {
    count: rows.length,
    homes: rows.length - lots,
    lots,
    medianPricePerSqft: perSqft.length >= 2 ? Math.round(median(perSqft) as number) : null,
    sqftSampleSize: perSqft.length,
    medianPrice: rows.length ? Math.round(median(rows.map((r) => r.salePrice)) as number) : null,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
  };
}
