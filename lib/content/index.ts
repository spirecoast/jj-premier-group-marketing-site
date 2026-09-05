import { isSanityConfigured } from "@/sanity/env";
import { filterListings, sortListings } from "./filters";
import { MARKETS, getMarket } from "./markets";
import { seedSource } from "./seed-source";
import type { ContentSource } from "./source";
import type {
  Event,
  EventCategory,
  Listing,
  ListingFilters,
  MarketSlug,
  Neighborhood,
  Post,
  SiteSettings,
  TeamMember,
  Testimonial,
  Venue,
} from "./types";

export * from "./types";
export { MARKETS, getMarket, isMarketSlug, marketName } from "./markets";

/**
 * Data-access layer for every public page.
 *
 * Sanity serves content when NEXT_PUBLIC_SANITY_PROJECT_ID is set; otherwise
 * the local seed does. Pages never import a source directly.
 */
async function source(): Promise<ContentSource> {
  if (isSanityConfigured()) {
    const { sanitySource } = await import("./sanity-source");
    return sanitySource;
  }
  return seedSource;
}

export async function contentSourceName(): Promise<ContentSource["name"]> {
  return (await source()).name;
}

/* ---- Settings, team, testimonials --------------------------------------- */

export async function getSiteSettings(): Promise<SiteSettings> {
  return (await source()).settings();
}

export async function getTeam(): Promise<TeamMember[]> {
  return (await source()).team();
}

export async function getTeamMember(slug: string): Promise<TeamMember | undefined> {
  return (await getTeam()).find((m) => m.slug === slug);
}

/** Only testimonials with written permission on file are ever rendered. */
export async function getTestimonials(): Promise<Testimonial[]> {
  return (await (await source()).testimonials()).filter((t) => t.permissionOnFile);
}

/* ---- Listings ------------------------------------------------------------ */

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const all = await (await source()).listings();
  return sortListings(filterListings(all, filters));
}

export async function getListing(slug: string): Promise<Listing | undefined> {
  const all = await (await source()).listings();
  return all.find((l) => l.slug === slug);
}

export async function getListingSlugs(): Promise<string[]> {
  return (await (await source()).listings()).map((l) => l.slug);
}

export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  const active = await getListings({ status: "active" });
  const featured = active.filter((l) => l.featured);
  const rest = active.filter((l) => !l.featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function getActiveListingCount(): Promise<number> {
  return (await getListings({ status: "active" })).length;
}

export async function getRecentSolds(limit = 6): Promise<Listing[]> {
  return (await getListings({ status: "sold" })).slice(0, limit);
}

/** Same market first, then the same price band, never the listing itself. */
export async function getSimilarListings(listing: Listing, limit = 3): Promise<Listing[]> {
  const others = (await getListings({ status: "all" })).filter((l) => l.slug !== listing.slug);
  const score = (l: Listing) =>
    (l.market === listing.market ? 2 : 0) +
    (l.neighborhood?.slug && l.neighborhood.slug === listing.neighborhood?.slug ? 2 : 0) +
    (Math.abs(Math.log(l.price / listing.price)) < 0.4 ? 1 : 0) +
    (l.status === "active" ? 1 : 0);
  return others.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

/* ---- Calendar ------------------------------------------------------------ */

export type EventQuery = {
  limit?: number;
  market?: MarketSlug;
  category?: EventCategory;
  venue?: string;
  /** Include events that have already started (default false). */
  includePast?: boolean;
  featuredFirst?: boolean;
};

export async function getUpcomingEvents(q: EventQuery = {}): Promise<Event[]> {
  const now = Date.now();
  let events = await (await source()).events();
  if (!q.includePast) {
    events = events.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now);
  }
  if (q.market) events = events.filter((e) => e.venue.market === q.market);
  if (q.category) events = events.filter((e) => e.category === q.category);
  if (q.venue) events = events.filter((e) => e.venue.slug === q.venue);
  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  if (q.featuredFirst) {
    events = [...events.filter((e) => e.featured), ...events.filter((e) => !e.featured)];
  }
  return q.limit ? events.slice(0, q.limit) : events;
}

export async function getEvent(slug: string): Promise<Event | undefined> {
  return (await (await source()).events()).find((e) => e.slug === slug);
}

export async function getEventSlugs(): Promise<string[]> {
  return (await (await source()).events()).map((e) => e.slug);
}

export async function getVenues(market?: MarketSlug): Promise<Venue[]> {
  const venues = await (await source()).venues();
  return market ? venues.filter((v) => v.market === market) : venues;
}

export async function getVenue(slug: string): Promise<Venue | undefined> {
  return (await getVenues()).find((v) => v.slug === slug);
}

export async function getVenueSlugs(): Promise<string[]> {
  return (await getVenues()).map((v) => v.slug);
}

/* ---- Neighborhoods ------------------------------------------------------- */

export async function getNeighborhoods(market?: MarketSlug): Promise<Neighborhood[]> {
  const all = await (await source()).neighborhoods();
  const order = MARKETS.map((m) => m.slug);
  const sorted = [...all].sort(
    (a, b) => order.indexOf(a.market) - order.indexOf(b.market) || a.name.localeCompare(b.name),
  );
  return market ? sorted.filter((n) => n.market === market) : sorted;
}

export async function getNeighborhood(slug: string): Promise<
  | {
      neighborhood: Neighborhood;
      listings: Listing[];
      events: Event[];
      market: ReturnType<typeof getMarket>;
    }
  | undefined
> {
  const neighborhood = (await getNeighborhoods()).find((n) => n.slug === slug);
  if (!neighborhood) return undefined;
  const all = await getListings({ status: "all" });
  const curated = neighborhood.featuredListings ?? [];
  const inNeighborhood = all.filter((l) => l.neighborhood?.slug === slug);
  const listings = [
    ...curated.map((s) => all.find((l) => l.slug === s)).filter((l): l is Listing => Boolean(l)),
    ...inNeighborhood.filter((l) => !curated.includes(l.slug)),
  ];
  const events = await getUpcomingEvents({ market: neighborhood.market, limit: 4 });
  return { neighborhood, listings, events, market: getMarket(neighborhood.market) };
}

export async function getNeighborhoodSlugs(): Promise<string[]> {
  return (await getNeighborhoods()).map((n) => n.slug);
}

/* ---- Blog ---------------------------------------------------------------- */

export async function getPosts(limit?: number): Promise<Post[]> {
  const posts = await (await source()).posts();
  return limit ? posts.slice(0, limit) : posts;
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getPosts()).map((p) => p.slug);
}
