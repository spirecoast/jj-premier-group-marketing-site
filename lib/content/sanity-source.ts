import { isMarketSlug } from "./markets";
import { sanityFetch } from "@/sanity/lib/fetch";
import { toImageRef, type SanityImageSource } from "@/sanity/lib/image";
import {
  eventsQuery,
  listingsQuery,
  neighborhoodsQuery,
  postsQuery,
  siteSettingsQuery,
  teamQuery,
  testimonialsQuery,
  venuesQuery,
} from "@/sanity/lib/queries";
import type {
  EventsQueryResult,
  ListingsQueryResult,
  NeighborhoodsQueryResult,
  PostsQueryResult,
  SiteSettingsQueryResult,
  TeamQueryResult,
  TestimonialsQueryResult,
  VenuesQueryResult,
} from "@/sanity.types";
import { SITE_SETTINGS } from "./seed/settings";
import type { ContentSource } from "./source";
import type {
  Address,
  Event,
  ImageRef,
  Listing,
  MarketSlug,
  Neighborhood,
  Post,
  Ref,
  RichText,
  SiteSettings,
  TeamMember,
  Testimonial,
  Venue,
} from "./types";

/* Query results are typed by Sanity TypeGen (sanity.types.ts, `npm run
   sanity:typegen`). The mappers below still read defensively, because every
   generated field is nullable and the site must never crash on a half-filled
   document. */
type Raw = Record<string, unknown>;
const rows = <T>(result: T): Raw[] => (Array.isArray(result) ? (result as unknown as Raw[]) : []);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);
const opt = <T>(v: unknown): T | undefined => (v === null ? undefined : (v as T | undefined));
const bool = (v: unknown): boolean => v === true;
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);
const rich = (v: unknown): RichText => (Array.isArray(v) ? (v as RichText) : []);
const refOf = (v: unknown): Ref | undefined => {
  const r = v as { name?: string; slug?: string } | null;
  return r?.name && r?.slug ? { name: r.name, slug: r.slug } : undefined;
};
const address = (v: unknown): Address => {
  const a = (v ?? {}) as Partial<Address>;
  return { street: a.street ?? "", city: a.city ?? "", state: a.state ?? "FL", zip: a.zip ?? "" };
};
/** Documents tagged with a market the site no longer serves are skipped, not rebucketed. */
const hasMarket = (r: Raw): boolean => isMarketSlug(r.market);
const market = (v: unknown): MarketSlug =>
  v === "sarasota" || v === "bradenton" ? v : "lakewood-ranch";
const image = (v: unknown, alt: string): ImageRef | undefined =>
  toImageRef(v as SanityImageSource, alt);
const requireImage = (v: unknown, alt: string): ImageRef =>
  image(v, alt) ?? { src: "/og-image.png", alt, width: 1200, height: 630 };

function mapListing(r: Raw): Listing {
  const title = str(r.title);
  return {
    _id: str(r._id),
    title,
    slug: str(r.slug),
    address: address(r.address),
    geo: opt(r.geo),
    price: num(r.price),
    beds: num(r.beds),
    baths: num(r.baths),
    sqft: num(r.sqft),
    status: r.status === "pending" || r.status === "sold" ? r.status : "active",
    tag: opt(r.tag),
    market: market(r.market),
    lotAcres: opt(r.lotAcres),
    yearBuilt: opt(r.yearBuilt),
    renovated: opt(r.renovated),
    listedAt: opt(r.listedAt),
    daysOnMarket: opt(r.daysOnMarket),
    floodZone: opt(r.floodZone),
    annualTaxes: opt(r.annualTaxes),
    cardNote: opt(r.cardNote),
    friendNote: opt(r.friendNote),
    percentOfList: opt(r.percentOfList),
    openHouse: opt(r.openHouse),
    county: opt(r.county),
    mlsNumber: opt(r.mlsNumber),
    featured: bool(r.featured),
    soldDate: opt(r.soldDate),
    description: rich(r.description),
    features: strs(r.features),
    hero: requireImage(r.hero, title),
    gallery: (Array.isArray(r.gallery) ? r.gallery : [])
      .map((g) => image(g, title))
      .filter((g): g is ImageRef => Boolean(g)),
    neighborhood: refOf(r.neighborhood),
    agent: refOf(r.agent),
  };
}

function mapEvent(r: Raw): Event {
  const v = (r.venue ?? {}) as Raw;
  return {
    _id: str(r._id),
    title: str(r.title),
    slug: str(r.slug),
    summary: str(r.summary),
    startsAt: str(r.startsAt),
    endsAt: opt(r.endsAt),
    allDay: bool(r.allDay),
    category: (opt(r.category) as Event["category"]) ?? "festival",
    ticketUrl: opt(r.ticketUrl),
    priceNote: opt(r.priceNote),
    source: opt(r.source),
    sourceUrl: opt(r.sourceUrl),
    featured: bool(r.featured),
    description: r.description ? rich(r.description) : undefined,
    image: image(r.image, str(r.title)),
    venue: {
      name: str(v.name),
      slug: str(v.slug),
      market: market(v.market),
      address: address(v.address),
      geo: opt(v.geo),
    },
  };
}

function mapVenue(r: Raw): Venue {
  return {
    _id: str(r._id),
    name: str(r.name),
    slug: str(r.slug),
    address: address(r.address),
    geo: opt(r.geo),
    website: opt(r.website),
    market: market(r.market),
    about: r.about ? rich(r.about) : undefined,
    image: image(r.image, str(r.name)),
    neighborhood: refOf(r.neighborhood),
  };
}

