import type { Route } from "next";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";
import { productFamilies, type ProductFamily } from "@/lib/site";

/**
 * The products as cards: the names, families and lines from
 * productFamilies in lib/site.ts, with the photograph each tool's own page
 * opens with, so a card and its page match.
 */
export type Family = ProductFamily["key"];

export type Tool = {
  id: string;
  family: Family;
  name: string;
  href: Route;
  line: string;
  image: ImageRef;
};

const IMAGES: Record<string, ImageRef> = {
  atlas: img("library/golf-course-lakes-aerial", "Fairways and lakes between houses, from above", "50% 50%"),
  "atlas-match": img("library/lwr-fairways-bay-aerial", "Fairways, lakes and rooftops from the air", "50% 55%"),
  "atlas-move": img("library/lakes-aerial-sunset", "Lakefront streets from the air at sunset", "50% 50%"),
  encore: img("library/culture-opera-house-red-seats", "Rows of red velvet seats in an opera house, empty before the show", "50% 58%"),
  "encore-planner": img("library/sarasota-bayfront-blue-hour", "The Sarasota bayfront lit up at dusk", "50% 55%"),
  tide: img("library/venice-pier-sunrise", "A fishing pier reaching into the Gulf at sunrise", "62% 55%"),
  "tide-street": img("library/listing-twilight-exterior-pool", "A one-story house behind its pool, under a blue sky", "50% 60%"),
  "tide-sale-calculator": img("library/kitchen-navy-island", "A navy kitchen island with woven stools under pendant lights", "40% 55%"),
};

export const FAMILIES = Object.fromEntries(productFamilies.map((f) => [f.key, f])) as Record<Family, ProductFamily>;
export const FAMILY_ORDER: Family[] = productFamilies.map((f) => f.key);

export const TOOLS: Tool[] = productFamilies.flatMap((f) =>
  f.items.map((i) => {
    const image = IMAGES[i.id];
    if (!image) throw new Error(`No photograph for ${i.id}`);
    return { id: i.id, family: f.key, name: i.label, href: i.href as Route, line: i.line, image };
  }),
);

export function tool(id: string): Tool {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) throw new Error(`No tool ${id}`);
  return t;
}
