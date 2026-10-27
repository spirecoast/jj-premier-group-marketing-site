import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";
import { site } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The tools page: the three products, on its masthead photograph. */
export default function Image() {
  return brandOgImage({
    eyebrow: site.region,
    title: "Atlas, Encore and Tide",
    meta: "Neighborhoods, the arts calendar, and what homes sold for",
    photo: "/images/library/place-barrier-island.jpg",
  });
}
