import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";
import { REVIEWS } from "@/lib/reviews/copy";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The reviews page: its heading, with Joelyn and Jessica. */
export default function Image() {
  return brandOgImage({
    eyebrow: "Joelyn & Jessica",
    title: REVIEWS.heading,
    photo: "/images/photos/duo-whitenavy-wide.jpg",
  });
}
