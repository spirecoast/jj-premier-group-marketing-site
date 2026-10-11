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
  { href: "/buy", title: "Buyer", image: img("library/living-oceanfront-white", "A living room of white sofas under a chandelier, with a glass wall open to the sea", "60% 55%") },
  { href: "/sell", title: "Seller", image: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 60%") },
];
