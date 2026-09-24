import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Buying on the Suncoast",
    title: "Two questions before we look at anything.",
    meta: "When do you need to be in, and is there a house to sell first?",
    photo: "/images/library/kitchen-navy-island.jpg",
  });
}
