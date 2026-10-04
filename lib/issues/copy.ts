/**
 * Every sentence the two issues are built from, as templates with {tokens}.
 * Nothing else in lib/issues writes prose: the builders fill these in with
 * computed values and dataset fields. No imports, so scripts/check-copy.mjs
 * can run the Fair Housing checker over every string at build time and the
 * unit tests can check the rules (no superlatives, no license numbers).
 *
 * Voice: plain, direct and warm, with contractions. Tide's market
 * paragraphs carry no adjective a number doesn't back. The month's story is
 * written by hand in lib/tide/issues.ts, and the two signed notes only by
 * Joelyn and Jessica: neither is ever generated.
 */

export const TEAM_NAMES = "Joelyn Nauman and Jessica Garza";

export const FOOTER_COPY = {
  sentBy: "Sent by {names}, {team}, {brokerage}.",
  why: "You’re getting this because you signed up for {product} at {domain}.",
  /** The real unsubscribe link is added by whichever tool sends the issue (docs/ISSUES.md). */
  unsubscribeLabel: "To unsubscribe:",
  unsubscribe: "Reply ‘stop’ or use the link in the email you received.",
  calendarLabel: "The calendar",
  icsLabel: "Add it to your calendar app",
  phoneLabel: "Call or text",
  equalHousing: "Equal Housing Opportunity.",
} as const;

export const ENCORE_COPY = {
  subject: "Encore · the week of {range}",
  preheader: "{picks} picks from Monday to Sunday in Lakewood Ranch, Sarasota and Bradenton.",
  preheaderEmpty: "What’s on view this week in Lakewood Ranch, Sarasota and Bradenton.",
  eyebrow: "Encore Arts Calendar · Every Monday",
  title: "The week of {range}",
  intro:
    "Here’s the week from Monday to Sunday: {picks} picks from the {performances} performances on the calendar, spread across Lakewood Ranch, Sarasota and Bradenton. Times are local, and each title opens its page on the calendar.",
  introEmpty:
    "The calendar doesn’t have dated performances for this week yet. What’s on view is below, and the season so far is on the calendar.",
  picksHeading: "This week",
  onViewHeading: "On view",
  onViewIntro: "Exhibitions open this week, closing soonest first.",
  onViewMore: "{more} more on view: see them all on the calendar.",
  through: "Through {date}",
  allDay: "All day",
  presentedBy: "Presented by {presenter}",
  calendarCta: "See the whole week on the calendar",
} as const;

export const TIDE_COPY = {
  subject: "Tide · {month}",
  preheader: "How home sales went in {month} in Lakewood Ranch, Sarasota and Bradenton, and what it means if you’re buying or selling.",
  eyebrow: "Tide · The monthly market letter",
  title: "How home sales went in {month}",
  coverage: "The county posts sales a few weeks late, so this issue looks back at {month}. That’s the newest month that’s complete for all three places.",
  intro: "Here’s how home sales went in {month} in Lakewood Ranch, Sarasota and Bradenton. Every number comes from the county’s public record of home sales.",
  outside:
    "Sales outside these three places’ ZIP codes, in places such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted here. That’s {outside} of the {total} home sales the two counties recorded in {month}.",
  lag: "The county files run through {through}, so sales recorded after that aren’t counted yet.",
  figureSales: "Home sales",
  figureMedian: "Median price",
  figurePpsf: "Median price per sq ft",
  figureNew: "New builds or lots",
  figureSalesPartial: "Home sales so far",
  marketSales: "{market} had {count} home sales in {month}.",
  marketPartial:
    "The county has posted {count} home {sales} in {market} for {month} so far. A typical month over the past year had {typical}, so the month isn’t complete yet, and these numbers cover only what’s posted.",
  marketPartialNone: "The county hasn’t posted any home sales in {market} for {month} yet. A typical month over the past year had {typical}.",
  marketOneSale: "{market} had one home sale in {month}.",
  marketNone: "{market} had no home sales on the record for {month}.",
  marketMedian: "Counting only homes the county lists as built, the median price was {price}, from {n} sales.",
  marketMedianNone: "Fewer than two of the sales were homes the county lists as built, so there’s no median price.",
  marketPpsf: "The median price per square foot was {ppsf}, from the {n} homes with a size on record.",
  marketPpsfNone: "Fewer than two homes had a size on record, so there’s no median per square foot.",
  marketNew: "{share} of the sales were new builds, or lots the county still lists as empty.",
  marketStreets: "The busiest streets were {streets}.",
  marketStreetsOne: "The busiest street was {streets}.",
  marketStreetsNone: "No street had more than one sale.",
  marketZips: "Counted by ZIP code: {zips}.",
  marketLink: "More on {market}",
  marketMoveLabel: "One move in {market}",
  buyersHeading: "If you’re buying",
  sellersHeading: "If you’re selling",
  limits: "These are closed sales from county records. They don’t show asking prices, how long a home was for sale, or how many homes are for sale now.",
  watchHeading: "What to watch next month",
  storyPlaceholder:
    "This month’s story goes here: an opening a reader can picture, then “If you’re buying”, “If you’re selling” and what to watch next month. Write it in plain words from the numbers below, or delete this box.",
  notesHeading: "From Joelyn and Jessica",
  notePlaceholder: "{first}: a few sentences here in your own words, if you’d like. Or delete this box and nothing is said for you.",
  noteSign: "{name}",
  /** The line the hand-off quotes while any dashed box is left. */
  placeholder: "Fill in or delete every dashed box before sending.",
  linksHeading: "Look closer",
  linkSold: "What sold on your street",
  linkRelocate: "The relocation planner, for a move here",
  source: "Source: County property appraisers, public record, qualified sales, as of {asOf}.",
  methods:
    "A qualified sale is one the appraiser treats as arm’s length (codes 01 to 04). Home sales leave out commercial and other non-residential parcels. Markets are counted by ZIP as Atlas draws them, so Bradenton includes Palmetto, Parrish, Ellenton and the island cities; an address the county gives as Lakewood Ranch counts there; and sales elsewhere in the two counties, such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted. New build or vacant on the roll means the roll shows the parcel as vacant, a year built in or after the sale year, or a change to the parcel after the sale. The median price and the per-square-foot median leave out parcels vacant on the roll or changed after the sale; the sales count and the new-build share keep them. Streets need two sales to be listed, ties go alphabetically, and a street carries its postal city only when that city isn’t one of the three markets. The price bands count the same homes as the median price. The kinds of home count every home sale, with each kind’s median taken the way the market’s is; condos, villas and townhomes are counted together, and lots the county lists as empty are the parcels vacant on the roll. The three markets’ typical month is the median of their combined monthly sales over the twelve months before, and the same month a year before is compared only when the record reaches it. Not MLS data.",
} as const;

/** Every template above, with where it lives, for the Fair Housing and style checks. */
export function issueStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const [group, obj] of Object.entries({ FOOTER_COPY, ENCORE_COPY, TIDE_COPY })) {
    for (const [k, v] of Object.entries(obj)) out.push({ where: `lib/issues/copy.ts ${group}.${k}`, text: v });
  }
  out.push({ where: "lib/issues/copy.ts TEAM_NAMES", text: TEAM_NAMES });
  return out;
}

/** Fill {tokens}; a token with no value is left visible so a test catches it. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
