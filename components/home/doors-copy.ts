import type { Route } from "next";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";

/**
 * Buyer or seller: two photographs, one word on each, each opening its own
 * page. Nothing else sits on or around them.
 */
export type Door = {
  href: Route;
  title: string;
  /** What the photograph shows; the link itself is named by the title. */
  image: ImageRef;
};

export const DOORS: Door[] = [
  // Jessica's pick (Slack, Oct 8). It looks generated, and where it came from isn't known (docs/SITE.md).
  { href: "/buy", title: "Buyer", image: img("library/buyer-lakefront-house", "A white house with a tile roof beside the water, palms by the terrace", "50% 55%") },
  // A licensed, non-generative stand-in for Jessica's seller pick, which was a watermarked Adobe Stock preview.
  { href: "/sell", title: "Seller", image: img("library/living-oceanfront-white", "A living room of white sofas under a chandelier, with a glass wall open to the sea", "60% 55%") },
];
