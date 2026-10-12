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
    line: "The shows, concerts and openings tonight, this weekend and all season, at every stage, hall and gallery near you.",
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
  /** One quieter line under the item in the phone menu only. */
  secondary?: { href: string; label: string };
};

/**
 * Primary navigation: the plain pages, then a hairline, then the three
 * product families, each a menu (productFamilies below). "Buy" goes to /buy
 * until there are live listings to search.
 */
export const primaryNav: readonly NavItem[] = [
  { href: "/buy", label: "Buy", secondary: { href: "/relocate", label: "Plan your move with Atlas Move" } },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "Joelyn & Jessica" },
  { href: "/guides", label: "Guides" },
] as const;

export type ProductLink = {
  id: string;
  href: string;
  /** The product's full name, family first: "Atlas Match". */
  label: string;
  /** A few words for the menu. */
  short: string;
  /** One sentence on what it does for the person using it. */
  line: string;
};

export type ProductFamily = {
  key: "atlas" | "encore" | "tide";
  name: string;
  /** What the family is for, in three words. */
  title: string;
  line: string;
  items: readonly ProductLink[];
};

/**
 * The three data products and what each one powers. Atlas is the
 * neighborhood data, Encore the arts and culture listings, Tide the county
 * sales record; every tool built on one of them sits in its family here, so
 * the header menus, the footer and /tools stay in step.
 */
export const productFamilies: readonly ProductFamily[] = [
  {
    key: "atlas",
    name: "Atlas",
    title: "Find where to live",
    line: "Every neighborhood in Lakewood Ranch, Sarasota and Bradenton, and a plan for the move.",
    items: [
      {
        id: "atlas",
        href: "/neighborhoods",
        label: "Atlas Neighborhoods",
        short: "Every neighborhood on one map",
        line: "Every neighborhood on one map. Open one to see its HOA, CDD, water and evacuation zone.",
      },
      {
        id: "atlas-match",
        href: "/neighborhoods/match",
        label: "Atlas Match",
        short: "Find the neighborhoods that fit",
        line: "Tell us what matters and see the neighborhoods that fit.",
      },
      {
        id: "atlas-move",
        href: "/relocate",
        label: "Atlas Move",
        short: "Every date and deadline for your move",
        line: "Every date and deadline for your move on one page, from the contract to homestead.",
      },
    ],
  },
  {
    key: "encore",
    name: "Encore",
    title: "Theater, music and art",
    line: "Theater, music, galleries and talks across the three cities, and a plan for the days you choose.",
    items: [
      {
        id: "encore",
        href: "/calendar",
        label: "Encore Arts Calendar",
        short: "Shows, concerts, galleries and talks",
        line: "Shows, concerts, gallery openings and talks in one calendar.",
      },
      {
        id: "encore-planner",
        href: "/calendar/plan",
        label: "Encore Planner",
        short: "Plan your nights out",
        line: "Pick your dates and get the shows, concerts and openings for each day.",
      },
    ],
  },
  {
    key: "tide",
    name: "Tide",
    title: "Know the market",
    line: "What homes sold for, street by street, and what you’d keep if you sold yours.",
    items: [
      {
        id: "tide",
        href: "/tide",
        label: "Tide Market Report",
        short: "What sold each month, and what it means",
        line: "The monthly market report: what sold, for how much, and what it means if you’re buying or selling.",
      },
      {
        id: "tide-street",
        href: "/sell/sold",
        label: "Tide Street",
        short: "What sold on your street",
        line: "Type your street and see every home sale on it, from the county’s public record.",
      },
      {
        id: "tide-sale-calculator",
        href: "/sell/net-proceeds",
        label: "Tide Sale Calculator",
        short: "What you’d keep after selling",
        line: "See what you’d keep after selling, once the commission, title, doc stamps and mortgage are paid.",
      },
    ],
  },
] as const;

/** The footer's groups, then the legal links. The product families come from productFamilies. */
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
