/**
 * The words on the channel landing pages (/from/youtube, /from/instagram,
 * /from/facebook, /from/nextdoor): the links in the team's bios and posts.
 *
 * Plain strings and no runtime imports (a type only), so scripts/check-copy.mjs can load this file
 * and run the Fair Housing check over every sentence. Places, never people;
 * no figures; nothing promised that the site doesn't do (it never emails a
 * visitor, and it shows no reviews until real ones exist).
 */

import type { LeadChannel } from "../leads";

export type ChannelSlug = LeadChannel;

export type ChannelCopy = {
  slug: ChannelSlug;
  /** The network's own name. */
  name: string;
  /** The <title>, before the site suffix. */
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  /** The one short line in the team's voice. */
  line: string;
  /** The one primary action. */
  cta: { href: "/relocate" | "/sell/sold"; label: string; note: string };
  /** A photograph from the seed library (lib/content/seed), by name. */
  image: { name: string; alt: string; position?: string };
};

const RELOCATE_NOTE = "Six questions, no email, and every rule in the plan comes with its source.";
const SOLD_NOTE = "From the county property appraisers’ records. No sign-up, and no algorithm guessing.";

export const CHANNELS: Record<ChannelSlug, ChannelCopy> = {
  youtube: {
    slug: "youtube",
    name: "YouTube",
    title: "From YouTube · Plan the move",
    description:
      "You’ve watched the coast; here’s the next step. The relocation planner turns six questions into a dated plan for a move to Lakewood Ranch, Sarasota or Bradenton.",
    eyebrow: "From YouTube",
    heading: "You’ve seen the coast. Now plan the move.",
    line: "We’re Joelyn and Jessica. If one of our videos has you thinking about Lakewood Ranch, Sarasota or Bradenton, start here: tell the planner when you’re coming and it puts the whole move on a calendar, from the contract deadlines to the week the insurance has to be bound.",
    cta: { href: "/relocate", label: "Plan the move", note: RELOCATE_NOTE },
    image: { name: "library/place-skyway-bridge", alt: "The Sunshine Skyway Bridge over Tampa Bay, from above", position: "50% 55%" },
  },
  instagram: {
    slug: "instagram",
    name: "Instagram",
    title: "From Instagram · Where to start",
    description:
      "Thanks for following along. Moving here from somewhere else? The relocation planner turns six questions into a dated plan for the move.",
    eyebrow: "From Instagram",
    heading: "Thanks for following along. Here’s where to start.",
    line: "Moving here from somewhere else? The relocation planner asks six questions and gives you the move on a calendar: the contract deadlines, the week insurance has to be bound, and when homestead comes into it.",
    cta: { href: "/relocate", label: "Plan the move", note: RELOCATE_NOTE },
    image: { name: "library/lwr-waterside-promenade", alt: "The lakeside promenade at Waterside Place in Lakewood Ranch, at dusk" },
  },
  facebook: {
    slug: "facebook",
    name: "Facebook",
    title: "From Facebook · What sold on your street",
    description:
      "Wondering what your home’s worth? Start with what sold on your street, from the county’s public record: address, date, price and living area.",
    eyebrow: "From Facebook",
    heading: "Wondering what your home’s worth? Start with your street.",
    line: "Type in your street and you’ll see the sales the county recorded there: the address, the date, the price and the living area. It’s the public record, not an estimate.",
    cta: { href: "/sell/sold", label: "See what sold on your street", note: SOLD_NOTE },
    image: { name: "library/listing-exterior-canal-golden", alt: "Homes on canals by the water, from above" },
  },
  nextdoor: {
    slug: "nextdoor",
    name: "Nextdoor",
    title: "From Nextdoor · What sold on your street",
    description:
      "Hi, neighbor. See what sold on your street from the county’s public record, then ask us anything about it.",
    eyebrow: "From Nextdoor",
    heading: "Hi, neighbor. Here’s what sold on your street.",
    line: "We’re Joelyn and Jessica, with Coldwell Banker Realty. Type in your street and you’ll see what the county recorded there: the address, the date, the price and the living area. If you’d like to know what it means for your house, ask us.",
    cta: { href: "/sell/sold", label: "See what sold on your street", note: SOLD_NOTE },
    image: { name: "library/lakes-aerial-sunset", alt: "Lakefront streets from the air at sunset" },
  },
};

/** The three things under the primary action, the same on every channel page. */
export const MORE = {
  eyebrow: "While you’re here",
  heading: "Three more ways in.",
  atlas: {
    name: "Atlas match",
    line: "Atlas asks ten questions about the place and none about you. It narrows every neighborhood on the map to the ones whose facts fit: county, gating, association, CDD, water and evacuation zone.",
    href: "/neighborhoods/match",
    label: "Try Atlas match",
  },
  encore: {
    name: "Encore · Plan a visit",
    line: "Coming down to look at homes? Give Encore your dates and get each day planned: showings from ten to four, then the evening’s theater, music and openings.",
    href: "/calendar/plan",
    label: "Plan a visit",
  },
  tide: {
    name: "Tide · Once a month",
    line: "Tide tells you what happened on streets like yours this month, in plain language. It’s one email, and you can stop any time.",
    label: "Send me Tide",
  },
  talk: "Rather talk? Call or text us.",
} as const;

export function channelStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const c of Object.values(CHANNELS)) {
    const add = (where: string, text: string) => out.push({ where: `from/${c.slug}: ${where}`, text });
    add("title", c.title);
    add("description", c.description);
    add("eyebrow", c.eyebrow);
    add("heading", c.heading);
    add("line", c.line);
    add("cta label", c.cta.label);
    add("cta note", c.cta.note);
    add("image alt", c.image.alt);
  }
  const add = (where: string, text: string) => out.push({ where: `from/*: ${where}`, text });
  add("more eyebrow", MORE.eyebrow);
  add("more heading", MORE.heading);
  for (const k of ["atlas", "encore", "tide"] as const) {
    add(`${k} name`, MORE[k].name);
    add(`${k} line`, MORE[k].line);
    add(`${k} label`, MORE[k].label);
  }
  add("talk", MORE.talk);
  return out;
}
