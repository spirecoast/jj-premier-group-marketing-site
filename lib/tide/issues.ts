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
    headline: "July was busier than usual, and a square foot still cost about what it usually does.",
    dek: "Across Lakewood Ranch, Sarasota and Bradenton, 1,620 homes sold, 7% more than a typical month and 15% more than July 2025. Medians rose because of which homes sold, not because the same home cost more.",
    opening: [
      "In July, 1,620 homes sold across Lakewood Ranch, Sarasota and Bradenton. That’s 7% more than a typical month here and 15% more than July 2025. Bradenton carried most of it: 793 of those sales, nearly half, were there.",
      "Here’s the part worth slowing down for. The median price went up in all three places, but the price of a square foot didn’t. Picture two houses the same size on similar streets, one sold this July and one in a typical month. They sold for about the same. What changed is which homes sold, with more of the larger ones in the mix, and that’s what pulled the median up.",
      "Over a full year, the three places have split. In Sarasota a square foot cost $293 in July, against $273 in July 2025, up 7%. In Lakewood Ranch it was $279 against $278, about the same. In Bradenton it was $225 against $230, down 2%. The same money buys a little less house in Sarasota than it did a year ago, and a little more in Bradenton.",
      "So if you’re comparing homes, or setting a price on your own, start with the square foot. The median tells you what sold. The price of a square foot is the closer guide to what a home is worth.",
    ],
    markets: {
      "lakewood-ranch": [
        "Lakewood Ranch went the other way in July. It had 241 home sales, 13% fewer than a typical month, though still 9% more than July 2025. Its busiest month in the last year was May 2026, with 357 sales, and its slowest was January, with 199.",
        "What sells here is still mostly new. Of those 241 sales, 110 were parcels the county roll still lists as empty. In a place that’s still being built, much of that is new homes the roll hasn’t caught up with. That share, 46%, is about normal here: 47% in a typical month.",
        "Houses sold for a median of $770,000, and condos, villas and townhomes for $335,000. The busiest street was Gander Ter, with 11 sales, then Lilac Sky Ter with 8.",
      ],
      sarasota: [
        "Sarasota had 586 home sales in July, 12% more than a typical month and 10% more than July 2025. Its median price was $530,000.",
        "This is the one place where a square foot costs clearly more than it did a year ago: $293, up 7% from $273. Against a typical month it’s flat, so the rise came over the year, not in July.",
        "Sarasota also has the widest spread of prices. Of its homes, 35% sold for under $400K and 17% for $1.5M and up. Gulf of Mexico Dr on Longboat Key had 20 sales, more than any other street in the three places. Midnight Pass Rd had 11.",
      ],
      bradenton: [
        "Bradenton was the busiest of the three. It had 793 home sales in July, 12% more than a typical month and 20% more than July 2025. June was bigger still, with 1,080, the most of any month in the last 12.",
        "It’s also the most affordable. Half of Bradenton’s homes sold for under $400K, and the median was $399,450. A square foot cost $225, about the same as a typical month and 2% less than a year before.",
        "Much of the activity was in Parrish. Violet Jasper Dr had 12 sales, Shining Blue Nile Ln had 9 and Sassafras Trl had 7.",
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
        why: "In July a square foot cost $279 in Lakewood Ranch, $293 in Sarasota and $225 in Bradenton, about the same as usual. A home priced well above that needs a reason, like the water, the lot or a newer roof. Ask what it is.",
        link: { href: "/neighborhoods", label: "Compare places on Atlas" },
      },
      {
        move: "Check last July, not just last month.",
        why: "One month can swing hard. Bradenton went from 1,080 sales in June to 793 in July. A year back is the steadier test, and it shows Sarasota’s square foot up 7% and Bradenton’s down 2%.",
        link: { href: "/sell/sold", label: "See what sold on a street" },
      },
      {
        move: "In Lakewood Ranch, weigh new against resale.",
        why: "Nearly half of July’s sales there, 46%, were new homes or lots. A new home down the road may carry a different CDD fee than a resale, and that changes what you really pay each year.",
        link: { href: "/guides/cdd-fees-in-lakewood-ranch-village-by-village", label: "CDD fees, village by village" },
      },
    ],
    selling: [
      {
        move: "Set your price from the square foot on your street.",
        why: "Buyers will hold your home up against the price of a square foot nearby. In July that was $279 in Lakewood Ranch, $293 in Sarasota and $225 in Bradenton. None of the three moved much against a typical month.",
        link: { href: "/sell/home-value", label: "Get a value for your home" },
      },
      {
        move: "In Lakewood Ranch, price against the new homes.",
        why: "Buyers there can choose new, and 46% of July’s sales were new homes or lots. A resale has to win on price, finish or location, so decide which one yours wins on before you list.",
        link: { href: "/sell/sold", label: "What sold on your street" },
      },
      {
        move: "Plan your listing around the season.",
        why: "Bradenton had 575 sales in January 2026 and 1,080 in June, and Lakewood Ranch had 199 in January and 357 in May. Sales here follow the calendar. A home that’s ready in the fall is in front of buyers when the spring rush starts.",
        link: { href: "/guides/thinking-about-spring-start-in-october", label: "Why spring starts in October" },
      },
    ],
    watch: [
      "Whether Bradenton keeps its pace and Lakewood Ranch picks back up. Bradenton had 793 sales in July against a typical 706, and Lakewood Ranch had 241 against a typical 277.",
      "Whether Sarasota’s square foot keeps rising. It was $293 in July, up 7% from a year before.",
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
