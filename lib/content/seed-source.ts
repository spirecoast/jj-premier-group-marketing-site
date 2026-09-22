import type { ContentSource } from "./source";
import { LISTINGS } from "./seed/listings";
import { buildEvents } from "./seed/events";
import { VENUES } from "./seed/venues";
import { NEIGHBORHOODS } from "./seed/neighborhoods";
import { POSTS } from "./seed/posts";
import { TEAM } from "./seed/team";
import { SITE_SETTINGS, TESTIMONIALS } from "./seed/settings";

/**
 * Local sample content. Serves the site until a Sanity project is
 * configured, and remains the source for tests and previews.
 */
export const seedSource: ContentSource = {
  name: "seed",
  async listings() {
    // Sample listings stay in the seed for previews and tests, but nothing
    // hand-typed reaches the site. They return the day a listing feed is wired in.
    return process.env.NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS === "true" ? LISTINGS : [];
  },
  async events() {
    return buildEvents();
  },
  async venues() {
    return VENUES;
  },
  async neighborhoods() {
    return NEIGHBORHOODS;
  },
  async posts() {
    return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },
  async team() {
    return [...TEAM].sort((a, b) => a.order - b.order);
  },
  async testimonials() {
    return TESTIMONIALS;
  },
  async settings() {
    return SITE_SETTINGS;
  },
};
