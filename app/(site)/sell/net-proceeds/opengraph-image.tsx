import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Selling · Net proceeds",
    title: "What you’d walk away with.",
    meta: "One sheet before the listing covers doc stamps, title, prorations and payoff.",
    photo: "/images/library/moment-contract.jpg",
  });
}
