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
 *   allows; plain and true, never a pun or a play on words;
 * - `coverKicker`: one sentence under the cover line, with the figure behind it;
 * - `headline`: one sentence, what happened this month, set big on the issue page;
 * - `dek`: one or two sentences under it;
 * - `opening`: the market overview, three to five short paragraphs on what
 *   happened across the three places, in plain words;
 * - `markets`: per market, two or three paragraphs on what happened there
 *   this month;
 * - `marketMoves`: per market, one sentence, the one thing to do there;
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
    issue: "2026-11",
    data: "2026-08",
    coverTitle: "A busy August in Bradenton",
    coverKicker: "Bradenton had {bradenton.vsTypicalPct} more home sales than usual, and the other two places had fewer.",
    headline: "Bradenton sold more homes than usual in August, and Lakewood Ranch and Sarasota sold fewer.",
    dek: "In all, {all.sales} homes sold in the three places. The price per square foot was a little lower than usual in each one.",
    opening: [
      "In August, {all.sales} homes sold in Lakewood Ranch, Sarasota and Bradenton. That’s {all.vsTypicalPct} more than in a typical month. It’s also {all.vsLastYearPct} more than in {all.lastYearMonth}.",
      "More than half of these sales were in Bradenton. It had {bradenton.sales} home sales, {bradenton.vsTypicalPct} more than usual. Lakewood Ranch and Sarasota both had fewer sales than in a typical month.",
      "Prices did not change much. In each place, the price per square foot was a little below a typical month. It was {lakewood-ranch.ppsf} in Lakewood Ranch, {sarasota.ppsf} in Sarasota and {bradenton.ppsf} in Bradenton.",
      "Compared with a year ago, the price per square foot was the same in Lakewood Ranch. It was up {sarasota.ppsfVsLastYearPct} in Sarasota. In Bradenton, it was down {bradenton.ppsfVsLastYearPct}.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch had {lakewood-ranch.sales} home sales in August. That’s {lakewood-ranch.vsTypicalPct} fewer than in a typical month. It’s also {lakewood-ranch.vsLastYearPct} fewer than in {lakewood-ranch.lastYearMonth}, when {lakewood-ranch.lastYearSales} homes sold.",
        "Prices held steady. The median price was {lakewood-ranch.medianPrice}, close to a typical month. A square foot sold for {lakewood-ranch.ppsf}, the same as a year ago.",
        "New homes and lots were {lakewood-ranch.newBuildPct} of sales. In a typical month, they are {lakewood-ranch.typicalNewBuildPct}. {lakewood-ranch.streets.1.name} and {lakewood-ranch.streets.2.name} had the most sales of any street, with {lakewood-ranch.streets.1.sales} each.",
      ],
      sarasota: [
        "Sarasota had {sarasota.sales} home sales in August. That’s {sarasota.vsTypicalPct} fewer than in a typical month. It had {sarasota.prevSales} sales in July.",
        "The median price was {sarasota.medianPrice}, which is {sarasota.medianPriceVsTypicalPct} lower than in a typical month. A square foot sold for {sarasota.ppsf}. That’s {sarasota.ppsfVsTypicalPct} lower than usual, but {sarasota.ppsfVsLastYearPct} higher than a year ago.",
        "Condos, villas and townhomes were {sarasota.attached.share} of Sarasota’s home sales. They sold for a median of {sarasota.attached.median}. Houses sold for a median of {sarasota.houses.median}.",
      ],
      bradenton: [
        "Bradenton had {bradenton.sales} home sales in August. That’s {bradenton.vsTypicalPct} more than in a typical month and {bradenton.vsLastYearPct} more than in {bradenton.lastYearMonth}. It was close to July, when {bradenton.prevSales} homes sold.",
        "The median price was {bradenton.medianPrice}, about the same as usual. A square foot sold for {bradenton.ppsf}. That’s {bradenton.ppsfVsTypicalPct} lower than in a typical month and {bradenton.ppsfVsLastYearPct} lower than a year ago.",
        "Prices are lower here than in the other two places. Here, {bradenton.band.under400k} of homes sold for under $400K. Many sales were in Parrish, on streets like {bradenton.streets.1.street} and {bradenton.streets.2.street}.",
      ],
    },
    marketMoves: {
      "lakewood-ranch": "If you’re selling here, set your price from what sold near you in the last few months.",
      sarasota: "If you’re buying here and a house is out of reach, look at condos, villas and townhomes.",
      bradenton: "If you’re buying here, compare homes by the price per square foot, which is lower than a year ago.",
    },
    buying: [
      {
        move: "Compare what a square foot costs in each place.",
        why: "In August, a square foot sold for {lakewood-ranch.ppsf} in Lakewood Ranch and {sarasota.ppsf} in Sarasota. In Bradenton, it sold for {bradenton.ppsf}. So a home of the same size costs less in Bradenton.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Look at condos, villas and townhomes, too.",
        why: "They cost much less than houses. In Lakewood Ranch, they sold for a median of {lakewood-ranch.attached.median} in August. Houses there sold for a median of {lakewood-ranch.houses.median}.",
        link: { href: "/neighborhoods?market=lakewood-ranch", label: "Lakewood Ranch on Atlas" },
      },
      {
        move: "Look up what sold on a street before you make an offer.",
        why: "Tide Street shows each home sale on a street, with the date, the price and the size. Use it to see what homes near the one you like sold for.",
        link: { href: "/sell/sold", label: "Look up a street" },
      },
    ],
    selling: [
      {
        move: "Set your price from recent sales near you.",
        why: "Lakewood Ranch had {lakewood-ranch.vsTypicalPct} fewer sales than usual in August, and Sarasota had {sarasota.vsTypicalPct} fewer. Start with what homes like yours sold for this summer.",
        link: { href: "/sell/home-value", label: "See what your home is worth" },
      },
      {
        move: "Compare your home with homes of the same kind.",
        why: "A median price mixes all kinds of homes. In Sarasota, houses sold for a median of {sarasota.houses.median} in August, and condos, villas and townhomes for {sarasota.attached.median}. Your home’s value depends on homes like yours.",
        link: { href: "/sell/sold", label: "See what sold near you" },
      },
      {
        move: "In Bradenton, know the price per square foot before you list.",
        why: "Bradenton had {bradenton.vsTypicalPct} more sales than usual in August. Even so, a square foot sold for {bradenton.ppsf}, which is {bradenton.ppsfVsTypicalPct} lower than usual.",
        link: { href: "/sell/net-proceeds", label: "Work out what you would take home" },
      },
    ],
    watch: [
      "See if sales in Lakewood Ranch pick up in September. There were {lakewood-ranch.sales} in August, compared with {lakewood-ranch.lastYearSales} a year earlier.",
      "See if the price per square foot in Bradenton keeps going down. It was {bradenton.prevPpsf} in July and {bradenton.ppsf} in August.",
    ],
    commentary: {},
  },
  {
    issue: "2026-10",
    data: "2026-07",
    coverTitle: "A busy July for home sales",
    coverKicker: "Across the three places, {all.sales} homes sold, {all.vsTypicalPct} more than in a typical month.",
    headline: "More homes sold than usual in July, and the price per square foot stayed about the same.",
    dek: "In all, {all.sales} homes sold in Lakewood Ranch, Sarasota and Bradenton. Median prices went up because more of the homes that sold were large.",
    opening: [
      "In July, {all.sales} homes sold in Lakewood Ranch, Sarasota and Bradenton. That’s {all.vsTypicalPct} more than in a typical month and {all.vsLastYearPct} more than in {all.lastYearMonth}. Half of these sales were in Bradenton.",
      "The median price went up in all three places. The price per square foot stayed about the same. This means more of the homes that sold were large. It does not mean the same home now costs more.",
      "Over the past year, prices changed in different ways. A square foot cost {sarasota.ppsfVsLastYearPct} more in Sarasota than in {sarasota.lastYearMonth}. It cost about the same in Lakewood Ranch and {bradenton.ppsfVsLastYearPct} less in Bradenton.",
      "When you compare homes, start with the price per square foot. It tells you more about value than the median price does.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch had {lakewood-ranch.sales} home sales in July. That’s {lakewood-ranch.vsTypicalPct} fewer than in a typical month but {lakewood-ranch.vsLastYearPct} more than in {lakewood-ranch.lastYearMonth}.",
        "New homes and lots were {lakewood-ranch.newBuildPct} of sales, close to the usual {lakewood-ranch.typicalNewBuildPct}. Many of these are new homes that the county still lists as empty lots.",
        "Houses sold for a median of {lakewood-ranch.houses.median}. Condos, villas and townhomes sold for a median of {lakewood-ranch.attached.median}. The street with the most sales was {lakewood-ranch.streets.1.name}, with {lakewood-ranch.streets.1.sales} sales.",
      ],
      sarasota: [
        "Sarasota had {sarasota.sales} home sales in July. That’s {sarasota.vsTypicalPct} more than in a typical month and {sarasota.vsLastYearPct} more than in {sarasota.lastYearMonth}. The median price was {sarasota.medianPrice}.",
        "A square foot sold for {sarasota.ppsf}, about the same as a typical month. A year earlier, it was {sarasota.lastYearPpsf}. That’s a rise of {sarasota.ppsfVsLastYearPct} over the year.",
        "Sarasota had a wide range of prices. Of its homes, {sarasota.band.under400k} sold for under $400K and {sarasota.band.1.5mUp} sold for $1.5M or more. {sarasota.streets.1.street} on {sarasota.streets.1.place} had {sarasota.streets.1.sales} sales, more than any other street in the three places.",
      ],
      bradenton: [
        "Bradenton had {bradenton.sales} home sales in July. That’s {bradenton.vsTypicalPct} more than in a typical month and {bradenton.vsLastYearPct} more than in {bradenton.lastYearMonth}. June had even more, with {bradenton.sales.2026-06}.",
        "Prices are lower here than in the other two places. Half of Bradenton’s homes sold for under $400K. The median price was {bradenton.medianPrice}.",
        "A square foot sold for {bradenton.ppsf}, about the same as a typical month. That’s {bradenton.ppsfVsLastYearPct} less than a year earlier. Many sales were in Parrish, on streets like {bradenton.streets.1.street} and {bradenton.streets.2.street}.",
      ],
    },
    marketMoves: {
      "lakewood-ranch": "If you’re selling a resale home here, compare your price with the new homes nearby.",
      sarasota: "If you’re buying here, compare prices with last year, because a square foot costs more now.",
      bradenton: "If you’re buying here, start your search under $400K, where half of July’s homes sold.",
    },
    buying: [
      {
        move: "Use the price per square foot to compare homes.",
        why: "In July, a square foot sold for {lakewood-ranch.ppsf} in Lakewood Ranch, {sarasota.ppsf} in Sarasota and {bradenton.ppsf} in Bradenton. If a home costs much more than that for its size, ask why.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Compare prices with the same month last year.",
        why: "Sales can change a lot from one month to the next. Bradenton went from {bradenton.prevSales} sales in June to {bradenton.sales} in July. A year back gives you a steadier comparison.",
        link: { href: "/sell/sold", label: "See what sold on a street" },
      },
      {
        move: "In Lakewood Ranch, compare new homes with resale homes.",
        why: "New homes and lots were {lakewood-ranch.newBuildPct} of July’s sales there. A new home may have a different CDD fee than a resale. That changes what you pay each year.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Base your price on what a square foot sells for nearby.",
        why: "Buyers compare homes by the price per square foot. In July, it was {lakewood-ranch.ppsf} in Lakewood Ranch, {sarasota.ppsf} in Sarasota and {bradenton.ppsf} in Bradenton. None of these moved much from a typical month.",
        link: { href: "/sell/home-value", label: "See what your home is worth" },
      },
      {
        move: "In Lakewood Ranch, price your home with the new homes in mind.",
        why: "Buyers there can choose a new home. New homes and lots were {lakewood-ranch.newBuildPct} of July’s sales. A resale home needs a better price, finish or location to compete.",
        link: { href: "/sell/sold", label: "See what sold near you" },
      },
      {
        move: "Get your home ready to sell in the fall.",
        why: "Sales here are slow in winter and higher in spring. Bradenton had {bradenton.sales.2026-01} sales in January 2026 and {bradenton.sales.2026-06} in June. A home that’s ready in the fall is on the market before sales pick up in spring.",
        link: { href: "/guides/getting-your-house-ready-to-sell", label: "Getting your house ready to sell" },
      },
    ],
    watch: [
      "See if Bradenton stays busy and Lakewood Ranch picks up. In July, Bradenton had {bradenton.sales} sales and Lakewood Ranch had {lakewood-ranch.sales}.",
      "Also watch the price per square foot in Sarasota. It was {sarasota.ppsf} in July, up {sarasota.ppsfVsLastYearPct} from a year earlier.",
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
