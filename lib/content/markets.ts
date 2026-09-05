import { img } from "./seed/helpers";
import type { Market, MarketSlug } from "./types";

/**
 * The four markets. A fixed list rather than CMS content: they are the spine
 * of the navigation and the footer, and adding one is a design decision.
 * Stats carry their source and period, per the claims rule.
 */
export const MARKETS: readonly Market[] = [
  {
    slug: "lakewood-ranch",
    name: "Lakewood Ranch",
    county: "Manatee County",
    image: img("library/lwr-main-street-dawn", "Lakewood Ranch Main Street at dawn"),
    pricePerSf: 712,
    statSource: "Stellar MLS · median closed $/SF · Q2 2026",
    blurb:
      "A master-planned community east of I-75 with more than twenty villages, each with its own HOA, and a lake or preserve edge on most streets.",
  },
  {
    slug: "sarasota",
    name: "Sarasota",
    county: "Sarasota County",
    image: img("library/sarasota-bayfront-blue-hour", "Sarasota bayfront at blue hour"),
    pricePerSf: 688,
    statSource: "Stellar MLS · median closed $/SF · Q2 2026",
    blurb:
      "The bayfront, the keys, and the neighborhoods west of the Trail. Sarasota carries the region's opera house, orchestra, and gallery district.",
  },
  {
    slug: "bradenton",
    name: "Bradenton",
    county: "Manatee County",
    image: img("library/bradenton-riverwalk-golden", "Bradenton Riverwalk at golden hour"),
    pricePerSf: 395,
    statSource: "Stellar MLS · median closed $/SF · Q2 2026",
    blurb:
      "The Manatee River, the Riverwalk, the canal streets west of 75th, and a working downtown with the county's performing arts center.",
  },
  {
    slug: "tampa",
    name: "Tampa",
    county: "Hillsborough County",
    image: img("library/tampa-riverwalk-dusk", "Tampa Riverwalk at dusk"),
    pricePerSf: 488,
    statSource: "Stellar MLS · median closed $/SF · Q2 2026",
    blurb:
      "Hyde Park, Bayshore Boulevard, and the towers along the Riverwalk. Fifty minutes from the Ranch on a good morning, and the airport is the reason many clients ask.",
  },
] as const;

export function getMarket(slug: string | undefined): Market | undefined {
  return MARKETS.find((m) => m.slug === slug);
}

export function isMarketSlug(value: unknown): value is MarketSlug {
  return typeof value === "string" && MARKETS.some((m) => m.slug === value);
}

export function marketName(slug: MarketSlug): string {
  return getMarket(slug)?.name ?? slug;
}
