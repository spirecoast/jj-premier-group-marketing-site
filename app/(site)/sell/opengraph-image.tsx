import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Selling on the Suncoast",
    title: "The sold price, not the list.",
    meta: "A number, the sales behind it, and a plan for the first weekend.",
    photo: "/images/library/modern-home-pool-dusk.jpg",
  });
}
