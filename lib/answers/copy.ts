/**
 * The words of the answer card on /search. No imports, so
 * scripts/check-copy.mjs can load this file and run the voice and Fair
 * Housing checks over every string.
 *
 * The three declines are the one place the site names schools, safety and
 * who lives where, and only to say it doesn't answer them and where the real
 * source is. scripts/copy-rules.mjs sets this file aside from the
 * places-not-people word list for that reason; the Fair Housing list and the
 * voice rules still run over it.
 */

export const ANSWER_COPY = {
  /** "From the Lakewood Ranch page", "From The Lake Club in Atlas". */
  from: "From {page}",
  readFaq: "Read it on the page",
  readGuide: "Read the guide",
  readPlace: "See it in Atlas",
  /** A fact's outside source: "Source: Manatee County GIS, checked Sep 23, 2026". */
  source: "Source: {source}, checked {date}",
  sourceLead: "Source:",
  checked: "checked {date}",
  /** For the results that follow a card. */
  resultsAfter: "More on the site",
  declines: {
    schools: {
      heading: "We don’t rate schools.",
      body: "Which schools serve a home goes by its address, and each district’s locator gives the zoned schools for any address.",
    },
    safety: {
      heading: "We don’t call a place safe or unsafe.",
      body: "The sheriff’s office, or the city police inside city limits, can tell you what’s been reported near an address. For storms and flooding, the evacuation level and the flood zone are facts we can show you.",
    },
    people: {
      heading: "We describe places, never the people in them.",
      body: "Ask us about the homes, the water, the HOA, the fees or the flood zone for any place, and we’ll show you where each fact comes from.",
    },
  },
  declineLinks: {
    manateeSchools: "Manatee school locator",
    sarasotaSchools: "Sarasota attendance zones",
    check: "Check an address",
    match: "Atlas Match",
    atlas: "Atlas Neighborhoods",
  },
  /** One more step after an evacuation fact. */
  checkAddress: "Check an exact address",
} as const;

/** Every string, for scripts/check-copy.mjs. */
export function answerStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const walk = (v: unknown, where: string) => {
    if (typeof v === "string") out.push({ where, text: v });
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`);
  };
  walk(ANSWER_COPY, "lib/answers/copy.ts: ANSWER_COPY");
  return out;
}
