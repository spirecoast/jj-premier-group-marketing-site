import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";
import { site } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The home page share card, and the source of the site-wide fallback in public/og-image.png. */
export default function Image() {
  return brandOgImage({
    eyebrow: site.region,
    title: "Your next home is waiting.",
    meta: `Joelyn Nauman and Jessica Garza, a mother and daughter team with ${site.brokerage}.`,
    photo: "/images/library/gulf-beach-aerial.jpg",
  });
}
