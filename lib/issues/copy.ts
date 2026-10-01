/**
 * Every sentence the two issues are built from, as templates with {tokens}.
 * Nothing else in lib/issues writes prose: the builders fill these in with
 * computed values and dataset fields. No imports, so scripts/check-copy.mjs
 * can run the Fair Housing checker over every string at build time and the
 * unit tests can check the rules (no superlatives, no license numbers).
 *
 * Voice: the guide's, with contractions. Tide's market paragraphs carry no
 * adjective a number doesn't back; the "what it means" section is written
 * by Joelyn and Jessica, never generated.
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
  preheader: "What sold in Lakewood Ranch, Sarasota and Bradenton in {month}, from the county records.",
  eyebrow: "Tide · The Coast real estate newsletter",
  title: "{month}, from the county records",
  coverage:
    "The county property appraisers post a sale only after they’ve qualified it, so this issue covers {month}, the latest month that’s complete for all three places.",
  intro:
    "Here’s what the county records show for {month}: the qualified home sales the two property appraisers have published, counted by market. Every figure below is computed from those records; none is typed by hand.",
  outside:
    "Sales outside these three markets’ ZIPs, in places such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted here: {outside} of the {total} qualified home sales the two counties recorded in {month}.",
  lag: "The county files run through {through}, so sales recorded after that aren’t counted yet.",
  figureSales: "Qualified sales",
  figureMedian: "Median price, homes",
  figurePpsf: "Median $/sq ft",
  figureNew: "New build or vacant on the roll",
  figureSalesPartial: "Qualified sales so far",
  marketSales: "{market} had {count} qualified home sales in {month}.",
  marketPartial:
    "The county has published {count} qualified home {sales} in {market} for {month} so far, and the median month over the past year had {typical}, so the month isn’t complete on the record yet. The figures cover only the sales published so far.",
  marketPartialNone:
    "The county hasn’t published any qualified home sales in {market} for {month} yet; the median month over the past year had {typical}. The figures arrive as the appraiser records them.",
  marketOneSale: "{market} had one qualified home sale in {month}.",
  marketNone: "{market} had no qualified home sales on the record for {month}.",
  marketMedian: "Leaving out parcels vacant on the roll or changed since the sale, {n} homes are left, and their median price was {price}.",
  marketMedianNone: "Leaving out parcels vacant on the roll or changed since the sale, fewer than two homes are left, so there’s no median price.",
  marketPpsf: "Across the {n} homes with a recorded living area, the median was {ppsf} a square foot.",
  marketPpsfNone: "Fewer than two homes had a recorded living area, so there’s no median per square foot.",
  marketNew: "{share} of the sales were new builds or parcels the roll still shows as vacant.",
  marketStreets: "The streets with the most sales were {streets}.",
  marketStreetsOne: "The street with the most sales was {streets}.",
  marketStreetsNone: "No street had more than one sale.",
  marketZips: "Counted by ZIP: {zips}.",
  marketLink: "More on {market}",
  whatItMeansHeading: "What it means",
  placeholder: "Joelyn and Jessica add two paragraphs here before sending.",
  linksHeading: "Look closer",
  linkSold: "What sold on your street",
  linkRelocate: "Moving here? The relocation planner",
  source: "Source: County property appraisers, public record, qualified sales, as of {asOf}.",
  methods:
    "A qualified sale is one the appraiser treats as arm’s length (codes 01 to 04). Home sales leave out commercial and other non-residential parcels. Markets are counted by ZIP as Atlas draws them, so Bradenton includes Palmetto, Parrish, Ellenton and the island cities; an address the county gives as Lakewood Ranch counts there; and sales elsewhere in the two counties, such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted. New build or vacant on the roll means the roll shows the parcel as vacant, a year built in or after the sale year, or a change to the parcel after the sale. The median price and the per-square-foot median leave out parcels vacant on the roll or changed after the sale; the sales count and the new-build share keep them. Streets need two sales to be listed, ties go alphabetically, and a street carries its postal city only when that city isn’t one of the three markets. Not MLS data.",
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
