/**
 * The guides rebuilt as structured long-form pages under /guides. Kept
 * dependency-free so next.config.ts can import it for the /blog redirects
 * and the content layer can point cards at the new route.
 */
export const REBUILT_GUIDE_SLUGS = [
  "flood-zones-and-elevation-certificates-on-the-suncoast",
  "homestead-save-our-homes-and-portability",
  "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton",
  "selling-a-home-you-dont-live-in",
  "getting-your-house-ready-to-sell",
  "cdd-fees-in-lakewood-ranch-village-by-village",
  "what-to-ask-before-you-buy-in-a-gated-community",
  "inspections-on-the-suncoast-what-a-good-one-covers",
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

/**
 * Guides that moved to a clearer slug before launch, old to new. next.config.ts sends the old
 * /guides, /blog and PDF addresses to the new ones with a permanent redirect.
 */
export const MOVED_GUIDES: Readonly<Record<string, (typeof REBUILT_GUIDE_SLUGS)[number]>> = {
  "thinking-about-spring-start-in-october": "getting-your-house-ready-to-sell",
};

/**
 * Guides taken down at the owners' direction (their October 2026 review). Each one's page, its old
 * /blog link and its PDF answer with a permanent redirect to the closest guide still up, or to
 * /guides when no guide covers the topic now. next.config.ts reads this list.
 */
export const REMOVED_GUIDES: Readonly<Record<string, (typeof REBUILT_GUIDE_SLUGS)[number] | null>> = {
  // It repeated the flood guide's zones, certificate and flood policy; the flood guide is the one page for them now.
  "homeowners-wind-and-flood-insurance-on-this-coast": "flood-zones-and-elevation-certificates-on-the-suncoast",
  // The association's documents, budget and reserves are in the gated-community guide.
  "condo-and-hoa-documents-after-the-2022-law": "what-to-ask-before-you-buy-in-a-gated-community",
  // No guide covers the island-by-island rules now.
  "barrier-island-rules-island-by-island": null,
};

/** Where a removed guide's old address goes: the guide that carries the topic now, or the guides page. */
export function removedGuideTarget(slug: string): `/guides/${string}` | "/guides" | undefined {
  if (!Object.hasOwn(REMOVED_GUIDES, slug)) return undefined;
  const to = REMOVED_GUIDES[slug];
  return to ? `/guides/${to}` : "/guides";
}

export function isRebuiltGuide(slug: string): boolean {
  return (REBUILT_GUIDE_SLUGS as readonly string[]).includes(slug);
}

/** Where a guide lives now: /guides for a rebuilt one (or the one a post folded into, or the one a removed guide points at), /blog for the rest. */
export function guideHref(slug: string): `/guides/${string}` | "/guides" | `/blog/${string}` {
  const folded = FOLDED_POSTS[slug];
  if (folded) return `/guides/${folded}`;
  const removed = removedGuideTarget(slug);
  if (removed) return removed;
  return isRebuiltGuide(slug) ? `/guides/${slug}` : `/blog/${slug}`;
}
