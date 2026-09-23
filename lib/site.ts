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
  tagline: "Every move, expertly guided.",
  description:
    "Joelyn Nauman and Jessica Garza, a mother and daughter team with Coldwell Banker Realty, helping people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton.",
  /** Bare domain — also the Follow Up Boss lead `source`. No `www.`. */
  domain: "jjpremiergroup.com",
  url: resolveSiteUrl(),
  locale: "en_US",
  region: "Lakewood Ranch · Sarasota · Bradenton",
  /** Where "see our current listings" points until an MLS feed is wired in. */
  listingsUrl: process.env.NEXT_PUBLIC_LISTINGS_URL || "",
  /** The two editorial products, named once. */
  calendarName: "Encore Arts Calendar",
  calendarShort: "Encore",
  reportName: "The Coast Market Report",
} as const;

export type NavItem = { href: string; label: string };

/** Primary navigation, in the order the website mockup sets it. */
export const primaryNav: readonly NavItem[] = [
  { href: "/listings", label: "Search" },
  { href: "/sell", label: "Sell" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/calendar", label: "Encore" },
  { href: "/blog", label: "Market Report" },
  { href: "/about", label: "Joelyn & Jessica" },
] as const;

/** Secondary links used in the footer columns. */
export const footerNav = {
  search: [
    { href: "/neighborhoods?market=lakewood-ranch", label: "Lakewood Ranch" },
    { href: "/neighborhoods?market=sarasota", label: "Sarasota" },
    { href: "/neighborhoods?market=bradenton", label: "Bradenton" },
    { href: "/listings", label: "Find your home" },
  ],
  team: [
    { href: "/about#joelyn-nauman", label: "Joelyn Nauman" },
    { href: "/about#jessica-garza", label: "Jessica Garza" },
    { href: "/blog", label: "The Coast Market Report" },
    { href: "/calendar", label: "Encore Arts Calendar" },
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
