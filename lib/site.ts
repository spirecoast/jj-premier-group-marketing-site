/**
 * Site-wide constants that are not editorial content.
 * Editorial values (phones, licenses, office address, stats) live in the
 * `siteSettings` document and its seed in lib/content/seed — edit them there.
 */
/**
 * Public origin of the site. `NEXT_PUBLIC_SITE_URL` wins when it is a valid
 * absolute URL; an empty or malformed value (easy to leave behind in a hosting
 * dashboard) must not break the build, so it falls through to the Vercel
 * production hostname and finally the launch domain.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    "https://jjpremiergroup.com",
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      return new URL(c).origin;
    } catch {
      // try the next candidate
    }
  }
  return "https://jjpremiergroup.com";
}

export const site = {
  name: "JJ Premier Group",
  brokerage: "Coldwell Banker Realty",
  tagline: "Every move, expertly guided from start to finish.",
  description:
    "Joelyn Nauman and Jessica Garza, a mother and daughter team with Coldwell Banker Realty, helping people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton.",
  /** Bare domain — also the Follow Up Boss lead `source`. No `www.`. */
  domain: "jjpremiergroup.com",
  url: resolveSiteUrl(),
  locale: "en_US",
  region: "Lakewood Ranch · Sarasota · Bradenton",
  /** Where "see our current listings" points until an MLS feed is wired in. */
  listingsUrl: process.env.NEXT_PUBLIC_LISTINGS_URL || "",
  /**
   * The three products, named once. Atlas is the map, Encore the nights out,
   * Tide the market: one word each, all from the coast, all a place to go back to.
   */
  atlasName: "Atlas",
  calendarName: "Encore Arts Calendar",
  calendarShort: "Encore",
  reportName: "Tide",
  reportLong: "Tide · The Coast real estate newsletter",
} as const;

export type Product = {
  key: "atlas" | "encore" | "tide";
  name: string;
  /** What it is, in two words, for the nav sublabel. */
  tag: string;
  /** The full name with its descriptor. */
  long: string;
  href: string;
  /** One line, written to the reader. */
  line: string;
  /** The accent color token, used for a tick of color on the home band. */
  accent: string;
};

export const products: readonly Product[] = [
  {
    key: "atlas",
    name: "Atlas",
    tag: "Neighborhoods",
    long: "Atlas · The neighborhood explorer",
    href: "/neighborhoods",
    line: "Every place in Lakewood Ranch, Sarasota and Bradenton on one map, with the facts behind each one.",
    accent: "var(--color-navy)",
  },
  {
    key: "encore",
    name: "Encore",
    tag: "Arts calendar",
    long: "Encore · The arts calendar",
    href: "/calendar",
    line: "What’s on tonight, this weekend and all season, at every stage, hall and gallery near you.",
    accent: "var(--color-amber)",
  },
  {
    key: "tide",
    name: "Tide",
    tag: "Newsletter",
    long: "Tide · The Coast real estate newsletter",
    href: "/blog",
    line: "What happened on your street this month, in plain language, and what it means for you.",
    accent: "var(--color-sky-700)",
  },
] as const;

export type NavItem = {
  href: string;
  label: string;
  /** What it is, in a few words: the descriptor beside a product name, the second line in the phone menu. */
  sub?: string;
  /** A named product (Atlas, Encore, Tide): the desktop nav sets it in the display serif with its descriptor on the baseline. */
  product?: boolean;
  /** One quieter line under the item in the phone menu only; the desktop line stays six items wide. */
  secondary?: { href: string; label: string };
};

/**
 * Primary navigation. The plain pages first (Buy, Sell, the team), then a
 * hairline, then the three products as a group. "Buy" goes to /buy until
 * there are live listings to search.
 */
export const primaryNav: readonly NavItem[] = [
  { href: "/buy", label: "Buy", sub: "Homes for sale", secondary: { href: "/relocate", label: "Moving here from somewhere else?" } },
  { href: "/sell", label: "Sell", sub: "Your home" },
  { href: "/about", label: "Joelyn & Jessica", sub: "Meet the team" },
  { href: "/neighborhoods", label: "Atlas", sub: "Neighborhoods", product: true },
  { href: "/calendar", label: "Encore", sub: "Arts calendar", product: true },
  { href: "/blog", label: "Tide", sub: "Newsletter", product: true },
] as const;

/** Secondary links used in the footer columns. */
export const footerNav = {
  // Each place goes to its own page; the map is one link in from there.
  places: [
    { href: "/lakewood-ranch", label: "Lakewood Ranch" },
    { href: "/sarasota", label: "Sarasota" },
    { href: "/bradenton", label: "Bradenton" },
    { href: "/buy", label: "Buy" },
  ],
  // The tools, in the order a move happens.
  tools: [
    { href: "/relocate", label: "Relocation planner" },
    { href: "/sell/sold", label: "What sold on your street" },
    { href: "/sell/net-proceeds", label: "Net proceeds" },
    { href: "/neighborhoods/match", label: "Atlas match" },
    { href: "/calendar/plan", label: "Plan a visit" },
  ],
  team: [
    { href: "/about#joelyn-nauman", label: "Joelyn Nauman" },
    { href: "/about#jessica-garza", label: "Jessica Garza" },
    { href: "/neighborhoods", label: "Atlas · Neighborhoods" },
    { href: "/calendar", label: "Encore · Arts calendar" },
    { href: "/blog", label: "Tide · Newsletter" },
    { href: "/buy", label: "Buying" },
    { href: "/sell", label: "Selling" },
    { href: "/valuation", label: "What is my home worth" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const satisfies Record<string, readonly NavItem[]>;
