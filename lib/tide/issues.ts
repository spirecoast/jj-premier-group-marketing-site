/**
 * Every Tide issue on the site, newest first. One line per issue.
 *
 * - `issue`: the month the issue goes out (YYYY-MM). The page is /tide/<issue>.
 * - `data`: the month the figures cover. Leave it out while drafting and the
 *   page takes the latest month the county record has complete in all three
 *   markets, looking back from the month before the issue (lib/tide/issue.ts).
 *   Write it in once the issue is out, so a later data refresh (which makes the
 *   next month complete) doesn't move a published issue on to that month.
 * - `commentary`: the two paragraphs Joelyn and Jessica write for "What it
 *   means". Until it's here the section shows only in sample previews
 *   (NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true), as a marked placeholder.
 *
 * Next month's issue is one more line at the top, e.g. { issue: "2026-11" }.
 * Nothing here is a figure: every number on the page is computed from the
 * county sales in data/sales (docs/ISSUES.md, "The web issue").
 */
export type TideIssueEntry = {
  issue: string;
  data?: string;
  commentary?: string[];
};

export const TIDE_ISSUES: readonly TideIssueEntry[] = [
  {
    issue: "2026-10",
    data: "2026-07",
    commentary: [
      "July was busier than a typical month in Sarasota and Bradenton and quieter in Lakewood Ranch. Sarasota and Bradenton each recorded about 12% more qualified home sales than usual, while Lakewood Ranch recorded about 13% fewer. In Lakewood Ranch nearly half of the sales were new builds or parcels still on the roll as vacant, about the same share as in a typical month.",
      "The median price rose in all three markets, by about 2% in Lakewood Ranch, 3% in Sarasota and 6% in Bradenton. The median price per square foot hardly moved in any of them, which points to larger homes selling in July rather than buyers paying more for the same space. If you're pricing a house this fall, watch the price per square foot on your own street, not the headline median.",
    ],
  },
];

export function getIssueEntry(issue: string): TideIssueEntry | undefined {
  return TIDE_ISSUES.find((e) => e.issue === issue);
}

export const isIssueMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
