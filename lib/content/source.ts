import type { EventLookup } from "./encore";
import type {
  Event,
  Listing,
  Neighborhood,
  Post,
  SiteSettings,
  TeamMember,
  Testimonial,
  Venue,
} from "./types";

/**
 * A content source returns whole collections, normalised to the shared types.
 * Filtering, sorting and joins happen once, in lib/content/index.ts, so the
 * two sources cannot drift in behaviour.
 */
export interface ContentSource {
  name: "seed" | "sanity";
  listings(): Promise<Listing[]>;
  events(): Promise<Event[]>;
  /** One event's address, including one that has closed or moved (lib/content/encore.ts). Sources without history leave it out. */
  lookupEvent?(slug: string): Promise<EventLookup | undefined>;
  venues(): Promise<Venue[]>;
  /** A venue that has no page of its own (a placeholder or a home). */
  unlistedVenue?(slug: string): Promise<Venue | undefined>;
  neighborhoods(): Promise<Neighborhood[]>;
  posts(): Promise<Post[]>;
  team(): Promise<TeamMember[]>;
  testimonials(): Promise<Testimonial[]>;
  settings(): Promise<SiteSettings>;
}
