import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "What sold on your street",
    title: "See the public record, street by street.",
    meta: "Every qualified sale the county appraiser recorded in the last 24 months.",
    photo: "/images/library/listing-twilight-exterior-pool.jpg",
  });
}
