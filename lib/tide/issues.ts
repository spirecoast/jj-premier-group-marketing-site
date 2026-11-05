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
 * from the figures the page computes (docs/ISSUES.md, "Writing the narrative").
 * Every field is optional: the page and the email show what's written and
 * fall back to computed figures and fixed lines for the rest.
 *
 * An issue is about its own month: what a buyer or seller here should know
 * this November, told from the newest complete county figures and the trend
 * behind them (the last three months, the year so far, against a year
 * before). The cover, the headline and the dek never lead with the data
 * month; the page says the timing once, under the market overview ("sales
 * through August").
 * - `coverTitle`: the cover line, two to six words set as large as the cover
 *   allows; plain and true, about now, never a pun or a play on words;
 * - `coverKicker`: one sentence under the cover line, with the figure behind it;
 * - `headline`: one sentence, the issue's news for a reader this month, set
 *   big on the issue page and the email's title;
 * - `dek`: one or two sentences under it, the email's preheader;
 * - `opening`: the market overview, three to five short paragraphs that tell
 *   the story: open on what matters to a reader here this month, give the
 *   figures behind it, say what they mean for buying or selling now;
 * - `markets`: per market, two or three paragraphs on what's happening there,
 *   naming its streets and places;
 * - `buying`, `selling`: three moves each. `move` is one short imperative
 *   sentence (what to do), `why` one to three sentences with the figures
 *   behind it, and `link` an optional quiet link to a tool or guide on the site;
 * - `watch`: one or two things to look for next month, a sentence or two each.
 * `buyers` and `sellers` (one paragraph each) are the first format, read only
 * when `buying` or `selling` isn't written.
 * Every figure in them is written as a token, `{bradenton.sales}`,
 * `{all.vsTypicalPct}`, `{sarasota.ppsf}` (the list is at the top of
 * lib/tide/tokens.ts), and the page fills it from the same figures the tiles
 * and charts are drawn from, so the words and the numbers can't disagree. A
 * number still typed in digits must be one the page computes (to rounding):
 * lib/tide/narrative.test.ts checks each against the built issue. Once an
 * issue is out, `npm run tide:freeze -- <issue>` writes its figures down
 * (lib/tide/snapshots), so a later data refresh never changes the page.
 *
 * `commentary`: a short note from Joelyn and one from Jessica, in their own
 * words, signed with their names. Only they write these. Leave a slot out (or
 * empty) and the page doesn't show it; the email draft shows a dashed box for
 * them to fill.
 *
 * Next month's issue is one more entry at the top, e.g. { issue: "2026-11" }.
 * Until its narrative is written the page shows the figures under computed
 * lines, and the email draft lists the month's facts to write from.
 *
 * No imports, so scripts/check-copy.mjs can run the voice and Fair Housing
 * checks over every narrative at build time.
 */

/** The three markets, as lib/issues/render.ts names them (repeated here so this file has no imports). */
export type TideMarketKey = "lakewood-ranch" | "sarasota" | "bradenton";
export const TIDE_MARKET_KEYS = ["lakewood-ranch", "sarasota", "bradenton"] as const satisfies readonly TideMarketKey[];

/** One move for a buyer or a seller: the rider (`move`), the elephant (`why`), and the path (`link`). */
export type TideMove = { move: string; why: string; link?: { href: string; label: string } };

export type TideCommentary = { joelyn?: string[]; jessica?: string[] };

export type TideIssueEntry = {
  issue: string;
  data?: string;
  coverTitle?: string;
  coverKicker?: string;
  headline?: string;
  dek?: string;
  opening?: string[];
  markets?: Partial<Record<TideMarketKey, string[]>>;
  buying?: TideMove[];
  selling?: TideMove[];
  /** The first format: one paragraph, read when `buying` isn't written. */
  buyers?: string[];
  /** The first format: one paragraph, read when `selling` isn't written. */
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
    issue: "2026-11",
    data: "2026-08",
    coverTitle: "A busy year heads into winter",
    coverKicker: "Home sales here are running {all.ytd.vsLastYearPct} ahead of last year as the slow season starts.",
    headline: "More homes are selling this year than last, and a square foot costs about the same.",
    dek: "Lakewood Ranch, Sarasota and Bradenton have each sold more homes this year than last. Winter is the slow season, which makes the next few months the time to plan a move.",
    opening: [
      "This has been a busy year to buy or sell a home here. From January through the summer, {all.ytd.sales} homes sold in Lakewood Ranch, Sarasota and Bradenton. That’s {all.ytd.vsLastYearSales} more than at the same point last year.",
      "Prices didn’t climb with the sales. Over the summer, a square foot sold for a median of {all.last3.ppsf} across the three places. A year before, it was {all.last3.lastYearPpsf}.",
      "For a seller, that means buyers are out there, but they aren’t paying more for a square foot than they did last year. For a buyer, it means the same home costs about what it did a year ago.",
      "Most of the growth was in Bradenton. Of the {all.last3.vsLastYearSales} extra sales this summer, {bradenton.last3.vsLastYearSales} were there. In Lakewood Ranch, fewer new homes sold and more resales did. In Sarasota, a square foot cost a little more than last summer.",
      "Now comes the slow season. Last January, just {all.lowSales} homes sold here, the fewest of any month in the past year. By March, the number was {all.sales.2026-03}. If a move is in your plans, the next few months are the time to get ready.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch sold about as many homes this summer as last. It had {lakewood-ranch.last3.sales} sales from June to August, against {lakewood-ranch.last3.lastYearSales} a year before. The change was in what sold.",
        "Sales of new homes and lots fell {lakewood-ranch.last3.newBuildVsLastYearPct}, to {lakewood-ranch.last3.newBuild}. Resales rose {lakewood-ranch.last3.existingVsLastYearPct}, to {lakewood-ranch.last3.existing}. A square foot sold for {lakewood-ranch.last3.ppsf}, about the same as last summer.",
        "August was quiet, with {lakewood-ranch.sales} sales. That’s {lakewood-ranch.vsTypicalPct} fewer than in a typical month. {lakewood-ranch.streets.1.name} and {lakewood-ranch.streets.2.name} had the most, with {lakewood-ranch.streets.1.sales} each.",
      ],
      sarasota: [
        "Sarasota had a strong summer. From June to August, {sarasota.last3.sales} homes sold there, {sarasota.last3.vsLastYearPct} more than a year before. A square foot sold for {sarasota.last3.ppsf}, up from {sarasota.last3.lastYearPpsf}.",
        "As in Lakewood Ranch, the growth came from resales. They rose {sarasota.last3.existingVsLastYearPct}, while sales of new homes and lots fell {sarasota.last3.newBuildVsLastYearPct}.",
        "August was slower, with {sarasota.sales} sales and a median price of {sarasota.medianPrice}. {sarasota.streets.1.name} had {sarasota.streets.1.sales} sales, more than any other street in the three places. {sarasota.streets.2.street} on {sarasota.streets.2.place} had {sarasota.streets.2.sales}.",
      ],
      bradenton: [
        "Bradenton is where the market grew. It had {bradenton.last3.sales} home sales from June to August, {bradenton.last3.vsLastYearPct} more than a year before.",
        "Both kinds of sale rose. Sales of new homes and lots were up {bradenton.last3.newBuildVsLastYearPct}, and resales were up {bradenton.last3.existingVsLastYearPct}. In August, four of its five busiest streets were in Parrish, led by {bradenton.streets.1.street} with {bradenton.streets.1.sales} sales.",
        "Prices went the other way. A square foot sold for {bradenton.ppsf} in August, {bradenton.ppsfVsLastYearPct} less than a year before. This year, only January was lower, at {bradenton.ppsf.2026-01}.",
      ],
    },
    buying: [
      {
        move: "Know what a square foot costs where you’re looking.",
        why: "This summer, it was {bradenton.last3.ppsf} in Bradenton, {lakewood-ranch.last3.ppsf} in Lakewood Ranch and {sarasota.last3.ppsf} in Sarasota. If a home costs much more than that for its size, ask why.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "In Bradenton, check the street before you make an offer.",
        why: "Sales there were up {bradenton.last3.vsLastYearPct} this summer, but a square foot sold for less than a year before. Tide Street shows what each home on a street sold for.",
        link: { href: "/sell/sold", label: "Look up a street" },
      },
      {
        move: "In Lakewood Ranch, look at resales too.",
        why: "More of them are selling: {lakewood-ranch.last3.existing} this summer, up from {lakewood-ranch.last3.lastYearExisting}. A resale may carry a different CDD fee than a new home nearby, and that changes what you pay each year.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Price from what sold near you this summer.",
        why: "Sales here were up {all.last3.vsLastYearPct} from June to August. But a square foot sold for about what it did a year ago. A price well above recent sales has little to back it up.",
        link: { href: "/sell/home-value", label: "See what your home is worth" },
      },
      {
        move: "If you want to sell in the spring, get ready this winter.",
        why: "Last January, {all.lowSales} homes sold here. By March, {all.sales.2026-03} did. A home that’s ready by then is there when sales pick up.",
        link: { href: "/guides/getting-your-house-ready-to-sell", label: "Getting your house ready to sell" },
      },
      {
        move: "In Lakewood Ranch, compare your home with other resales first.",
        why: "Resales were {lakewood-ranch.last3.existing} of the {lakewood-ranch.last3.sales} sales there this summer. Those are the homes a buyer will set yours beside.",
        link: { href: "/sell/sold", label: "See what sold near you" },
      },
    ],
    watch: [
      "See if Lakewood Ranch picks up in September. August had {lakewood-ranch.sales} sales, {lakewood-ranch.vsTypicalPct} fewer than a typical month.",
      "See if Bradenton’s price per square foot keeps slipping. It went from {bradenton.prevPpsf} in July to {bradenton.ppsf} in August.",
    ],
    commentary: {},
  },
  {
    issue: "2026-10",
    data: "2026-07",
    coverTitle: "After a busy summer",
    coverKicker: "June had {all.sales.2026-06} home sales across Lakewood Ranch, Sarasota and Bradenton, more than any other month in the past year.",
    headline: "This year’s busy season beat last year’s, and the price of a square foot held steady.",
    dek: "Last year, the slowest months for sales came in late fall and winter. Here’s where Lakewood Ranch, Sarasota and Bradenton stand going in, and what that means for a move.",
    opening: [
      "This year’s spring and summer rush was a big one. From May to July, {all.last3.sales} homes sold in Lakewood Ranch, Sarasota and Bradenton. That’s {all.last3.vsLastYearPct} more than in the same months last year.",
      "June was the peak. That month, {all.sales.2026-06} homes sold, more than in any other month of the past year.",
      "Prices didn’t rise to match. From May to July, a square foot sold for a median of {all.last3.ppsf}, the same as a year before. The median price rose {all.last3.medianPriceVsLastYearPct}, which means a different mix of homes sold. The same home didn’t cost more.",
      "For a seller, more homes sold, but buyers paid about what they did last year for each square foot. For a buyer, prices haven’t climbed, even in a busy year.",
      "The months ahead were slow last year. Sales went from {all.sales.2025-08} in August to {all.sales.2025-11} in November, and January had just {all.lowSales}. That makes the fall a good time to plan, whichever side of a sale you’re on.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch had {lakewood-ranch.last3.sales} home sales from May to July. That’s {lakewood-ranch.last3.vsLastYearPct} more than a year before.",
        "The growth came from resales. They rose {lakewood-ranch.last3.existingVsLastYearPct}, to {lakewood-ranch.last3.existing}. Sales of new homes and lots dipped {lakewood-ranch.last3.newBuildVsLastYearPct}, to {lakewood-ranch.last3.newBuild}.",
        "July had {lakewood-ranch.sales} sales, {lakewood-ranch.vsLastYearPct} more than last July. {lakewood-ranch.streets.1.name} had the most, with {lakewood-ranch.streets.1.sales}. A square foot sold for {lakewood-ranch.ppsf}, about the same as a year ago.",
      ],
      sarasota: [
        "Sarasota had {sarasota.last3.sales} home sales from May to July, {sarasota.last3.vsLastYearPct} more than a year before. A square foot cost {sarasota.last3.ppsfVsLastYearPct} more than it did then, at {sarasota.last3.ppsf}.",
        "July’s median price was {sarasota.medianPrice}, up from {sarasota.lastYearMedianPrice} a year before. The price per square foot rose less, {sarasota.ppsfVsLastYearPct}, so part of that jump is in which homes sold.",
        "{sarasota.streets.1.street} on {sarasota.streets.1.place} had {sarasota.streets.1.sales} sales in July, more than any other street in the three places. Condos, villas and townhomes were {sarasota.attached.share} of Sarasota’s sales.",
      ],
      bradenton: [
        "Bradenton is where sales grew most. It had {bradenton.last3.sales} home sales from May to July, {bradenton.last3.vsLastYearPct} more than a year before. June alone had {bradenton.sales.2026-06}.",
        "In July, three of its five busiest streets were in Parrish, led by {bradenton.streets.1.street} with {bradenton.streets.1.sales} sales. Of its homes, {bradenton.band.under400k} sold for under $400K.",
        "Prices slipped a little. A square foot sold for {bradenton.last3.ppsf} from May to July, against {bradenton.last3.lastYearPpsf} a year before.",
      ],
    },
    buying: [
      {
        move: "Compare homes by what a square foot costs.",
        why: "From May to July, it was {bradenton.last3.ppsf} in Bradenton, {lakewood-ranch.last3.ppsf} in Lakewood Ranch and {sarasota.last3.ppsf} in Sarasota. If a home costs much more than that for its size, ask why.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Look past the median price.",
        why: "In Sarasota, July’s median price rose {sarasota.medianPriceVsLastYearPct} from a year before. The price per square foot rose {sarasota.ppsfVsLastYearPct}. A median moves with the mix of homes that sold.",
        link: { href: "/sell/sold", label: "See what sold on a street" },
      },
      {
        move: "In Lakewood Ranch, weigh a new home against a resale.",
        why: "New homes and lots were {lakewood-ranch.newBuildPct} of July’s sales there. A new home may carry a different CDD fee than a resale, and that changes what you pay each year.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Set your price from what a square foot sells for nearby.",
        why: "Sales from May to July were up {all.last3.vsLastYearPct} on a year before. A square foot still sold for {all.last3.ppsf}, the same as then.",
        link: { href: "/sell/home-value", label: "See what your home is worth" },
      },
      {
        move: "Use the fall to get ready for spring.",
        why: "Last year, sales hit their low in January, at {all.lowSales}. By March, {all.sales.2026-03} homes sold across the three places.",
        link: { href: "/guides/getting-your-house-ready-to-sell", label: "Getting your house ready to sell" },
      },
      {
        move: "In Lakewood Ranch, price a resale with the new homes in mind.",
        why: "New homes and lots were {lakewood-ranch.newBuildPct} of July’s sales there. Buyers have new homes to choose from, so a resale needs a better price, finish or spot.",
        link: { href: "/sell/sold", label: "See what sold near you" },
      },
    ],
    watch: [
      "See how August compares with last August, when {all.sales.2025-08} homes sold across the three places.",
      "See if Sarasota’s price per square foot holds. It was {sarasota.ppsf} in July, up {sarasota.ppsfVsLastYearPct} from a year before.",
    ],
    commentary: {},
  },
];

