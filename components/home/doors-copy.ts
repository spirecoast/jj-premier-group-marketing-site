import type { Route } from "next";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";

/**
 * Buyer, seller, or moving here: three photographs, a word or two on each,
 * each opening its own page. Nothing else sits on or around them.
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
  // The out-of-state buyer's door, by its task: the client's lake aerial, which the buyer's guide also uses for "Plan the move".
  { href: "/relocate", title: "Moving here", image: img("library/lakes-aerial-sunset", "Lakefront streets from the air at sunset", "50% 55%") },
];
