import { img } from "./seed/helpers";
import type { Market, MarketSlug, RegionSlug } from "./types";

/**
 * The three places. A fixed list rather than CMS content: they are the spine
 * of the navigation and the footer, and adding one is a business decision.
 * No figures live here; market numbers arrive with the MLS data feed.
 */
export const MARKETS: readonly Market[] = [
  {
    slug: "lakewood-ranch",
    name: "Lakewood Ranch",
    county: "Manatee County",
    image: img("library/modern-home-pool-dusk", "A modern home lit at dusk in Lakewood Ranch, the pool still", "50% 45%"),
    blurb:
      "Villages built around lakes and preserves, each with its own feel, and a Main Street and Waterside that give the evenings somewhere to go.",
  },
  {
    slug: "sarasota",
    name: "Sarasota",
    county: "Sarasota County",
    image: img("library/gulf-beach-aerial", "A Gulf beach from the air, the water in three shades of green", "50% 45%"),
    blurb:
      "The bayfront, the keys, and the streets west of the Trail, with the opera house, the orchestra and the gallery district a few minutes from any of them.",
  },
  {
    slug: "bradenton",
    name: "Bradenton",
    county: "Manatee County",
    image: img("library/bradenton-riverwalk-golden", "Bradenton Riverwalk at golden hour"),
    blurb:
      "The Manatee River, the Riverwalk, the canal streets west of 75th, and a downtown with the county's theater and an arts village of its own.",
  },
] as const;

export function getMarket(slug: string | undefined): Market | undefined {
  return MARKETS.find((m) => m.slug === slug);
}

export function isMarketSlug(value: unknown): value is MarketSlug {
  return typeof value === "string" && MARKETS.some((m) => m.slug === value);
}

/** The calendar reaches one more place than the markets do. */
export const REGIONS: readonly { slug: RegionSlug; name: string }[] = MARKETS.map((m) => ({ slug: m.slug, name: m.name }));

export function isRegionSlug(value: unknown): value is RegionSlug {
  return typeof value === "string" && REGIONS.some((r) => r.slug === value);
}

export function marketName(slug: RegionSlug): string {
  return REGIONS.find((r) => r.slug === slug)?.name ?? slug;
}
