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
 * - `headline`: one sentence, the month's story, set big on the cover;
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
 * Every number written in them must be one the page computes (to rounding):
 * lib/tide/narrative.test.ts checks each against the built issue.
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
    // DRAFT: the lead rewrites this before merge.
    // A placeholder draft of the letter's new fields, so the full design can be
    // seen: the headline, the dek, opening[1] onward, the three markets, their
    // moves, and buying and selling. opening[0], buyers, sellers and watch are
    // the published words. Every number is from writingFacts() for July 2026.
    headline: "July was busier than usual, and a square foot cost about the same.",
    dek: "There were 1,620 home sales across the three places, 7% more than a typical month. Most of the change came from which homes sold, not from higher prices.",
    opening: [
      "Picture someone house hunting in Bradenton in July. They had lots of company. There were 793 home sales there, 87 more than in a typical month, and the median price was $399,450. Sarasota was busy too, with 586 sales, while Lakewood Ranch had a slow month, with 241 sales, 13% fewer than usual.",
      "Across all three places, 1,620 homes sold. That’s 7% more than a typical month and 15% more than July 2025. Bradenton alone had 49% of them.",
      "The median price went up in all three places. But the price of a square foot stayed about the same. It was $279 in Lakewood Ranch, $293 in Sarasota and $225 in Bradenton.",
      "So the same house didn’t cost more in July. A different mix of homes sold, and that moved the median. When you compare two homes, compare them by the square foot.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch had a quiet July, with 241 home sales. That’s 13% fewer than a typical month and 33 fewer than June. It was still 9% more than July 2025.",
        "Almost half of those sales, 46%, were new builds or lots the county still lists as empty. Stand-alone houses sold for a median of $770,000. Condos, villas and townhomes sold for a median of $335,000.",
        "Gander Ter had 11 sales, the most of any street there. Lilac Sky Ter had 8.",
      ],
      sarasota: [
        "Sarasota had 586 home sales in July, 12% more than a typical month. The median price was $530,000, up 12% from July 2025.",
        "Prices here ran from one end to the other. 35% of the homes sold for under $400K, and 17% sold for $1.5M and up.",
        "Gulf of Mexico Dr on Longboat Key had 20 sales. No other street in the three places had more.",
      ],
      bradenton: [
        "Bradenton was the busy one. It had 793 home sales in July, 12% more than a typical month and 20% more than July 2025.",
        "Half of its homes sold for under $400K. The median price was $399,450, and a square foot cost $225, about the same as usual.",
        "Parrish streets had a lot of the sales. Violet Jasper Dr had 12, and Shining Blue Nile Ln had 9.",
      ],
    },
    marketMoves: {
      "lakewood-ranch": "If you’re selling an older home here, price it knowing buyers can also buy new.",
      sarasota: "Compare homes by the price of a square foot, since the median moved more than the homes did.",
      bradenton: "If you’re buying here, start your search under $400K, where half the homes sold.",
    },
    buying: [
      {
        move: "Compare homes by the square foot.",
        why: "The median price rose in all three places, but a square foot cost about the same as usual. If a home costs well above $279, $293 or $225 a square foot, ask why.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Check the same month a year ago.",
        why: "One month can swing a lot. Bradenton went from 1,080 sales in June to 793 in July. A year back is a steadier test, and Bradenton was 20% ahead of July 2025.",
        link: { href: "/sell/sold", label: "See what sold on a street" },
      },
      {
        move: "Count new homes in your search.",
        why: "In Lakewood Ranch, 46% of sales were new builds or lots. A new home down the road is part of what you’re comparing.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Set your price from the square foot.",
        why: "Buyers will judge your home by its price per square foot. In July that was $279 in Lakewood Ranch, $293 in Sarasota and $225 in Bradenton.",
        link: { href: "/sell/home-value", label: "Get a value for your home" },
      },
      {
        move: "Know what sold on your street.",
        why: "A few streets had a lot of the sales. Gander Ter had 11 in Lakewood Ranch, and Violet Jasper Dr in Parrish had 12.",
        link: { href: "/sell/sold", label: "What sold on your street" },
      },
      {
        move: "Give yourself time if you sell this winter.",
        why: "Sales slowed in the winter months. Bradenton had 575 sales in January 2026 and 1,080 in June. Lakewood Ranch had 199 in January and 357 in May.",
        link: { href: "/guides/thinking-about-spring-start-in-october", label: "Why spring starts in October" },
      },
    ],
    // End of the draft.
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

/** The narrative fields, in the order they appear. */
export const NARRATIVE_FIELDS = ["headline", "dek", "opening", "markets", "marketMoves", "buying", "selling", "buyers", "sellers", "watch"] as const;
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