export function getIssueEntry(issue: string): TideIssueEntry | undefined {
  return TIDE_ISSUES.find((e) => e.issue === issue);
}

export const isIssueMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** The narrative fields, in the order they appear. */
export const NARRATIVE_FIELDS = ["coverTitle", "coverKicker", "headline", "dek", "opening", "markets", "buying", "selling", "buyers", "sellers", "watch"] as const;
export type NarrativeField = (typeof NARRATIVE_FIELDS)[number];

/**
 * Every unsigned hand-written string in an entry, with the field it's in
 * ("markets.sarasota[1]", "buying[0].why"), in page order. The number check,
 * the voice and Fair Housing checks and the reading time all run over this.
 */
export function narrativeTexts(e: Partial<Pick<TideIssueEntry, NarrativeField>>): { field: string; text: string }[] {
  const out: { field: string; text: string }[] = [];
  const add = (field: string, text: string | undefined) => {
    if (text && text.trim()) out.push({ field, text });
  };
  add("coverTitle", e.coverTitle);
  add("coverKicker", e.coverKicker);
  add("headline", e.headline);
  add("dek", e.dek);
  (e.opening ?? []).forEach((t, i) => add(`opening[${i}]`, t));
  for (const k of TIDE_MARKET_KEYS) {
    (e.markets?.[k] ?? []).forEach((t, i) => add(`markets.${k}[${i}]`, t));
  }
  for (const f of ["buying", "selling"] as const) {
    (e[f] ?? []).forEach((m, i) => {
      add(`${f}[${i}].move`, m.move);
      add(`${f}[${i}].why`, m.why);
      add(`${f}[${i}].link.label`, m.link?.label);
    });
  }
  for (const f of ["buyers", "sellers", "watch"] as const) (e[f] ?? []).forEach((t, i) => add(`${f}[${i}]`, t));
  return out;
}

/** Every hand-written string in the list, with where it lives, for scripts/check-copy.mjs and the tests. */
export function tideNarrativeStrings(): { where: string; text: string; signed: boolean }[] {
  const out: { where: string; text: string; signed: boolean }[] = [];
  for (const e of TIDE_ISSUES) {
    for (const { field, text } of narrativeTexts(e)) out.push({ where: `lib/tide/issues.ts ${e.issue} ${field}`, text, signed: false });
    for (const v of TIDE_VOICES) (e.commentary?.[v.key] ?? []).forEach((text, i) => out.push({ where: `lib/tide/issues.ts ${e.issue} commentary.${v.key}[${i}]`, text, signed: true }));
  }
  return out;
}
