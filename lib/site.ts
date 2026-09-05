/**
 * Site-wide constants that are not editorial content.
 * Editorial values (phones, licenses, office address, stats) live in the
 * `siteSettings` document and its seed in lib/content/seed — edit them there.
 */
export const site = {
  name: "JJ Premier Group",
  brokerage: "Coldwell Banker Realty",
  tagline: "Every move, expertly guided.",
  description:
    "Joelyn Nauman and Jessica Garza, broker associates with Coldwell Banker Realty. Two agents, one file, and the whole coast between Tampa and Venice.",
  /** Bare domain — also the Follow Up Boss lead `source`. No `www.`. */
  domain: "jjpremiergroup.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jjpremiergroup.com",
  locale: "en_US",
  region: "Lakewood Ranch · Sarasota · Bradenton · Tampa",
} as const;

export type NavItem = { href: string; label: string };

/** Primary navigation, in the order the website mockup sets it. */
export const primaryNav: readonly NavItem[] = [
  { href: "/listings", label: "Search" },
  { href: "/sell", label: "Sell" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/calendar", label: "The Calendar" },
  { href: "/blog", label: "The Letter" },
  { href: "/about", label: "About" },
] as const;

/** Secondary links used in the footer columns. */
export const footerNav = {
  search: [
    { href: "/neighborhoods?market=lakewood-ranch", label: "Lakewood Ranch" },
    { href: "/neighborhoods?market=sarasota", label: "Sarasota" },
    { href: "/neighborhoods?market=bradenton", label: "Bradenton" },
    { href: "/neighborhoods?market=tampa", label: "Tampa" },
    { href: "/listings?feature=waterfront", label: "Waterfront" },
    { href: "/listings?feature=new-construction", label: "New construction" },
  ],
  team: [
    { href: "/about#joelyn-nauman", label: "Joelyn Nauman" },
    { href: "/about#jessica-garza", label: "Jessica Garza" },
    { href: "/blog", label: "The quarterly letter" },
    { href: "/calendar", label: "The Suncoast Calendar" },
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
