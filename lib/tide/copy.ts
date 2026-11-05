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
  /** The page's opening line until the month's story is written. {month} is the issue's own month. */
  framing: "Here’s what the county record says about buying and selling in Lakewood Ranch, Sarasota and Bradenton this {month}.",
  /**
   * The data's timing, said once, plainly, under the market overview. {data}
   * is the newest month complete in all three places ("August"). Never on the
   * cover, a tile, a share card or a subject line: the issue is about now.
   */
  note: "The county posts each sale about two months after it closes, so these are the newest complete numbers: sales through {data}.",
  /** The same, for an issue whose numbers stop before the newest complete month (a published issue after a later refresh). */
  noteLatest: "The county posts each sale about two months after it closes, so this issue’s numbers are for sales through {data}.",
  intro: "Every number here comes from the home sales in the county’s public record.",

  coverEyebrow: "Tide · {issue}",
  /** The cover's headline and dek until the month's are written. {month} is the issue's own month. */
  headlineFallback: "What the county record says this {month}",
  dekFallback: "How home sales are going in Lakewood Ranch, Sarasota and Bradenton, with every number from the county’s public record.",
  coverLine: "From the county record · {minutes} min read",
  /** The line above the cover's headline: the three places, never the data month. */
  dateline: "Lakewood Ranch · Sarasota · Bradenton",
  /** Each county file's reach when the figures were computed. */
  throughRecords: "{county} records through {date}",
  throughShort: "{county} through {date}",

  /** The strip under the big figure: what the county has posted for the months since. */
  sinceHeading: "Since then",
  sinceNote: "Qualified sales posted so far, as of {asOf}. The bar is the share of a typical month.",
  sinceToDate: "{month} to date",
  sinceShare: "{pct}% of a typical month",
  sinceNoTypical: "No typical month yet",
  sinceNone: "Nothing posted yet",
  sincePartial: "partial: the county posts sales weeks late",

  storyEyebrow: "Market overview",
  aboutEyebrow: "About this issue",

  combinedEyebrow: "{data} · All three markets",
  combinedMore: "home sales across the three markets in {month}, {pct}% more than a typical month",
  combinedFewer: "home sales across the three markets in {month}, {pct}% fewer than a typical month",
  combinedSame: "home sales across the three markets in {month}, about the same as a typical month",
  combinedNoTypical: "home sales across the three markets in {month}",
  combinedTypical: "Typical month {value}",
  combinedLastYear: "{month} {value}",
  combinedPartsLabel: "Each market’s share of the month’s home sales",

  chapterEyebrow: "{n} · {data}",
  marketWrittenNone: "From the figures",
  vsTypicalMore: "{pct}% more than a typical month",
  vsTypicalFewer: "{pct}% fewer than a typical month",
  vsTypicalSame: "About the same as a typical month",
  vsLastYear: "{month} {value}",
  vsLastYearNone: "No {month} on the record",
  sparkTitle: "Home sales, the last 12 months",
  sparkLabel: "{market} home sales each month, {from} to {to}: {values}.",
  bandsTitle: "By price",
  bandsNote: "Share of the {n} homes in the median price.",
  bandUnder400: "Under $400K",
  band400to750: "$400K to $750K",
  band750to1500: "$750K to $1.5M",
  band1500up: "$1.5M and up",
  mixTitle: "By kind of home",
  mixSingleFamily: "Single-family homes",
  mixAttached: "Condos, villas and townhomes",
  mixLand: "Lots the county lists as empty",
  mixMedian: "median {price}",
  mixShare: "{share}%",
  streetsLine: "Busiest streets",
  atlasLink: "{market} neighborhoods on Atlas",

  movesEyebrow: "{data} · Three moves each",
  movesHeading: "What to do about it",

  buyersHeading: "If you’re buying",
  sellersHeading: "If you’re selling",
  limits: "These are closed sales from county records. They don’t show asking prices, how long a home was for sale, or how many homes are for sale now.",

  marketsHeading: "The numbers for {data}",
  marketsIntro: "Under each number is a typical month, the middle of the 12 months before {data}. It shows whether this month ran high or low.",
  figureSales: "Home sales",
  figureMedian: "Median price",
  figurePpsf: "Median price per sq ft",
  figurePpsfShort: "Median per sq ft",
  figureNew: "New builds or lots",
  typical: "Typical month {value}",
  typicalNone: "No typical month yet",
  sampleHomes: "From {n} homes",
  sampleSqft: "From {n} homes with a size on record",
  sampleNew: "{n} of {count} sales",
  marketLink: "More on {market}",

  chartsHeading: "Twelve months on the record",
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

  guidesHeading: "Read next",
  guidesIntro: "Added to the site in {issue}.",
  guidesNone: "No new guides this month. All of them are in the archive.",
  guidesAll: "All the guides",

  encoreEyebrow: "Encore · {issue}",
  encoreHeading: "Out this month",
  encoreIntro: "A few things on the arts calendar in {month}, close to each of the three places.",
  encoreAll: "The full calendar",

  methodHeading: "Method and sources",
  fairHousingLine: "Tide describes places and homes, never the people who live in them. Equal Housing Opportunity.",

  /** The closing block for a reader who came from the email: they have Tide; what they want is their street. */
  readerHeading: "Your street, this month",
  readerBody: "Tide reads the three markets. Tide Street reads your own street from the same county record, every qualified sale on it.",
  readerStreet: "Your street",
  readerZip: "ZIP or city",
  readerSubmit: "Show the sales",
  readerCalculator: "Tide Sale Calculator: what you’d keep",
  readerForward: "Forward this issue",
  askHeading: "Get Tide by email",
  askBody: "Tide comes out once a month. You can stop any time, and we never share the list.",
  source: "County property appraisers, public record, qualified sales, as of {asOf}.",

  cardEyebrow: "Tide · Monthly issue",
  /** {month} is the issue's own month: an issue is about now, and its labels never lead with the data month. */
  cardExcerpt: "What to know this {month} if you’re buying or selling in Lakewood Ranch, Sarasota and Bradenton, from the county’s public record.",
  /** The share card's small line: the three places, short enough for one line under the cover line. */
  ogMeta: "Lakewood Ranch · Sarasota · Bradenton",
  description: "Tide, {issue}: what to know this {month} if you’re buying or selling in Lakewood Ranch, Sarasota and Bradenton, with every number from the county’s public record.",

  everyIssue: "Every issue of Tide",
  /** On /tide while only one issue is out: the archive opens with the next one. */
  nextIssue: "Next issue: {month}. Every issue stays here once the next one is out.",
  indexEyebrow: "Tide · Every issue",
  indexTitle: "Market Report",
  indexLead: "What homes sold for each month in Lakewood Ranch, Sarasota and Bradenton, and what it means for you.",
  indexArchive: "The guides and the archive",
  indexDescription: "Tide, the monthly real estate market report for Lakewood Ranch, Sarasota and Bradenton. Every issue, with every number from the county property appraisers’ records.",
} as const;

