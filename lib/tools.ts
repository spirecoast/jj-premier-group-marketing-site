import type { Route } from "next";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";

/**
 * The products, by family. Each line says what the tool does for the person
 * using it, in the words they'd search with. The photographs are the ones
 * each tool's own page opens with, so a card and its page match.
 */
export type Family = "atlas" | "encore" | "tide";

export type Tool = {
  id: string;
  family: Family;
  name: string;
  href: Route;
  line: string;
  image: ImageRef;
};

export const FAMILIES: Record<Family, { name: string; title: string; line: string }> = {
  atlas: { name: "Atlas", title: "Find where to live", line: "Every neighborhood in Lakewood Ranch, Sarasota and Bradenton, and a plan for the move." },
  encore: { name: "Encore", title: "Find what’s on", line: "Theater, music, galleries and talks across the three cities, and a plan for the days you choose." },
  tide: { name: "Tide", title: "Know the market", line: "What homes sold for, street by street, and what you’d keep if you sold yours." },
};

export const FAMILY_ORDER: Family[] = ["atlas", "encore", "tide"];

export const TOOLS: Tool[] = [
  {
    id: "atlas",
    family: "atlas",
    name: "Atlas",
    href: "/neighborhoods" as Route,
    line: "Every neighborhood on one map. Open one to see its HOA, CDD, water and evacuation zone.",
    image: img("library/golf-course-lakes-aerial", "Fairways and lakes between houses, from above", "50% 50%"),
  },
  {
    id: "atlas-match",
    family: "atlas",
    name: "Atlas Match",
    href: "/neighborhoods/match" as Route,
    line: "Answer up to ten quick questions and see the neighborhoods that fit.",
    image: img("library/lwr-fairways-bay-aerial", "Fairways, lakes and rooftops from the air", "50% 55%"),
  },
  {
    id: "atlas-move",
    family: "atlas",
    name: "Atlas Move",
    href: "/relocate" as Route,
    line: "Every date and deadline for your move on one page, from the contract to homestead.",
    image: img("library/lakes-aerial-sunset", "Lakefront streets from the air at sunset", "50% 50%"),
  },
  {
    id: "encore",
    family: "encore",
    name: "Encore",
    href: "/calendar" as Route,
    line: "Shows, concerts, gallery openings and talks in one calendar.",
    image: img("library/culture-opera-house-red-seats", "Rows of red velvet seats in an opera house, empty before the show", "50% 58%"),
  },
  {
    id: "encore-planner",
    family: "encore",
    name: "Encore Planner",
    href: "/calendar/plan" as Route,
    line: "Pick your dates and get the shows, concerts and openings for each day.",
    image: img("library/sarasota-bayfront-blue-hour", "The Sarasota bayfront lit up at dusk", "50% 55%"),
  },
  {
    id: "tide",
    family: "tide",
    name: "Tide",
    href: "/tide" as Route,
    line: "The monthly market report: what sold, for how much, and what it means if you’re buying or selling.",
    image: img("library/venice-pier-sunrise", "A fishing pier reaching into the Gulf at sunrise", "62% 55%"),
  },
  {
    id: "tide-street",
    family: "tide",
    name: "Tide Street",
    href: "/sell/sold" as Route,
    line: "Type your street and see every home sale on it, from the county’s public record.",
    image: img("library/listing-twilight-exterior-pool", "A one-story house behind its pool, under a blue sky", "50% 60%"),
  },
  {
    id: "tide-sale-calculator",
    family: "tide",
    name: "Tide Sale Calculator",
    href: "/sell/net-proceeds" as Route,
    line: "See what you’d keep after selling, once the commission, title, doc stamps and mortgage are paid.",
    image: img("library/kitchen-navy-island", "A navy kitchen island with woven stools under pendant lights", "40% 55%"),
  },
];

/** The four on the home page: one decision each, from choosing a place to selling. */
export const FEATURED = ["atlas-match", "atlas-move", "encore-planner", "tide-sale-calculator"] as const;

export function tool(id: string): Tool {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) throw new Error(`No tool ${id}`);
  return t;
}
