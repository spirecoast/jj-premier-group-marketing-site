import type { ImageRef } from "../content/types";
import { IMAGE_DIMS } from "../content/image-dims";

/**
 * The Tide cover photographs: three free Adobe Stock photos (docs/SITE.md has
 * their stock IDs), 2400px wide so they stay sharp full-bleed under the
 * harbor wash. Each issue takes one by its month, so consecutive issues
 * rotate: March, June, September and December take the first, January,
 * April, July and October the second (the jetties at golden hour).
 */
const COVERS: { src: string; alt: string; position: string }[] = [
  {
    src: "/images/tide/tide-1.jpg",
    alt: "Aerial view over a bayfront marina full of boats, a park and shoreline in the foreground, mid-rise towers behind and open bay water to the horizon under a soft evening sky.",
    position: "50% 50%",
  },
  {
    src: "/images/tide/tide-2.jpg",
    alt: "Golden-hour aerial of a Gulf inlet between two rock jetties, a long white-sand beach curving away and a tall pink-lit cloud over calm water dotted with boats.",
    position: "55% 45%",
  },
  {
    src: "/images/tide/tide-3.jpg",
    alt: "Young red mangroves standing on prop roots in shallow water over a rippled tidal flat, a dense mangrove fringe and soft blue clouds behind.",
    position: "50% 55%",
  },
];

/** The cover for an issue month (YYYY-MM). */
export function tideCover(issue: string): ImageRef {
  const month = Number(issue.slice(5, 7)) || 1;
  const c = COVERS[month % COVERS.length]!;
  const dims = IMAGE_DIMS[c.src];
  if (!dims) throw new Error(`Tide cover missing from lib/content/image-dims.ts: ${c.src}`);
  return { src: c.src, alt: c.alt, width: dims.width, height: dims.height, position: c.position };
}
