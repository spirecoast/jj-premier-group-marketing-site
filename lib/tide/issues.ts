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
 * - `coverTitle`: the cover line, two to six words set as large as the cover
 *   allows, the way a magazine sells an issue; plain and true, never a pun;
 * - `coverKicker`: one sentence under the cover line, with the figure behind it;
 * - `headline`: one sentence, the month's story, set big on the issue page;
 * - `dek`: one or two sentences under it;
 * - `opening`: the story, three to five paragraphs of two to five sentences,
 *   told as something a person can picture;
 * - `markets`: per market, two or three paragraphs, the story of that place
 *   this month;
 * - `marketMoves`: per market, one sentence, the one thing to do there;
 * - `buying`, `selling`: three moves each. `move` is one short imperative
 *   sentence (what to do), `why` one to three sentences that make it feel
 *   real, and `link` an optional quiet link to a tool or guide on the site;
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
  marketMoves?: Partial<Record<TideMarketKey, string>>;
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
    issue: "2026-10",
    data: "2026-07",
    coverTitle: "One coast, three markets",
    coverKicker: "Selling in Sarasota: a square foot sold for {sarasota.ppsfVsLastYearPct} more than a year ago. Buying: in Bradenton it sold for {bradenton.ppsfVsLastYearPct} less, and in Lakewood Ranch it held steady.",
    headline: "July was busier than usual, and a square foot still cost about what it usually does.",
    dek: "Across Lakewood Ranch, Sarasota and Bradenton, {all.sales} homes sold, {all.vsTypicalPct} more than a typical month and {all.vsLastYearPct} more than {all.lastYearMonth}. Medians rose because of which homes sold, not because the same home cost more.",
    opening: [
      "In July, {all.sales} homes sold across Lakewood Ranch, Sarasota and Bradenton. That’s {all.vsTypicalPct} more than a typical month here and {all.vsLastYearPct} more than {all.lastYearMonth}. Bradenton carried most of it: {bradenton.sales} of those sales, nearly half, were there.",
      "Here’s the part worth slowing down for. The median price went up in all three places, but the price of a square foot didn’t. Picture two houses the same size on similar streets, one sold this July and one in a typical month. They sold for about the same. What changed is which homes sold, with more of the larger ones in the mix, and that’s what pulled the median up.",
      "Over a full year, the three places have split. In Sarasota a square foot cost {sarasota.ppsf} in July, against {sarasota.lastYearPpsf} in {sarasota.lastYearMonth}, up {sarasota.ppsfVsLastYearPct}. In Lakewood Ranch it was {lakewood-ranch.ppsf} against {lakewood-ranch.lastYearPpsf}, about the same. In Bradenton it was {bradenton.ppsf} against {bradenton.lastYearPpsf}, down {bradenton.ppsfVsLastYearPct}. The same money buys a little less house in Sarasota than it did a year ago, and a little more in Bradenton.",
      "So if you’re comparing homes, or setting a price on your own, start with the square foot. The median tells you what sold. The price of a square foot is the closer guide to what a home is worth.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch went the other way in July. It had {lakewood-ranch.sales} home sales, {lakewood-ranch.vsTypicalPct} fewer than a typical month, though still {lakewood-ranch.vsLastYearPct} more than {lakewood-ranch.lastYearMonth}. Its busiest month in the last year was {lakewood-ranch.highMonth}, with {lakewood-ranch.highSales} sales, and its slowest was {lakewood-ranch.lowMonth}, with {lakewood-ranch.lowSales}.",
        "What sells here is still mostly new. Of those {lakewood-ranch.sales} sales, {lakewood-ranch.newBuild} were parcels the county roll still lists as empty. In a place that’s still being built, much of that is new homes the roll hasn’t caught up with. That share, {lakewood-ranch.newBuildPct}, is about normal here: {lakewood-ranch.typicalNewBuildPct} in a typical month.",
        "Houses sold for a median of {lakewood-ranch.houses.median}, and condos, villas and townhomes for {lakewood-ranch.attached.median}. The busiest street was {lakewood-ranch.streets.1.name}, with {lakewood-ranch.streets.1.sales} sales, then {lakewood-ranch.streets.2.name} with {lakewood-ranch.streets.2.sales}.",
      ],
      sarasota: [
        "Sarasota had {sarasota.sales} home sales in July, {sarasota.vsTypicalPct} more than a typical month and {sarasota.vsLastYearPct} more than {sarasota.lastYearMonth}. Its median price was {sarasota.medianPrice}.",
        "This is the one place where a square foot costs clearly more than it did a year ago: {sarasota.ppsf}, up {sarasota.ppsfVsLastYearPct} from {sarasota.lastYearPpsf}. Against a typical month it’s flat, so the rise came over the year, not in July.",
        "Sarasota also has the widest spread of prices. Of its homes, {sarasota.band.under400k} sold for under $400K and {sarasota.band.1.5mUp} for $1.5M and up. {sarasota.streets.1.street} on {sarasota.streets.1.place} had {sarasota.streets.1.sales} sales, more than any other street in the three places. {sarasota.streets.2.name} had {sarasota.streets.2.sales}.",
      ],
      bradenton: [
        "Bradenton was the busiest of the three. It had {bradenton.sales} home sales in July, {bradenton.vsTypicalPct} more than a typical month and {bradenton.vsLastYearPct} more than {bradenton.lastYearMonth}. June was bigger still, with {bradenton.sales.2026-06}, the most of any month in the last 12.",
        "It’s also the most affordable. Half of Bradenton’s homes sold for under $400K, and the median was {bradenton.medianPrice}. A square foot cost {bradenton.ppsf}, about the same as a typical month and {bradenton.ppsfVsLastYearPct} less than a year before.",
        "Much of the activity was in Parrish. {bradenton.streets.1.street} had {bradenton.streets.1.sales} sales, {bradenton.streets.2.street} had {bradenton.streets.2.sales} and {bradenton.streets.4.street} had {bradenton.streets.4.sales}.",
      ],
    },
    marketMoves: {
      "lakewood-ranch": "If you’re selling a resale home here, price it next to the new homes down the road, because buyers will see both.",
      sarasota: "If you’re buying here, compare homes by the square foot and against last year, because that’s where Sarasota’s prices have moved.",
      bradenton: "If you’re buying here, start your search under $400K, where half of July’s homes sold.",
    },
    buying: [
      {
        move: "Compare homes by the price of a square foot.",
        why: "In July a square foot cost {lakewood-ranch.ppsf} in Lakewood Ranch, {sarasota.ppsf} in Sarasota and {bradenton.ppsf} in Bradenton, about the same as usual. A home priced well above that needs a reason, like the water, the lot or a newer roof. Ask what it is.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Check last July, not just last month.",
        why: "One month can swing hard. Bradenton went from {bradenton.prevSales} sales in June to {bradenton.sales} in July. A year back is the steadier test, and it shows Sarasota’s square foot up {sarasota.ppsfVsLastYearPct} and Bradenton’s down {bradenton.ppsfVsLastYearPct}.",
        link: { href: "/sell/sold", label: "See what sold on a street" },
      },
      {
        move: "In Lakewood Ranch, weigh new against resale.",
        why: "Nearly half of July’s sales there, {lakewood-ranch.newBuildPct}, were new homes or lots. A new home down the road may carry a different CDD fee than a resale, and that changes what you really pay each year.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Set your price from the square foot on your street.",
        why: "Buyers will hold your home up against the price of a square foot nearby. In July that was {lakewood-ranch.ppsf} in Lakewood Ranch, {sarasota.ppsf} in Sarasota and {bradenton.ppsf} in Bradenton. None of the three moved much against a typical month.",
        link: { href: "/sell/home-value", label: "Get a value for your home" },
      },
      {
        move: "In Lakewood Ranch, price against the new homes.",
        why: "Buyers there can choose new, and {lakewood-ranch.newBuildPct} of July’s sales were new homes or lots. A resale has to win on price, finish or location, so decide which one yours wins on before you list.",
        link: { href: "/sell/sold", label: "What sold on your street" },
      },
      {
        move: "Plan your listing around the season.",
        why: "Bradenton had {bradenton.sales.2026-01} sales in January 2026 and {bradenton.sales.2026-06} in June, and Lakewood Ranch had {lakewood-ranch.sales.2026-01} in January and {lakewood-ranch.sales.2026-05} in May. Sales here follow the calendar. A home that’s ready in the fall is in front of buyers when the spring rush starts.",
        link: { href: "/guides/getting-your-house-ready-to-sell", label: "Why spring starts in October" },
      },
    ],
    watch: [
      "Whether Bradenton keeps its pace and Lakewood Ranch picks back up. Bradenton had {bradenton.sales} sales in July against a typical {bradenton.typical}, and Lakewood Ranch had {lakewood-ranch.sales} against a typical {lakewood-ranch.typical}.",
      "Whether Sarasota’s square foot keeps rising. It was {sarasota.ppsf} in July, up {sarasota.ppsfVsLastYearPct} from a year before.",
    ],
    commentary: {},
  },
];

export function getIssueEntry(issue: string): TideIssueEntry | undefined {
  return TIDE_ISSUES.find((e) => e.issue === issue);
}

export const isIssueMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** The narrative fields, in the order they appear. */
export const NARRATIVE_FIELDS = ["coverTitle", "coverKicker", "headline", "dek", "opening", "markets", "marketMoves", "buying", "selling", "buyers", "sellers", "watch"] as const;
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
    add(`marketMoves.${k}`, e.marketMoves?.[k]);
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
