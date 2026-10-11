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
    line: "Every place in Lakewood Ranch, Sarasota and Bradenton is on one map, with the facts behind each one.",
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
    href: "/tide",
    line: "How home sales went in the three markets, once a month, and what it means if you’re buying or selling.",
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
  { href: "/buy", label: "Buy", sub: "Homes for sale", secondary: { href: "/relocate", label: "Plan your move with Atlas Move" } },
  { href: "/sell", label: "Sell", sub: "Your home" },
  { href: "/about", label: "Joelyn & Jessica", sub: "Meet the team" },
  { href: "/neighborhoods", label: "Atlas", sub: "Neighborhoods", product: true },
  { href: "/calendar", label: "Encore", sub: "Arts calendar", product: true },
  { href: "/tide", label: "Tide", sub: "Market report", product: true },
] as const;

/** The footer's five groups, then the legal links. */
export const footerNav = {
  places: [
    { href: "/lakewood-ranch", label: "Lakewood Ranch" },
    { href: "/sarasota", label: "Sarasota" },
    { href: "/bradenton", label: "Bradenton" },
  ],
  buySell: [
    { href: "/buy", label: "Buyer’s guide" },
    { href: "/sell", label: "Seller’s guide" },
    { href: "/valuation", label: "What’s my home worth" },
    { href: "/listings", label: "Homes for sale" },
  ],
  // The products, each under its own name.
  tools: [
    { href: "/neighborhoods", label: "Atlas neighborhoods" },
    { href: "/neighborhoods/match", label: "Atlas Match" },
    { href: "/calendar", label: "Encore arts calendar" },
    { href: "/calendar/plan", label: "Encore Planner" },
    { href: "/tide", label: "Tide market report" },
    { href: "/relocate", label: "Atlas Move" },
    { href: "/sell/sold", label: "Tide Street" },
    { href: "/sell/net-proceeds", label: "Tide Sale Calculator" },
    { href: "/tools", label: "All tools" },
  ],
  guides: [
    { href: "/guides/flood-zones-and-elevation-certificates-on-the-suncoast", label: "Flood zones" },
    { href: "/guides/homeowners-wind-and-flood-insurance-on-this-coast", label: "Home insurance" },
    { href: "/guides/homestead-save-our-homes-and-portability", label: "Homestead" },
    { href: "/guides/hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton", label: "Hurricane season" },
    { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees" },
    { href: "/guides", label: "All guides" },
  ],
  team: [
    { href: "/about#joelyn-nauman", label: "Joelyn Nauman" },
    { href: "/about#jessica-garza", label: "Jessica Garza" },
    { href: "/contact", label: "Contact" },
    { href: "/refer", label: "Refer someone" },
    { href: "/reviews", label: "Leave a review" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const satisfies Record<string, readonly NavItem[]>;

export type SocialNetwork = "google" | "youtube" | "instagram" | "facebook" | "nextdoor" | "linkedin" | "zillow" | "other";

export type SocialLink = {
  network: SocialNetwork;
  /** The visible name, e.g. "YouTube". Also the icon's accessible name. */
  label: string;
  /** The team's own profile, not a login page. */
  url: string;
};

/**
 * The team's social profiles: the footer row and `sameAs` in the
 * RealEstateAgent JSON-LD. Empty until the client sends the live URLs
 * (docs/LAUNCH.md 1.11 and 1.12); nothing renders while it is empty. The
 * `socialLinks` field in Sanity's site settings adds to this list once
 * Sanity is live.
 *
 *   { network: "youtube", label: "YouTube", url: "https://www.youtube.com/@…" },
 */
export const socialLinks: readonly SocialLink[] = [];

const NETWORK_HOSTS: [RegExp, SocialNetwork][] = [
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "facebook"],
  [/(^|\.)nextdoor\.com$/, "nextdoor"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)zillow\.com$/, "zillow"],
  [/(^|\.)g\.page$|(^|\.)google\.com$|^maps\.app\.goo\.gl$|^g\.co$/, "google"],
];

/** The network a profile URL belongs to, from its host. */
export function socialNetwork(url: string): SocialNetwork {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return NETWORK_HOSTS.find(([re]) => re.test(host))?.[1] ?? "other";
  } catch {
    return "other";
  }
}

/** The code list plus any added in the CMS, deduplicated by URL; empty URLs are dropped. */
export function allSocialLinks(cms: readonly { label: string; url: string }[] = []): SocialLink[] {
  const seen = new Set<string>();
  const out: SocialLink[] = [];
  for (const l of [...socialLinks, ...cms.map((c) => ({ ...c, network: socialNetwork(c.url) }))]) {
    const url = l.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ network: l.network, label: l.label || l.network, url });
  }
  return out;
}