/**
 * The "facts to write from" list in the email draft, for whoever writes the
 * month's story. Never shown to a reader.
 */
export const TIDE_FACTS_COPY = {
  heading: "Facts to write from",
  note: "For whoever writes this month’s story, not for readers. Write the headline and the dek about what a buyer or seller here should know this month, and lean on the trend lines as much as the month. The page says once, lower down, that the numbers run through the data month. Every number below is on the issue page. Delete this box before sending.",
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
  mixPrice: "{market}: the median price is {price} against a typical month, but the price per square foot is {ppsf}. A different mix of homes sold; the same home didn’t change price that much.",
  range: "{market} on the 12-month chart: most sales in {high} ({highCount}), fewest in {low} ({lowCount}).",
  street: "Busiest street in {month}: {street} in {market}, with {count} sales.",
  combined: "All three markets together: {count} home sales in {month}, {move} against a typical month of {typical}.",
  combinedYear: "All three markets a year before, in {month}: {count} home sales. This month is {move} on that.",
  lastYear: "{market} a year before, in {month}: {count} sales ({countMove} since). Median price {price} ({priceMove}). Per square foot {ppsf} ({ppsfMove}).",
  lastYearNone: "The county record doesn’t reach {month}, so there’s no comparison with a year before.",
  last3: "The last three complete months together, {span}: {count} home sales across the three markets, {move} on {lyCount} in {lySpan}. Per square foot {ppsf}, against {lyPpsf} ({ppsfMove}).",
  ytd: "The year so far, {span}: {count} home sales across the three markets, {move} on {lyCount} in {lySpan}. Per square foot {ppsf}, against {lyPpsf} ({ppsfMove}).",
  last3Market: "{market}, {span}: {count} sales ({move} on {lyCount} a year before). New builds or lots {newBuild} ({newBuildMove}); every other sale {existing} ({existingMove}). Median price {price} ({priceMove}). Per square foot {ppsf} ({ppsfMove}).",
  ytdMarket: "{market}, the year so far, {span}: {count} sales ({move} on {lyCount} a year before). Per square foot {ppsf} ({ppsfMove}).",
  trendNone: "The county record doesn’t reach {span}, so there’s no trend against a year before.",
  season: "The three markets together on the 12-month chart: most sales in {high} ({highCount}), fewest in {low} ({lowCount}).",
  mix: "{market} by kind of home: single-family {sf} ({sfShare} of sales, median {sfPrice}). Condos, villas and townhomes {att} ({attShare}, median {attPrice}). Lots the county lists as empty {land} ({landShare}).",
  bands: "{market} by price, over the {n} homes in the median: under $400K {a}, $400K to $750K {b}, $750K to $1.5M {c}, $1.5M and up {d}.",
} as const;

/** Every template above, with where it lives, for the Fair Housing, style and voice checks. */
export function tideWebStrings(): { where: string; text: string }[] {
  return [
    ...Object.entries(TIDE_WEB_COPY).map(([k, text]) => ({ where: `lib/tide/copy.ts TIDE_WEB_COPY.${k}`, text })),
    ...Object.entries(TIDE_FACTS_COPY).map(([k, text]) => ({ where: `lib/tide/copy.ts TIDE_FACTS_COPY.${k}`, text })),
  ];
}
