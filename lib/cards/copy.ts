/**
 * Every word on the social cards and in their captions, filled from the data by lib/cards/data.ts.
 * No imports beyond types, so scripts/check-copy.mjs can run them through the Fair Housing list and
 * the house rules (places, never people; no superlatives; figures only from the data).
 */

export type CardKind = "tide" | "week" | "place" | "street";
export type CardSize = "feed" | "story";

/** Feed is Instagram's 4:5 portrait; story is 9:16. */
export const CARD_SIZES: Record<CardSize, { width: number; height: number; label: string }> = {
  feed: { width: 1080, height: 1350, label: "Feed, 1080 × 1350" },
  story: { width: 1080, height: 1920, label: "Story, 1080 × 1920" },
};

export const CARDS_COPY = {
  pageTitle: "Cards to post",
  pageLead:
    "Each card is drawn from the site’s own data and photographs, with the Coldwell Banker mark and the short address of the page your post sends people to. Pick where you’re posting, download the size you need, and copy the caption.",
  channelLabel: "Posting on",
  download: { feed: "Download for the feed", story: "Download for a story" },
  captionLabel: "Caption",
  held: "This caption didn’t pass the Fair Housing check, so the card is held. Tell Josh which card it was.",
  placeLabel: "A neighborhood",
  placeHint: "Type its name as Atlas spells it, for example Country Club East.",
  placeNone: (q: string) => `Atlas has no researched place called “${q}”. Try the name as its page spells it.`,
  streetLabel: "A street",
  streetHint: "The street name with its ending, for example Palmer Blvd. Add the ZIP if the name is common.",
  streetNone: (q: string) => `No sales on “${q}” in the county records for that window. Check the spelling, or add the ZIP.`,
  show: "Show the card",
  tide: {
    eyebrow: (issue: string) => `Tide · ${issue}`,
    title: "What homes sold for on the coast",
    rowNote: (data: string) => `Median sale price, ${data}, from the county property appraisers’ records`,
    caption: (issue: string, data: string, url: string) =>
      `Tide for ${issue}: what homes sold for in Lakewood Ranch, Sarasota and Bradenton in ${data}, from the county property appraisers’ records. The full report is at ${url}`,
    missing: "The latest Tide issue has no figures yet.",
  },
  week: {
    eyebrow: "Encore Arts Calendar",
    title: "This week on the coast",
    caption: (from: string, to: string, n: number, url: string) =>
      `This week on the coast, ${from} to ${to}: ${n} picks from the Encore Arts Calendar, theater, music and art in Lakewood Ranch, Sarasota and Bradenton. Dates and tickets come from the venues. Every show is at ${url}`,
    missing: "Nothing on the calendar this week yet.",
  },
  place: {
    eyebrow: (where: string) => `Atlas · ${where}`,
    caption: (name: string, where: string, url: string) =>
      `${name}, ${where}. The county, the HOA and CDD on record, the evacuation zone and the water, each from its source, on Atlas: ${url}`,
  },
  street: {
    eyebrow: "Tide Street",
    title: (street: string) => `Sold on ${street}`,
    count: (n: number, months: number) => `${n} ${n === 1 ? "sale" : "sales"} in the last ${months} months`,
    median: "Median sale price",
    caption: (street: string, n: number, months: number, url: string) =>
      `${street}: ${n} ${n === 1 ? "sale" : "sales"} in the last ${months} months, from the county property appraisers’ records. Look up your own street at ${url}`,
  },
  source: "From the county property appraisers’ records",
} as const;

/** The caption and card words with sample fills, for scripts/check-copy.mjs. */
export function cardStrings(): { where: string; text: string }[] {
  const c = CARDS_COPY;
  const u = "jjpremiergroup.com/from/instagram";
  return [
    { where: "lib/cards/copy.ts: pageTitle", text: c.pageTitle },
    { where: "lib/cards/copy.ts: pageLead", text: c.pageLead },
    { where: "lib/cards/copy.ts: held", text: c.held },
    { where: "lib/cards/copy.ts: placeHint", text: c.placeHint },
    { where: "lib/cards/copy.ts: placeNone", text: c.placeNone("Example") },
    { where: "lib/cards/copy.ts: streetHint", text: c.streetHint },
    { where: "lib/cards/copy.ts: streetNone", text: c.streetNone("Example St") },
    { where: "lib/cards/copy.ts: tide.title", text: c.tide.title },
    { where: "lib/cards/copy.ts: tide.rowNote", text: c.tide.rowNote("September 2026") },
    { where: "lib/cards/copy.ts: tide.caption", text: c.tide.caption("October 2026", "September 2026", u) },
    { where: "lib/cards/copy.ts: week.caption", text: c.week.caption("Nov 2", "Nov 8", 6, u) },
    { where: "lib/cards/copy.ts: place.caption", text: c.place.caption("Example Place", "Lakewood Ranch", u) },
    { where: "lib/cards/copy.ts: street.caption", text: c.street.caption("Example St", 4, 24, u) },
  ];
}
