import { deployEnv } from "@/lib/deploy-env";
import type { ContentSource } from "./source";
import { LISTINGS } from "./seed/listings";
import { encoreEvents, encoreVenues } from "./encore";
import { NEIGHBORHOODS } from "./seed/neighborhoods";
import { POSTS } from "./seed/posts";
import { TEAM } from "./seed/team";
import { SITE_SETTINGS, TESTIMONIALS } from "./seed/settings";

/**
 * The sample listings and the sample market reports show only when asked for
 * (NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true) and never on the production
 * deployment, whatever the variable says there: nothing hand-typed reaches
 * the live site.
 */
export function showSampleContent(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS === "true" && deployEnv(env) !== "production";
}

/**
 * Local sample content. Serves the site until a Sanity project is
 * configured, and remains the source for tests and previews.
 */
export const seedSource: ContentSource = {
  name: "seed",
  async listings() {
    // Sample listings stay in the seed for previews and tests, but nothing
    // hand-typed reaches the site. They return the day a listing feed is wired in.
    return showSampleContent() ? LISTINGS : [];
  },
  async events() {
    const { loadEncoreSnapshot } = await import("@/lib/encore/live");
    return encoreEvents(new Date(), await loadEncoreSnapshot());
  },
  async venues() {
    const { loadEncoreSnapshot } = await import("@/lib/encore/live");
    return encoreVenues(await loadEncoreSnapshot());
  },
  async neighborhoods() {
    return NEIGHBORHOODS;
  },
  async posts() {
    // The sample market reports carry sample figures; only the guides ship until real reports are written.
    const show = showSampleContent();
    return [...POSTS]
      .filter((p) => show || !p.categories.includes("Market report"))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
