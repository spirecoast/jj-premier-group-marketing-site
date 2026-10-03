/**
 * Every fixed sentence on the Tide web issue (/tide/<issue>), the archive card
 * and the /tide index, as templates with {tokens}. The builder in
 * lib/tide/issue.ts fills them with computed values and nothing else. The
 * month's story isn't here: it's written by hand for each issue in
 * lib/tide/issues.ts. No imports, so scripts/check-copy.mjs can run the Fair
 * Housing checker, the issue rules (no superlatives, no license numbers) and
 * the voice rules (lib/voice.ts) over them at build time.
 *
 * Voice: plain, direct and warm, with contractions and short sentences. No
 * adjective on a number; places, never people. Nothing said for Joelyn or
 * Jessica: only their signed notes are theirs.
 */

export const TIDE_WEB_COPY = {
  wordmark: "Tide",
  eyebrow: "Tide · Once a month",
  title: "Tide, {issue}",
  /** The page's opening line until the month's story is written. */
  framing: "Here’s how home sales went in {data} in Lakewood Ranch, Sarasota and Bradenton, straight from the county’s public record.",
  note: "The county posts sales a few weeks late, so this issue looks back at {data}. That’s the newest month that’s complete for all three places.",
  noteLatest: "The county posts sales a few weeks late, so this issue looks back at {data}.",
  intro: "Every number here comes from the home sales in the county’s public record.",

  buyersHeading: "If you’re buying",
  sellersHeading: "If you’re selling",
  limits: "These are closed sales from county records. They don’t show asking prices, how long a home was for sale, or how many homes are for sale now.",

  marketsHeading: "The numbers for {data}",
  marketsIntro: "Under each number is a typical month, the middle of the 12 months before {data}. It shows whether this month ran high or low.",
  figureSales: "Home sales",
  figureMedian: "Median price",
  figurePpsf: "Median price per sq ft",
  figureNew: "New builds or lots",
  typical: "Typical month {value}",
  typicalNone: "No typical month yet",
  sampleHomes: "From {n} homes",
  sampleSqft: "From {n} homes with a size on record",
  sampleNew: "{n} of {count} sales",
  marketLink: "More on {market}",

  chartsHeading: "The last 12 months",
  chartsEyebrow: "{from} to {to}",
  salesChartTitle: "Home sales each month",
  salesChartNote: "Home sales each month, {from} to {to}. The axis starts at zero.",
  salesAxis: "Sales per month",
  ppsfChartTitle: "Median price per square foot each month",
  ppsfChartNote: "Homes with a size on record, {from} to {to}. The axis starts at {min}, not at zero, so small changes are easy to see.",
  ppsfAxis: "Median $ per sq ft",
  axisStart: "Axis starts at {min}",
  tableMonth: "Month",
  tipSales: "{market}, {month}: {value} sales",
  tipPpsf: "{market}, {month}: {value} a sq ft",

  streetsHeading: "The busiest streets",
  streetsIntro: "The 5 streets in each place with the most home sales in {data}. A street needs at least 2 sales to make the list.",
  streetsNone: "No street had more than one sale.",
  streetSales: "{count} sales",

  watchHeading: "What to watch next month",

  notesHeading: "From Joelyn and Jessica",
  notesEyebrow: "In their own words",
  noteSign: "{name}",
  placeholderLabel: "Placeholder, not published",
  notePlaceholder: "{first} can add a few sentences here, in her own words. Until she does, this box doesn’t show on the site.",

  guidesHeading: "New guides this month",
  guidesIntro: "Added to the site in {issue}.",
  guidesNone: "No new guides this month. All of them are in the archive.",
  guidesAll: "All the guides",

  askHeading: "Get Tide by email",
  askBody: "Tide comes out once a month. You can stop any time, and we never share the list.",
  source: "County property appraisers, public record, qualified sales, as of {asOf}.",

  cardEyebrow: "Tide · Monthly issue",
  cardExcerpt: "How home sales went in {data} in Lakewood Ranch, Sarasota and Bradenton, and what it means if you’re buying or selling.",
  cardData: "Numbers for {data}",
  ogMeta: "Numbers for {data} · County records",
  description: "Tide for {issue}: how home sales went in {data} in Lakewood Ranch, Sarasota and Bradenton, with every number from the county’s public record.",

  everyIssue: "Every issue of Tide",
  indexEyebrow: "Tide · Every issue",
  indexTitle: "How home sales went, once a month.",
  indexLead: "Each issue looks back at the newest month the county has complete for Lakewood Ranch, Sarasota and Bradenton, and says what it means if you’re buying or selling. The guides are in the archive.",
  indexArchive: "The guides and the archive",
  indexDescription: "Every issue of Tide, the monthly letter on home sales in Lakewood Ranch, Sarasota and Bradenton, with every number from the county property appraisers’ records.",
} as const;

/**
 * The "facts to write from" list in the email draft, for whoever writes the
 * month's story. Never shown to a reader.
 */
export const TIDE_FACTS_COPY = {
  heading: "Facts to write from",
  note: "For whoever writes this month’s story, not for readers. Every number below is on the issue page. Delete this box before sending.",
  up: "up {pct}%",
  down: "down {pct}%",
  same: "about the same",
  noTypical: "no typical month yet",
  whatSales: "home sales",
  whatPrice: "median price",
  whatPpsf: "median price per square foot",
  largest: "Largest change against a typical month: {what} in {market} went {move} to {value}, from {typical}.",
  market: "{market}: {count} sales ({countMove} against a typical month). Median price {price} ({priceMove}). Per square foot {ppsf} ({ppsfMove}). New builds or lots {share} of sales, against {typicalShare} in a typical month.",
  before: "{market} the month before, {month}: {count} sales, median price {price}.",
  mix: "{market}: the median price is {price} against a typical month, but the price per square foot is {ppsf}. A different mix of homes sold; the same home didn’t change price that much.",
  range: "{market} on the 12-month chart: most sales in {high} ({highCount}), fewest in {low} ({lowCount}).",
  street: "Busiest street in {month}: {street} in {market}, with {count} sales.",
} as const;

/** Every template above, with where it lives, for the Fair Housing, style and voice checks. */
export function tideWebStrings(): { where: string; text: string }[] {
  return [
    ...Object.entries(TIDE_WEB_COPY).map(([k, text]) => ({ where: `lib/tide/copy.ts TIDE_WEB_COPY.${k}`, text })),
    ...Object.entries(TIDE_FACTS_COPY).map(([k, text]) => ({ where: `lib/tide/copy.ts TIDE_FACTS_COPY.${k}`, text })),
  ];
}
