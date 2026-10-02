import type { Route } from "next";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";

/**
 * 03 · Buy or sell: the two doors' copy, kept apart from the layout so every
 * treatment in ./variants reads the same words. One line each on what
 * happens first, and a quiet second link under each: the planner for people
 * arriving from somewhere else, and the county record for people with a
 * street to check.
 */
export type Door = {
  href: Route;
  title: string;
  first: string;
  cta: string;
  also: { href: Route; label: string };
  /** The moment behind the door, for the photo treatment. */
  image: ImageRef;
};

export const DOORS: Door[] = [
  {
    href: "/buy",
    title: "I’m buying",
    first:
      "First, one call and two questions: when do you need to be in, and is there a house to sell first? Those two answers set everything else.",
    cta: "How buying goes",
    also: { href: "/relocate", label: "Moving here from somewhere else?" },
    image: img("library/moment-crossing-room", "Morning sun through white curtains", "50% 50%"),
  },
  {
    href: "/sell",
    title: "I’m selling",
    first:
      "First, we come to the house, both of us, and walk it the way a buyer will. You get the number in writing that day or the next, with the sales behind it.",
    cta: "How selling goes",
    also: { href: "/sell/sold", label: "What sold on your street" },
    image: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 60%"),
  },
];

export const DOORS_TITLE = "Tell us which one, and we’ll start there.";
