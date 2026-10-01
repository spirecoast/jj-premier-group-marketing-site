import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "What your house is worth",
    title: "The public record, then the walk-through.",
    meta: "No algorithm guess. The county's record for your address, first.",
    photo: "/images/library/listing-exterior-canal-golden.jpg",
  });
}
