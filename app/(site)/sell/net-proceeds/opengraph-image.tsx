import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Selling · Net proceeds",
    title: "What you’d walk away with.",
    meta: "Doc stamps, title, prorations, payoff: the sheet before the listing.",
    photo: "/images/library/moment-contract.jpg",
  });
}
