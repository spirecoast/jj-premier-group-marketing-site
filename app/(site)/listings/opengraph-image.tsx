import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** "Find your home": the page's heading, on its hero photograph. */
export default function Image() {
  return brandOgImage({
    eyebrow: "Find your home",
    title: "Tell us what you’re looking for. We’ll do the looking.",
    meta: "Lakewood Ranch · Sarasota · Bradenton",
    photo: "/images/library/modern-home-pool-dusk.jpg",
  });
}
