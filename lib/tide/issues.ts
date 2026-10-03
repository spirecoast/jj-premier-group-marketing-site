/**
 * Every Tide issue on the site, newest first, with its words.
 *
 * - `issue`: the month the issue goes out (YYYY-MM). The page is /tide/<issue>.
 * - `data`: the month the figures cover. Leave it out while drafting and the
 *   page takes the latest month the county record has complete in all three
 *   markets, looking back from the month before the issue (lib/tide/issue.ts).
 *   Write it in once the issue is out, so a later data refresh (which makes the
 *   next month complete) doesn't move a published issue on to that month.
 *
 * The narrative, in the site's voice and unsigned, written by hand each month
 * from the figures the page computes (docs/ISSUES.md, "Writing the narrative"):
 * - `opening`: one paragraph of two to four sentences that tells the month as
 *   something a person can picture;
 * - `buyers`, `sellers`: one paragraph each, two to four sentences, on what to
 *   do differently because of this month;
 * - `watch`: one or two things to look for next month, a sentence or two each.
 * Every number written in them must be one the page computes (to rounding):
 * lib/tide/narrative.test.ts checks each against the built issue.
 *
 * `commentary`: a short note from Joelyn and one from Jessica, in their own
 * words, signed with their names. Only they write these. Leave a slot out (or
 * empty) and the page doesn't show it; the email draft shows a dashed box for
 * them to fill.
 *
 * Next month's issue is one more entry at the top, e.g. { issue: "2026-11" }.
 * Until its narrative is written the page shows the figures under a one-line
 * framing, and the email draft lists the month's facts to write from.
 *
 * No imports, so scripts/check-copy.mjs can run the voice and Fair Housing
 * checks over every narrative at build time.
 */

export type TideCommentary = { joelyn?: string[]; jessica?: string[] };

export type TideIssueEntry = {
  issue: string;
  data?: string;
  opening?: string[];
  buyers?: string[];
  sellers?: string[];
  watch?: string[];
  commentary?: TideCommentary;
};

/** The two people who may sign a note, in the order the notes appear. */
export const TIDE_VOICES = [
  { key: "joelyn", name: "Joelyn Nauman", first: "Joelyn" },
  { key: "jessica", name: "Jessica Garza", first: "Jessica" },
] as const satisfies readonly { key: keyof TideCommentary; name: string; first: string }[];

export const TIDE_ISSUES: readonly TideIssueEntry[] = [
  {
    issue: "2026-10",
    data: "2026-07",
    opening: [
      "Picture someone house hunting in Bradenton in July. They had lots of company. There were 793 home sales there, 87 more than in a typical month, and the median price was $399,450. Sarasota was busy too, with 586 sales, while Lakewood Ranch had a slow month, with 241 sales, 13% fewer than usual.",
    ],
    buyers: [
      "The median price went up in all three places, by about 2% in Lakewood Ranch, 3% in Sarasota and 6% in Bradenton. But a square foot of house cost about the same as usual, at $279, $293 and $225. So the same house didn’t cost more. If a home you like is priced well above that for its size, ask why.",
    ],
    sellers: [
      "Buyers will judge your home by its price per square foot, so set your price from that. Sarasota and Bradenton each had about 12% more sales than in a typical month. Lakewood Ranch had 13% fewer, and 46% of its sales were new builds or lots. If you’re selling an older home there, price it knowing buyers can also buy new.",
    ],
    watch: [
      "Whether Bradenton stays busy. It had 1,080 sales in June, the most of any month in the last 12, and 793 in July.",
      "Whether Lakewood Ranch picks back up. It went from 274 sales in June to 241 in July.",
    ],
    commentary: {},
  },
];

export function getIssueEntry(issue: string): TideIssueEntry | undefined {
  return TIDE_ISSUES.find((e) => e.issue === issue);
}

export const isIssueMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** The narrative fields, in the order they appear, with their names. */
export const NARRATIVE_FIELDS = ["opening", "buyers", "sellers", "watch"] as const;

/** Every hand-written string in the list, with where it lives, for scripts/check-copy.mjs and the tests. */
export function tideNarrativeStrings(): { where: string; text: string; signed: boolean }[] {
  const out: { where: string; text: string; signed: boolean }[] = [];
  for (const e of TIDE_ISSUES) {
    for (const f of NARRATIVE_FIELDS) (e[f] ?? []).forEach((text, i) => out.push({ where: `lib/tide/issues.ts ${e.issue} ${f}[${i}]`, text, signed: false }));
    for (const v of TIDE_VOICES) (e.commentary?.[v.key] ?? []).forEach((text, i) => out.push({ where: `lib/tide/issues.ts ${e.issue} commentary.${v.key}[${i}]`, text, signed: true }));
  }
  return out;
}
