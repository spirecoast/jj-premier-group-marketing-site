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
  venues(): Promise<Venue[]>;
  neighborhoods(): Promise<Neighborhood[]>;
  posts(): Promise<Post[]>;
  team(): Promise<TeamMember[]>;
  testimonials(): Promise<Testimonial[]>;
  settings(): Promise<SiteSettings>;
}
