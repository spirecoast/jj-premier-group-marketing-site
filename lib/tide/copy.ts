/**
 * Every sentence on the Tide web issue (/tide/<issue>), the archive card and
 * the /tide index, as templates with {tokens}. The builder in lib/tide/issue.ts
 * fills them with computed values and nothing else. No imports, so
 * scripts/check-copy.mjs can run the Fair Housing checker and the issue rules
 * (no superlatives, no license numbers) over them at build time.
 *
 * Voice: the guide's, with contractions. No adjective on a number; places,
 * never people.
 */

export const TIDE_WEB_COPY = {
  wordmark: "Tide",
  eyebrow: "Tide · The monthly issue",
  title: "Tide, {issue}",
  note: "The county record runs behind, so the figures in this issue cover {data}, the latest month that’s complete for all three markets.",
  noteLatest: "The county record runs behind, so the figures in this issue cover {data}.",
  intro: "Every figure on this page is computed from the qualified home sales the two county property appraisers have published. None is typed by hand.",

  marketsHeading: "The three markets in {data}",
  marketsIntro: "Each figure sits over its typical month: the median of the twelve months before {data}.",
  figureSales: "Qualified home sales",
  figureMedian: "Median price, homes",
  figurePpsf: "Median $/sq ft",
  figureNew: "New build or vacant on the roll",
  typical: "Typical month {value}",
  typicalNone: "No typical month yet",
  sampleHomes: "Over {n} homes",
  sampleSqft: "Over {n} homes with a living area",
  sampleNew: "{n} of {count} sales",
  marketLink: "More on {market}",

  chartsHeading: "Twelve months on the record",
  chartsEyebrow: "{from} to {to}",
  salesChartTitle: "Closed home sales by month",
  salesChartNote: "Qualified home sales per month, {from} to {to}. The axis starts at zero.",
  salesAxis: "Sales per month",
  ppsfChartTitle: "Median price per square foot by month",
  ppsfChartNote: "Homes with a recorded living area, {from} to {to}. The axis starts at {min}, not at zero.",
  ppsfAxis: "Median $ per sq ft",
  axisStart: "Axis starts at {min}",
  tableMonth: "Month",
  tipSales: "{market}, {month}: {value} sales",
  tipPpsf: "{market}, {month}: {value} a sq ft",

  streetsHeading: "Where it sold",
  streetsIntro: "The five streets in each market with the most qualified home sales in {data}. A street needs two sales to be listed.",
  streetsNone: "No street had more than one sale.",
  streetSales: "{count} sales",

  whatHeading: "What it means",
  whatEyebrow: "Joelyn and Jessica",
  placeholderLabel: "Placeholder, not published",
  placeholder: "Joelyn and Jessica add two paragraphs here before publishing.",

  guidesHeading: "Guides this month",
  guidesIntro: "What we published in {issue}.",
  guidesNone: "We didn’t publish a new guide this month. The ones we have are in the archive.",
  guidesAll: "All the guides",

  askHeading: "Tide, by email",
  askBody: "Tide comes out on the first of each month. Unsubscribe any time. We never share the list.",
  source: "County property appraisers, public record, qualified sales, as of {asOf}.",

  cardEyebrow: "Tide · Monthly issue",
  cardExcerpt: "What the county record shows for {data} in Lakewood Ranch, Sarasota and Bradenton.",
  cardData: "Figures for {data}",
  ogMeta: "Figures for {data} · County records",
  description: "Tide for {issue}: what the county record shows for {data} in Lakewood Ranch, Sarasota and Bradenton, with every figure computed from the public record.",

  everyIssue: "Every issue of Tide",
  indexEyebrow: "Tide · Every issue",
  indexTitle: "Each month’s issue is built from the county record.",
  indexLead: "Each issue covers the latest month the county property appraisers have complete for Lakewood Ranch, Sarasota and Bradenton. The guides are in the archive.",
  indexArchive: "The guides and the archive",
  indexDescription: "Every issue of Tide, the monthly letter on Lakewood Ranch, Sarasota and Bradenton, built from the county property appraisers’ qualified sales.",
} as const;

/** Every template above, with where it lives, for the Fair Housing and style checks. */
export function tideWebStrings(): { where: string; text: string }[] {
  return Object.entries(TIDE_WEB_COPY).map(([k, text]) => ({ where: `lib/tide/copy.ts TIDE_WEB_COPY.${k}`, text }));
}