function mapNeighborhood(r: Raw): Neighborhood {
  return {
    _id: str(r._id),
    name: str(r.name),
    slug: str(r.slug),
    market: market(r.market),
    county: opt(r.county),
    tagline: opt(r.tagline),
    overview: rich(r.overview),
    highlights: Array.isArray(r.highlights)
      ? (r.highlights as Raw[]).map((h) => ({ label: str(h.label), description: str(h.description) }))
      : [],
    stat: r.stat
      ? { value: str((r.stat as Raw).value), label: str((r.stat as Raw).label), source: str((r.stat as Raw).source) }
      : undefined,
    hero: requireImage(r.hero, str(r.name)),
    featuredListings: strs(r.featuredListings),
  };
}

function mapPost(r: Raw): Post {
  return {
    _id: str(r._id),
    title: str(r.title),
    slug: str(r.slug),
    excerpt: str(r.excerpt),
    body: rich(r.body),
    publishedAt: str(r.publishedAt),
    categories: strs(r.categories),
    edition: opt(r.edition),
    cover: requireImage(r.cover, str(r.title)),
    author: refOf(r.author) ?? { name: "JJ Premier Group", slug: "" },
  };
}

function mapTeamMember(r: Raw): TeamMember {
  const phone = str(r.phone);
  return {
    _id: str(r._id),
    name: str(r.name),
    slug: str(r.slug),
    title: str(r.title),
    licenseNumber: str(r.licenseNumber),
    bio: rich(r.bio),
    phone,
    phoneE164: str(r.phoneE164, `+1${phone.replace(/\D/g, "")}`),
    email: str(r.email),
    order: num(r.order, 99),
    register: opt(r.register),
    quote: opt(r.quote),
    headshot: requireImage(r.headshot, str(r.name)),
  };
}

function mapTestimonial(r: Raw): Testimonial {
  return {
    _id: str(r._id),
    quote: str(r.quote),
    attribution: str(r.attribution),
    market: r.market ? market(r.market) : undefined,
    date: opt(r.date),
    permissionOnFile: bool(r.permissionOnFile),
  };
}

function mapSettings(r: Raw | null): SiteSettings {
  const d = SITE_SETTINGS;
  if (!r) return d;
  return {
    brokerageName: str(r.brokerageName, d.brokerageName),
    brokerageLogo: image(r.brokerageLogo, "Coldwell Banker") ?? d.brokerageLogo,
    officeAddress: r.officeAddress ? address(r.officeAddress) : d.officeAddress,
    licenses: Array.isArray(r.licenses)
      ? (r.licenses as Raw[]).map((l) => ({ name: str(l.name), number: str(l.number) }))
      : d.licenses,
    socialLinks: Array.isArray(r.socialLinks)
      ? (r.socialLinks as Raw[]).map((l) => ({ label: str(l.label), url: str(l.url) }))
      : d.socialLinks,
    defaultOgImage: image(r.defaultOgImage, "JJ Premier Group") ?? d.defaultOgImage,
    footerDisclosure: str(r.footerDisclosure, d.footerDisclosure),
    mlsAttribution: str(r.mlsAttribution, d.mlsAttribution),
    stats: Array.isArray(r.stats)
      ? (r.stats as Raw[]).map((s) => ({ value: str(s.value), label: str(s.label), source: opt(s.source) }))
      : d.stats,
    ticker: strs(r.ticker).length ? strs(r.ticker) : d.ticker,
    primaryPhoneE164: str(r.primaryPhoneE164, d.primaryPhoneE164),
    primaryPhoneDisplay: str(r.primaryPhoneDisplay, d.primaryPhoneDisplay),
  };
}

export const sanitySource: ContentSource = {
  name: "sanity",
  async listings() {
    const result = await sanityFetch<ListingsQueryResult>({ query: listingsQuery, tags: ["listing"] });
    return rows(result).filter(hasMarket).map(mapListing);
  },
  async events() {
    const result = await sanityFetch<EventsQueryResult>({ query: eventsQuery, tags: ["event", "venue"] });
    return rows(result).filter((r) => hasMarket((r.venue ?? {}) as Raw)).map(mapEvent);
  },
  async venues() {
    const result = await sanityFetch<VenuesQueryResult>({ query: venuesQuery, tags: ["venue"] });
    return rows(result).filter(hasMarket).map(mapVenue);
  },
  async neighborhoods() {
    const result = await sanityFetch<NeighborhoodsQueryResult>({ query: neighborhoodsQuery, tags: ["neighborhood", "listing"] });
    return rows(result).filter(hasMarket).map(mapNeighborhood);
  },
  async posts() {
    const result = await sanityFetch<PostsQueryResult>({ query: postsQuery, tags: ["post", "teamMember"] });
    return rows(result).map(mapPost);
  },
  async team() {
    const result = await sanityFetch<TeamQueryResult>({ query: teamQuery, tags: ["teamMember"] });
    return rows(result).map(mapTeamMember);
  },
  async testimonials() {
    const result = await sanityFetch<TestimonialsQueryResult>({ query: testimonialsQuery, tags: ["testimonial"] });
    return rows(result).map(mapTestimonial);
  },
  async settings() {
    const result = await sanityFetch<SiteSettingsQueryResult>({ query: siteSettingsQuery, tags: ["siteSettings"] });
    return mapSettings(result ? (result as unknown as Raw) : null);
  },
};
