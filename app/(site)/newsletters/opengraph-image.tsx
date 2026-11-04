import { NEWSLETTERS_COPY as C } from "@/lib/newsletters/copy";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** /newsletters: its heading and how often each letter comes, on the bayfront at dusk from Tide's covers. */
export default function Image() {
  return brandOgImage({
    eyebrow: C.ogEyebrow,
    title: C.heading,
    meta: C.ogMeta,
    photo: "/images/tide/tide-1.jpg",
  });
}
