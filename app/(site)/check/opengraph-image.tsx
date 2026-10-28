import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Atlas Check",
    title: "The flood zone and evacuation zone for an address.",
    meta: "From the county’s and FEMA’s public maps · Manatee and Sarasota",
    photo: "/images/library/palm-lined-street.jpg",
  });
}
