import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "What sold on your street",
    title: "The public record, by street.",
    meta: "Qualified sales from the county appraiser, the last 24 months.",
    photo: "/images/library/lwr-lakefront-row.jpg",
  });
}
