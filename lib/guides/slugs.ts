/**
 * The guides rebuilt as structured long-form pages under /guides. Kept
 * dependency-free so next.config.ts can import it for the /blog redirects
 * and the content layer can point cards at the new route.
 */
export const REBUILT_GUIDE_SLUGS = [
  "flood-zones-and-elevation-certificates-on-the-suncoast",
  "homestead-save-our-homes-and-portability",
  "homeowners-wind-and-flood-insurance-on-this-coast",
  "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton",
  "selling-a-home-you-dont-live-in",
  "thinking-about-spring-start-in-october",
  "cdd-fees-in-lakewood-ranch-village-by-village",
  "condo-and-hoa-documents-after-the-2022-law",
  "what-to-ask-before-you-buy-in-a-gated-community",
  "inspections-on-the-suncoast-what-a-good-one-covers",
  "barrier-island-rules-island-by-island",
  "getting-here-and-getting-around",
] as const;

/**
 * Posts that were folded into a rebuilt guide: the old /blog path answers
 * with a permanent redirect to the guide that carries the topic now.
 * "Ask us about the water table" (May 2026) covered the flood zones the
 * flood guide explains with sources; the guide is the one page for it.
 */
export const FOLDED_POSTS: Readonly<Record<string, (typeof REBUILT_GUIDE_SLUGS)[number]>> = {
  "ask-us-about-the-water-table": "flood-zones-and-elevation-certificates-on-the-suncoast",
};

export function isRebuiltGuide(slug: string): boolean {
  return (REBUILT_GUIDE_SLUGS as readonly string[]).includes(slug);
}

/** Where a guide lives now: /guides for a rebuilt one (or the one a post folded into), /blog for the rest. */
export function guideHref(slug: string): `/guides/${string}` | `/blog/${string}` {
  const folded = FOLDED_POSTS[slug];
  if (folded) return `/guides/${folded}`;
  return isRebuiltGuide(slug) ? `/guides/${slug}` : `/blog/${slug}`;
}
