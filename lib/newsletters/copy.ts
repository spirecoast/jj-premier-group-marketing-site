/**
 * The words of /newsletters and of Encore's web issue (/calendar/letters/<monday>).
 * The issue's own sentences (its title, intro and headings) come from the
 * email's templates in lib/issues/copy.ts, so the page says what the email
 * says; these are only the words around them.
 *
 * No imports, so scripts/check-copy.mjs can load this file and run the Fair
 * Housing check and the house rules over every string.
 */

export const NEWSLETTERS_COPY = {
  metaTitle: "Newsletters",
  description: "Tide, the monthly market report for Lakewood Ranch, Sarasota and Bradenton, and Encore, the Monday email of the week’s shows, concerts and openings.",
  heading: "Two newsletters, Tide and Encore",
  lead: "One on what homes sold for here, once a month. One on the week’s shows, concerts and openings, every Monday. Read them here, or get them by email.",
  ogEyebrow: "Newsletters",
  ogMeta: "Tide once a month · Encore every Monday",

  tideOften: "Once a month",
  tideWhat:
    "What homes sold for in Lakewood Ranch, Sarasota and Bradenton each month, from the county’s public record, and what it means if you’re buying or selling.",
  tideLink: "The newest issue",
  tideNext: "The next issue comes out at the start of {month}.",
  tideAskHeading: "Get Tide by email",
  tideAskBody: "One email a month. You can stop any time, and we never share the list.",

  encoreOften: "Every Monday",
  encoreWhat:
    "The week ahead from the Encore Arts Calendar: up to {max} shows, concerts and openings, spread across Lakewood Ranch, Sarasota and Bradenton, and the exhibitions on view.",
  encoreLink: "The full calendar",
  encoreNext: "The next issue comes out {day}.",
  encoreAskHeading: "Get Encore by email",
  encoreAskBody: "One email every Monday. You can stop any time, and we never share the list.",
  encoreAskButton: "Send me Encore",

  /** An Encore issue's tile. */
  cardTitle: "Encore, {range}",
  cardData: "{picks} picks from {performances} performances",
  cardDataEmpty: "What’s on view this week",
  coverWordmark: "Arts Calendar",
  coverPlaces: "Lakewood Ranch · Sarasota · Bradenton",
} as const;

/** Encore's web issue: the words around the email's own. */
export const LETTER_COPY = {
  metaTitle: "Encore, the week of {range}",
  description: "Encore for the week of {range}: {picks} picks from the {performances} performances on the arts calendar in Lakewood Ranch, Sarasota and Bradenton.",
  descriptionEmpty: "Encore for the week of {range}: the exhibitions on view in Lakewood Ranch, Sarasota and Bradenton, from the arts calendar.",
  ogEyebrow: "Encore · Every Monday",
  ogMeta: "{picks} picks from {performances} performances",
  signupHeading: "Get Encore every Monday.",
  signupBody: "The week’s shows, concerts and openings come in one email every Monday.",
  otherWeeks: "Other weeks",
  allNewsletters: "All the newsletters",
} as const;

/** Every string above, with where it lives, for scripts/check-copy.mjs. */
export function newslettersStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const [group, obj] of Object.entries({ NEWSLETTERS_COPY, LETTER_COPY })) {
    for (const [k, v] of Object.entries(obj)) out.push({ where: `lib/newsletters/copy.ts ${group}.${k}`, text: v });
  }
  return out;
}
