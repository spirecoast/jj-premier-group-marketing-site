import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Relocating",
    title: "Moving here from somewhere else.",
    meta: "Six questions, a dated plan, every rule with its source.",
    photo: "/images/library/place-skyway-bridge.jpg",
  });
}
