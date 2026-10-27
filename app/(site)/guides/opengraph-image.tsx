import { GUIDES } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The guides index: its heading and the count, on the photograph the page's band uses. */
export default function Image() {
  return brandOgImage({
    eyebrow: "Guides",
    title: "Guides for life on the Gulf Coast",
    meta: `${GUIDES.length} guides · Free, with no sign-up`,
    photo: "/images/library/kitchen-navy-island.jpg",
  });
}
