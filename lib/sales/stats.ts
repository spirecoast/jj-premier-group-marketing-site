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
  /** Over every row, lots included: the headline figure only when the street has no resales. */
  medianPrice: number | null;
  /** Median over the resales (the roll shows a building); null with none. */
  medianResalePrice: number | null;
  /** Median over the new builds and lots (vacant on the roll); null with none. */
  medianNewerPrice: number | null;
  from: string | null;
  to: string | null;
};

/** A sale the roll shows as a building: a resale, as the page calls it. The rest are new builds the roll hasn't caught up with, and lots. */
export const isResale = (s: Pick<Sale, "propertyUse">) => s.propertyUse !== "vacant";

/** The figures for one group of sales (resales, new builds, the homes like yours): a count, the median price, and the $/sqft median over the rows whose roll facts were paid for. */
export type GroupSummary = {
  count: number;
  medianPrice: number | null;
  medianPricePerSqft: number | null;
  sqftSampleSize: number;
};

export function groupSummary(rows: Pick<Sale, "salePrice" | "livingArea" | "propertyUse" | "qualCode" | "saleDate" | "yearBuilt">[]): GroupSummary {
  const perSqft = rows.filter((r) => isResale(r) && !rollChanged(r) && r.livingArea && r.livingArea > 0).map((r) => r.salePrice / (r.livingArea as number));
  return {
    count: rows.length,
    medianPrice: rows.length ? Math.round(median(rows.map((r) => r.salePrice)) as number) : null,
    medianPricePerSqft: perSqft.length >= 2 ? Math.round(median(perSqft) as number) : null,
    sqftSampleSize: perSqft.length,
  };
}

/**
 * The living-area band around a house: its size give or take 300 square
 * feet, each edge rounded to the nearest hundred, never below 100. "Like
 * yours" on Tide Street filters the medians to resales in this band.
 */
export function sizeBand(livingArea: number): { from: number; to: number } {
  const r = (n: number) => Math.max(100, Math.round(n / 100) * 100);
  return { from: r(livingArea - 300), to: r(livingArea + 300) };
}

/** Whether a row's recorded size falls in the band (inclusive). */
export const inSizeBand = (r: Pick<Sale, "livingArea">, band: { from: number; to: number }) => r.livingArea !== null && r.livingArea >= band.from && r.livingArea <= band.to;

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
export function rollChanged(s: Pick<Sale, "qualCode" | "saleDate" | "yearBuilt">): boolean {
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
 * Computed, never typed: count, homes and lots, date range, the median price
 * over everything and over the resales and the new builds and lots apart
 * (a street of lot transfers must not set the price a seller sees), and the
 * median price per living square foot over the homes whose roll facts are
 * the ones that were paid for (see rollChanged).
 */
export function summarize(rows: Sale[]): SalesSummary {
  const perSqft = rows
    .filter((r) => r.propertyUse !== "vacant" && !rollChanged(r) && r.livingArea && r.livingArea > 0)
    .map((r) => r.salePrice / (r.livingArea as number));
  const resales = rows.filter(isResale).map((r) => r.salePrice);
  const newer = rows.filter((r) => !isResale(r)).map((r) => r.salePrice);
  const dates = rows.map((r) => r.saleDate).sort();
  return {
    count: rows.length,
    homes: resales.length,
    lots: newer.length,
    medianPricePerSqft: perSqft.length >= 2 ? Math.round(median(perSqft) as number) : null,
    sqftSampleSize: perSqft.length,
    medianPrice: rows.length ? Math.round(median(rows.map((r) => r.salePrice)) as number) : null,
    medianResalePrice: resales.length ? Math.round(median(resales) as number) : null,
    medianNewerPrice: newer.length ? Math.round(median(newer) as number) : null,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
  };
}
