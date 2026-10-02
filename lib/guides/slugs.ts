/**
 * The guides rebuilt as structured long-form pages under /guides. Kept
 * dependency-free so next.config.ts can import it for the /blog redirects
 * and the content layer can point cards at the new route.
 */
export const REBUILT_GUIDE_SLUGS = [
  "flood-zones-and-elevation-certificates-on-the-suncoast",
  "selling-a-home-you-dont-live-in",
  "thinking-about-spring-start-in-october",
] as const;

export function isRebuiltGuide(slug: string): boolean {
  return (REBUILT_GUIDE_SLUGS as readonly string[]).includes(slug);
}

/** Where a guide lives now: /guides for a rebuilt one, /blog for the rest. */
export function guideHref(slug: string): `/guides/${string}` | `/blog/${string}` {
  return isRebuiltGuide(slug) ? `/guides/${slug}` : `/blog/${slug}`;
}
