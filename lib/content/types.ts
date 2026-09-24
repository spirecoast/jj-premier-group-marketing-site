/**
 * Content model — one set of types, two sources.
 *
 * Every public page reads through lib/content (the data-access layer), which
 * serves Sanity when NEXT_PUBLIC_SANITY_PROJECT_ID is configured and the local
 * seed otherwise. Both sources are normalised to these shapes, so pages never
 * know which one they are on.
 *
 * Field-by-field these mirror docs/handoff/content-model/schemas.md. Additions
 * beyond that spec are marked "extension".
 */
import type { PortableTextBlock } from "next-sanity";

export type ImageRef = {
  /** Absolute URL or a path under /public. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Optional focal point as CSS object-position, e.g. "62% 58%". */
  position?: string;
  /** Low-quality placeholder, when the source provides one (Sanity LQIP). */
  blurDataURL?: string;
};

export type RichText = PortableTextBlock[];

export type MarketSlug = "lakewood-ranch" | "sarasota" | "bradenton";
/** Where the calendar reaches. Kept separate from MarketSlug so the calendar can widen without the markets. */
export type RegionSlug = MarketSlug;

export type Market = {
  slug: MarketSlug;
  name: string;
  /** Short place descriptor used in eyebrows, e.g. "Manatee County". */
  county: string;
  image: ImageRef;
  blurb: string;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type Geo = { lat: number; lng: number };

export type ListingStatus = "active" | "pending" | "sold";

/** Exactly one tag per listing (brand rule). */
export type ListingTag =
  | "new"
  | "coming-soon"
  | "just-reduced"
  | "under-contract"
  | "sold"
  | "off-market"
  | "open-house";

export type Ref = { name: string; slug: string };

export type Listing = {
  _id: string;
  title: string;
  slug: string;
  address: Address;
  geo?: Geo;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: ListingStatus;
  hero: ImageRef;
  gallery: ImageRef[];
  description: RichText;
  features: string[];
  mlsNumber?: string;
  neighborhood?: Ref;
  agent?: Ref;
  featured: boolean;
  soldDate?: string;
  /* extensions — the property page in the web design calls for these */
  tag?: ListingTag;
  market: MarketSlug;
  lotAcres?: number;
  yearBuilt?: number;
  renovated?: string;
  listedAt?: string;
  daysOnMarket?: number;
  floodZone?: string;
  annualTaxes?: number;
  /** Short line under the address on cards, e.g. "POOL · DOCK". */
  cardNote?: string;
  /** "What we would tell a friend" — the paragraph that is the brand. */
  friendNote?: string;
  /** For sold listings: percent of list achieved, e.g. 104. */
  percentOfList?: number;
  openHouse?: string;
  /** County for tax and appraiser attributions when it differs from the market's. */
  county?: string;
};

export type EventCategory =
  | "music"
  | "theater"
  | "gallery"
  | "festival"
  | "family"
  | "market"
  | "film"
  | "talks";

export type Venue = {
  _id: string;
  name: string;
  slug: string;
  address: Address;
  geo?: Geo;
  neighborhood?: Ref;
  website?: string;
  image?: ImageRef;
  /* extensions */
  market: RegionSlug;
  about?: RichText;
};

/** One dated performance of a production. `allDay` when the venue published no time. */
export type Performance = { startsAt: string; endsAt?: string; allDay?: boolean };

export type EventStatus = "scheduled" | "sold-out";

/**
 * A calendar entry is a production or program. `startsAt` is its next
 * performance (or the first day of a run); `performances` lists every date.
 */
export type Event = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
  allDay?: boolean;
  venue: Pick<Venue, "name" | "slug" | "market" | "address" | "geo">;
  category: EventCategory;
  ticketUrl?: string;
  priceNote?: string;
  image?: ImageRef;
  source?: string;
  sourceUrl?: string;
  featured: boolean;
  /* extensions */
  description?: RichText;
  presenter?: string;
  room?: string;
  /** Finer grain from the dataset: "chamber", "comedy", "ballet", "exhibition"… */
  subcategory?: string;
  performances?: Performance[];
  /** ISO date of the run's first day, for exhibitions and series. */
  firstDate?: string;
  /** ISO date of the run's last day, for exhibitions and series. */
  runsThrough?: string;
  status?: EventStatus;
};

/** A production on one specific date: what a day-by-day calendar shows. */
export type Occurrence = { event: Event; startsAt: string; endsAt?: string; allDay?: boolean };

export type Highlight = { label: string; description: string };

export type Neighborhood = {
  _id: string;
  name: string;
  slug: string;
  hero: ImageRef;
  overview: RichText;
  highlights: Highlight[];
  featuredListings?: string[];
  /* extensions */
  market: MarketSlug;
  county?: string;
  tagline?: string;
  /** Optional stat with its source and date, per the claims rule. */
  stat?: { value: string; label: string; source: string };
  /** Questions people ask about the place, answered plainly. Rendered as FAQPage data. */
  faqs?: NeighborhoodFaq[];
};

export type NeighborhoodFaq = { q: string; answer: string };

export type Post = {
  _id: string;
  title: string;
  slug: string;
  cover: ImageRef;
  excerpt: string;
  body: RichText;
  publishedAt: string;
  author: Ref;
  categories: string[];
  /* extension — the quarter a letter covers, e.g. "Q3 2026" */
  edition?: string;
};

export type TeamMember = {
  _id: string;
  name: string;
  slug: string;
  headshot: ImageRef;
  title: string;
  licenseNumber: string;
  bio: RichText;
  phone: string;
  email: string;
  order: number;
  /* extensions */
  /** E.164 for tel: and sms: links. */
  phoneE164: string;
  /** One-line register from the brand voice doc. */
  register?: string;
  /** A short quote in the agent's own voice. */
  quote?: string;
};

export type Testimonial = {
  _id: string;
  quote: string;
  attribution: string;
  market?: MarketSlug;
  date?: string;
  /** Written permission on file (Compliance §06). Records without it are never rendered. */
  permissionOnFile: boolean;
};

export type License = { name: string; number: string };

export type Stat = { value: string; label: string; source?: string };

export type SiteSettings = {
  brokerageName: string;
  brokerageLogo: ImageRef;
  officeAddress: Address;
  licenses: License[];
  socialLinks: { label: string; url: string }[];
  defaultOgImage: ImageRef;
  footerDisclosure: string;
  /* extensions */
  /** The three numbers on the home page, with sources. */
  stats: Stat[];
  /** The marquee under the hero. */
  ticker: string[];
  /** Number that appears in "All 34 listings"; derived when absent. */
  primaryPhoneE164: string;
  primaryPhoneDisplay: string;
  mlsAttribution: string;
};

export type ListingFilters = {
  market?: MarketSlug;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  status?: ListingStatus | "all";
  feature?: string;
  q?: string;
};
