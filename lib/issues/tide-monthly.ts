import { fullStreet, median, rollChanged, summarize } from "../sales/stats";
import type { County, Sale } from "../sales/types";
import { TIDE_FACTS_COPY } from "../tide/copy";
import { TIDE_COPY, fill } from "./copy";
import {
  C,
  MARKET_NAMES,
  MARKET_ORDER,
  SANS,
  SERIF,
  absolute,
  addressWarnings,
  column,
  dateLong,
  dateShort,
  documentHtml,
  easternDay,
  esc,
  footer,
  header,
  heading,
  link,
  monthLabel,
  para,
  row,
  rule,
  small,
  spacer,
  tagged,
  textHeading,
  wrap,
  type FooterInput,
  type Issue,
  type MarketSlug,
} from "./render";
import type { TideMove } from "../tide/issues";
import type { Narrative, NoteSlot } from "../tide/notes";
import { CITY_MARKET, ZIP_MARKET } from "./tide-markets";

/**
 * Tide, the monthly issue: the previous calendar month from the county
 * sales data, per market. Every figure is computed from the records passed
 * in; the paragraphs are templates (lib/issues/copy.ts) filled with those
 * figures and nothing else. The month's story (an opening, "If you're
 * buying", "If you're selling", what to watch) comes in hand-written from
 * lib/tide/issues.ts, the same words as the web issue; until it's written the
 * draft carries the month's facts to write it from and a dashed box. Joelyn's
 * and Jessica's notes are theirs alone: a dashed box each until they write
 * one. Nothing here is generated prose.
 *
 * Pure: the sales, the manifest facts, the day, the footer and the writing come in.
 */

/** The hand-written parts of the issue, from lib/tide/issues.ts by way of lib/issues/load.ts. */
export type TideWriting = {
  /** The month's story; null until its opening is written. */
  narrative: Narrative | null;
  /** Both signed-note slots, an unwritten one with `paragraphs: null`. */
  notes: NoteSlot[];
  /** The month's notable facts (lib/tide/narrative.ts `writingFacts`), shown in the draft until the story is written. */
  facts: string[];
};

export type TideManifest = {
  generatedAt: string;
  /** `from` is the first sale date in the county's file, when known: a month before it isn't compared against. */
  counties: Partial<Record<County, { label: string; to: string | null; from?: string | null }>>;
};

export type TideIssueInput = {
  /** Qualified sales covering at least the month; anything outside it is ignored. */
  sales: Sale[];
  manifest: TideManifest;
  /** Today in America/New_York, YYYY-MM-DD. */
  today: string;
  /**
   * YYYY-MM, to build a named month. Without it the issue covers the latest
   * month complete in all three markets, looking back from the month before
   * today (never a partial month: the appraisers publish weeks late).
   */
  month?: string;
  footer: Omit<FooterInput, "product">;
  /** The story, the notes and the facts. Without it the draft has a dashed box for each. */
  writing?: TideWriting;
};

export type TideStreet = { label: string; count: number };

export type TideMarket = {
  market: MarketSlug;
  name: string;
  /** Qualified home sales in the month, vacant-on-roll parcels included. */
  count: number;
  /** Median price over the homes: leaving out parcels vacant on the roll or changed since the sale. Null with fewer than two. */
  medianPrice: number | null;
  /** How many homes went into the median price. */
  priceSample: number;
  medianPpsf: number | null;
  /** Homes that went into the $/sqft median. */
  ppsfSample: number;
  /** Sales that were new builds or vacant on the roll. */
  newBuild: number;
  /** newBuild ÷ count as a whole percent; null with no sales. */
  newBuildPct: number | null;
  /** Up to three streets with two or more sales, most first, ties alphabetical. */
  streets: TideStreet[];
  zips: string[];
  /** The median monthly count over the twelve months before; null when the data doesn't reach back. */
  typical: number | null;
  /** False when the month's count is under COMPLETE_RATIO of typical: the appraiser hasn't published the month yet. */
  complete: boolean;
};

/**
 * The appraisers publish a sale only once they've qualified it, weeks after
 * it closes (Manatee runs about two months behind). A market whose count for
 * the month is under this share of its typical month is marked incomplete.
 */
export const COMPLETE_RATIO = 0.75;

export type TideIssue = Issue & {
  kind: "tide";
  month: string;
  markets: TideMarket[];
  /** Qualified home sales in the two counties that month, and how many fell outside the three markets' ZIPs. */
  counties: { total: number; outside: number };
  asOf: string | null;
  through: string | null;
  /** The latest month complete in all three markets, from the month before today back six more; null when none is. */
  latestComplete: string | null;
};

/** The month before the one `today` falls in, as YYYY-MM. */
export function previousMonth(today: string): string {
  const [y, m] = today.split("-").map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Whole months from `a` to `b` (YYYY-MM): 2026-07 to 2026-09 is 2. */
export function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number) as [number, number];
  const [yb, mb] = b.split("-").map(Number) as [number, number];
  return (yb - ya) * 12 + (mb - ma);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return { from: `${month}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
}

/** The market a sale counts toward: the postal city first (Lakewood Ranch), then the ZIP. Null when outside all three. */
export function marketOf(s: Pick<Sale, "zip" | "city">): MarketSlug | null {
  return CITY_MARKET[s.city?.toUpperCase() ?? ""] ?? ZIP_MARKET[s.zip] ?? null;
}

/** A home sale: anything but the non-residential "other" parcels. Vacant stays in: new builds the roll hasn't caught up with read as vacant. */
export const isHomeSale = (s: Sale) => s.propertyUse !== "other";

/** The roll shows the parcel as vacant, a year built in or after the sale year, or a change after the sale. */
export function isNewBuildOrVacant(s: Sale): boolean {
  if (s.propertyUse === "vacant" || rollChanged(s)) return true;
  const saleYear = Number(s.saleDate.slice(0, 4));
  return Boolean(s.yearBuilt && saleYear && s.yearBuilt >= saleYear);
}

const DIRS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);
const SMALL = new Set(["OF", "THE", "AND", "DE", "LA", "DEL"]);
/** "LAKEWOOD RANCH BLVD" → "Lakewood Ranch Blvd", "74TH AVE E" → "74th Ave E". */
export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      if (DIRS.has(w)) return w;
      if (i > 0 && SMALL.has(w)) return w.toLowerCase();
      if (/^\d+(ST|ND|RD|TH)$/.test(w)) return w.toLowerCase();
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Postal cities that are a market's own name: on a street label they say nothing, or the wrong thing (a 34211 "Bradenton" address counts in Lakewood Ranch). */
const MARKET_CITIES = new Set(Object.values(MARKET_NAMES).map((n) => n.toUpperCase()));

/**
 * The streets with the most sales. Same-named streets in different places stay
 * apart ("Gulf of Mexico Dr, Longboat Key"); a postal city that is one of the
 * three markets' names is dropped, so one street's addresses spelled
 * BRADENTON and LAKEWOOD RANCH count together, under the market they're in.
 */
export function topStreets(rows: Sale[], n = 3): TideStreet[] {
  const m = new Map<string, TideStreet>();
  for (const r of rows) {
    const street = fullStreet(r);
    if (!street) continue;
    const place = MARKET_CITIES.has(r.city.toUpperCase()) ? "" : r.city;
    const label = place ? `${titleCase(street)}, ${titleCase(place)}` : titleCase(street);
    const cur = m.get(label);
    if (cur) cur.count += 1;
    else m.set(label, { label, count: 1 });
  }
  return [...m.values()]
    .filter((s) => s.count >= 2)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, n);
}

/** A sale the issue counts: qualified, priced, and a home (not the non-residential "other" parcels). */
export const counted = (s: Sale) => s.qualified && s.salePrice > 0 && isHomeSale(s);

/** Qualified home sales per market per month (YYYY-MM), for the completeness check. */
export function monthlyCounts(sales: Sale[]): Map<string, Record<MarketSlug, number>> {
  const out = new Map<string, Record<MarketSlug, number>>();
  for (const s of sales) {
    if (!counted(s)) continue;
    const market = marketOf(s);
    if (!market) continue;
    const k = s.saleDate.slice(0, 7);
    const row = out.get(k) ?? { "lakewood-ranch": 0, sarasota: 0, bradenton: 0 };
    row[market] += 1;
    out.set(k, row);
  }
  return out;
}

/** The median count over the twelve months before `month`, counting only months the data reaches. */
function typicalCount(counts: Map<string, Record<MarketSlug, number>>, month: string, market: MarketSlug): number | null {
  const prior: number[] = [];
  for (let i = 1; i <= 12; i += 1) {
    const row = counts.get(addMonths(month, -i));
    if (row) prior.push(row[market]);
  }
  if (prior.length < 3) return null;
  return Math.round(median(prior) as number);
}

/** Qualified home sales in both counties in the month, and how many are outside the three markets' ZIPs. */
export function countyTotals(sales: Sale[], month: string): { total: number; outside: number } {
  const { from, to } = monthBounds(month);
  const inMonth = sales.filter((s) => counted(s) && s.saleDate >= from && s.saleDate <= to);
  return { total: inMonth.length, outside: inMonth.filter((s) => marketOf(s) === null).length };
}

/** A built home whose roll facts are the ones that were paid for: the sales the median price is taken over. */
const isPricedHome = (s: Sale) => s.propertyUse !== "vacant" && !rollChanged(s);

/** Every per-market figure for the month, computed from the rows. */
export function tideStats(sales: Sale[], month: string): TideMarket[] {
  const { from, to } = monthBounds(month);
  const inMonth = sales.filter((s) => counted(s) && s.saleDate >= from && s.saleDate <= to);
  const counts = monthlyCounts(sales);
  return MARKET_ORDER.map((market) => {
    const rows = inMonth.filter((s) => marketOf(s) === market);
    const sum = summarize(rows);
    const homes = rows.filter(isPricedHome).map((s) => s.salePrice);
    const newBuild = rows.filter(isNewBuildOrVacant).length;
    const typical = typicalCount(counts, month, market);
    return {
      market,
      name: MARKET_NAMES[market],
      count: rows.length,
      medianPrice: homes.length >= 2 ? Math.round(median(homes) as number) : null,
      priceSample: homes.length,
      medianPpsf: sum.medianPricePerSqft,
      ppsfSample: sum.sqftSampleSize,
      newBuild,
      newBuildPct: rows.length ? Math.round((100 * newBuild) / rows.length) : null,
      streets: topStreets(rows),
      zips: Object.entries(ZIP_MARKET)
        .filter(([, m]) => m === market)
        .map(([z]) => z)
        .sort(),
      typical,
      complete: typical === null || rows.length >= COMPLETE_RATIO * typical,
    };
  });
}

/** The latest month at or before `month`, up to six back, complete in all three markets. */
export function latestCompleteMonth(sales: Sale[], month: string): string | null {
  for (let i = 0; i <= 6; i += 1) {
    const m = addMonths(month, -i);
    const stats = tideStats(sales, m);
    if (stats.every((s) => s.complete && s.typical !== null)) return m;
  }
  return null;
}

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const num = (n: number) => new Intl.NumberFormat("en-US").format(n);
const list = (items: string[]) => (items.length <= 2 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** The one plain paragraph per market, from the templates and the figures. */
export function marketParagraph(m: TideMarket, month: string): string {
  const monthName = monthLabel(month);
  if (!m.complete && !m.count) return fill(TIDE_COPY.marketPartialNone, { market: m.name, month: monthName, typical: num(m.typical as number) });
  if (!m.count) return fill(TIDE_COPY.marketNone, { market: m.name, month: monthName });
  const parts = [
    !m.complete
      ? fill(TIDE_COPY.marketPartial, { market: m.name, count: num(m.count), sales: m.count === 1 ? "sale" : "sales", month: monthName, typical: num(m.typical as number) })
      : m.count === 1
        ? fill(TIDE_COPY.marketOneSale, { market: m.name, month: monthName }) : fill(TIDE_COPY.marketSales, { market: m.name, count: num(m.count), month: monthName }),
    m.medianPrice !== null ? fill(TIDE_COPY.marketMedian, { n: num(m.priceSample), price: usd(m.medianPrice) }) : TIDE_COPY.marketMedianNone,
    m.medianPpsf !== null ? fill(TIDE_COPY.marketPpsf, { n: num(m.ppsfSample), ppsf: usd(m.medianPpsf) }) : TIDE_COPY.marketPpsfNone,
    fill(TIDE_COPY.marketNew, { share: `${m.newBuildPct}%` }),
    m.streets.length === 0
      ? TIDE_COPY.marketStreetsNone
      : fill(m.streets.length === 1 ? TIDE_COPY.marketStreetsOne : TIDE_COPY.marketStreets, { streets: list(m.streets.map((s) => `${s.label} (${s.count})`)) }),
  ];
  return parts.join(" ");
}

const HUB: Record<MarketSlug, string> = { "lakewood-ranch": "/lakewood-ranch", sarasota: "/sarasota", bradenton: "/bradenton" };
const COUNTY_SHORT: Record<County, string> = { manatee: "Manatee", sarasota: "Sarasota" };

/** The month an issue built on `today` covers: the one named, else the latest complete one, else the previous month (built and held). */
export function tideMonthFor(sales: Sale[], today: string, month?: string): string {
  return month ?? latestCompleteMonth(sales, previousMonth(today)) ?? previousMonth(today);
}

/** A dashed box: a placeholder for the team, or the writer's facts. Never for a reader. */
function dashedBox(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;"><tr><td style="padding:18px 20px;border:2px dashed ${C.amber};background-color:${C.white};">${inner}</td></tr></table>`;
}
const boxLine = (text: string, extra = "") => `<p style="margin:0 0 8px 0;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.amber};${extra}">${esc(text)}</p>`;

export function buildTideIssue(input: TideIssueInput): TideIssue {
  const prev = previousMonth(input.today);
  const latestComplete = latestCompleteMonth(input.sales, prev);
  // The default is never a partial month; without a complete one, the previous month is built and held.
  const month = input.month ?? latestComplete ?? prev;
  const story = input.writing?.narrative ?? null;
  // The story proper is the opening; the rest of the narrative (the cover, the markets, the moves) shows whatever is written.
  const told = Boolean(story?.opening.length);
  const notes: NoteSlot[] = input.writing?.notes ?? [
    { key: "joelyn", name: "Joelyn Nauman", first: "Joelyn", paragraphs: null },
    { key: "jessica", name: "Jessica Garza", first: "Jessica", paragraphs: null },
  ];
  const facts = input.writing?.facts ?? [];
  const { from, to } = monthBounds(month);
  const monthName = monthLabel(month);
  const campaign = `tide-${month}`;
  const site = input.footer.siteUrl;
  const markets = tideStats(input.sales, month);
  const url = (path: string) => tagged(absolute(site, path), "tide", campaign);

  const asOfDay = input.manifest.generatedAt && !Number.isNaN(Date.parse(input.manifest.generatedAt)) ? easternDay(new Date(input.manifest.generatedAt)) : null;
  const asOf = asOfDay ? dateLong(asOfDay) : null;
  const ends = (Object.entries(input.manifest.counties) as [County, { to: string | null }][]).filter(([, c]) => c?.to).map(([k, c]) => [k, c.to as string] as const);
  const earliestEnd = ends.length ? ends.map(([, t]) => t).sort()[0]! : null;
  const through =
    earliestEnd && earliestEnd < to
      ? new Set(ends.map(([, t]) => t)).size === 1
        ? dateLong(earliestEnd)
        : list(ends.map(([k, t]) => `${dateShort(t)} (${COUNTY_SHORT[k]})`))
      : null;

  const warnings = [...addressWarnings(input.footer.officeAddress)];
  if (through) warnings.push(`The county files end on ${dateLong(earliestEnd!)}, before the end of ${monthName}: the figures are for a partial month, and the issue says so. Refresh the sales data (docs/SALES-DATA.md) and rebuild for the whole month.`);
  if (!asOf) warnings.push("The sales manifest has no generated date, so the source line can't say when the data is from.");
  for (const m of markets.filter((x) => !x.complete)) {
    warnings.push(
      `${m.name}: ${m.count} qualified home ${m.count === 1 ? "sale" : "sales"} published for ${monthName}, against a typical month of ${m.typical}. The month isn't complete on the county record yet, and the issue says so.`,
    );
  }
  const partial = markets.some((m) => !m.complete) || (!input.month && !latestComplete);
  if (partial) {
    warnings.push(
      latestComplete
        ? `${monthName} isn't complete on the county record, so the hand-off holds this issue from the Zap. The latest month complete in all three markets is ${monthLabel(latestComplete)}, which the default build covers (leave out ?month=).`
        : `None of the seven months up to ${monthLabel(prev)} is complete in all three markets, so this issue covers ${monthName} as far as the record goes and the hand-off holds it from the Zap. Check the sales data (docs/SALES-DATA.md).`,
    );
  }
  const behind = monthsBetween(month, prev);
  if (!input.month && latestComplete && behind >= 3) {
    warnings.push(
      `The county record is further behind than usual: the latest complete month, ${monthName}, is ${behind} months before ${monthLabel(prev)}. If ${monthName} already went out, skip this issue and refresh the sales data (docs/SALES-DATA.md).`,
    );
  }
  if (asOfDay && Date.parse(`${input.today}T00:00:00Z`) - Date.parse(`${asOfDay}T00:00:00Z`) > 31 * 86_400_000) {
    warnings.push(`The sales data was last refreshed on ${asOf}. Refresh it (docs/SALES-DATA.md) so Tide can move on to the next complete month.`);
  }
  if (markets.every((m) => !m.count)) warnings.push(`No qualified home sales in ${monthName} in any of the three markets: the sales data may not cover that month.`);

  const subject = fill(TIDE_COPY.subject, { month: monthName });
  const preheader = story?.dek ?? fill(TIDE_COPY.preheader, { month: monthName });
  const title = story?.headline ?? fill(TIDE_COPY.title, { month: monthName });
  const intro = fill(TIDE_COPY.intro, { month: monthName });
  const coverage = month === latestComplete ? fill(TIDE_COPY.coverage, { month: monthName }) : null;
  const counties = countyTotals(input.sales, month);
  const outside = counties.outside ? fill(TIDE_COPY.outside, { outside: num(counties.outside), total: num(counties.total), month: monthName }) : null;
  const lag = through ? fill(TIDE_COPY.lag, { through }) : null;
  const source = fill(TIDE_COPY.source, { asOf: asOf ?? "the last refresh" });

  const figure = (value: string, label: string) =>
    `<td width="50%" valign="top" style="width:50%;padding:12px 12px 12px 0;border-top:1px solid ${C.rule};"><p style="margin:0 0 2px 0;font-family:${SERIF};font-size:26px;line-height:1.2;color:${C.navy};">${esc(value)}</p><p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.4;letter-spacing:0.5px;text-transform:uppercase;color:${C.muted};">${esc(label)}</p></td>`;
  const figures = (m: TideMarket) => {
    const cells = [
      figure(num(m.count), m.complete ? TIDE_COPY.figureSales : TIDE_COPY.figureSalesPartial),
      figure(m.medianPrice !== null ? usd(m.medianPrice) : "–", TIDE_COPY.figureMedian),
      figure(m.medianPpsf !== null ? usd(m.medianPpsf) : "–", TIDE_COPY.figurePpsf),
      figure(m.newBuildPct !== null ? `${m.newBuildPct}%` : "–", TIDE_COPY.figureNew),
    ];
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;"><tr>${cells[0]}${cells[1]}</tr><tr>${cells[2]}${cells[3]}</tr></table>`;
  };
  // A market's words: the hand-written paragraphs when written, else the computed one; then its one move, set apart.
  const marketWords = (m: TideMarket) => story?.markets[m.market] ?? [marketParagraph(m, month)];
  const marketMove = (m: TideMarket) => story?.marketMoves[m.market] ?? null;
  const moveLine = (market: string, text: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px 0;"><tr><td style="padding:2px 0 2px 16px;border-left:3px solid ${C.amber};"><p style="margin:0 0 4px 0;font-family:${SANS};font-size:12px;line-height:1.4;letter-spacing:0.5px;text-transform:uppercase;color:${C.muted};">${esc(fill(TIDE_COPY.marketMoveLabel, { market }))}</p><p style="margin:0;font-family:${SERIF};font-size:19px;line-height:1.4;color:${C.navy};">${esc(text)}</p></td></tr></table>`;
  const marketHtml = (m: TideMarket) =>
    heading(m.name) +
    figures(m) +
    marketWords(m).map((p) => para(esc(p))).join("") +
    (marketMove(m) ? moveLine(m.name, marketMove(m)!) : "") +
    small(esc(fill(TIDE_COPY.marketZips, { zips: list(m.zips) }))) +
    para(link(url(HUB[m.market]), fill(TIDE_COPY.marketLink, { market: m.name })), "font-size:15px;");

  const links: [string, string][] = [
    [TIDE_COPY.linkSold, "/sell/sold"],
    [TIDE_COPY.linkRelocate, "/relocate"],
    ...MARKET_ORDER.map((m) => [MARKET_NAMES[m], HUB[m]] as [string, string]),
  ];

  // The story: the hand-written opening in place of the plain intro, then buying and selling; or, before it's written, the facts and a box.
  const opening = told ? story!.opening : [intro];
  const factsHtml = facts.length
    ? dashedBox(boxLine(TIDE_FACTS_COPY.heading, "font-weight:bold;") + boxLine(TIDE_FACTS_COPY.note, "font-style:italic;") + facts.map((f) => boxLine(`• ${f}`)).join(""))
    : "";
  const storyBoxHtml = dashedBox(boxLine(TIDE_COPY.storyPlaceholder, "margin:0;font-style:italic;"));
  const dekHtml = story?.dek ? para(esc(story.dek), `font-family:${SERIF};font-size:19px;line-height:1.45;color:${C.navy};`) : "";
  // Buying and selling: three numbered moves each when written (the move, why, and a quiet link), else the first format's paragraphs.
  const moveHtml = (mv: TideMove, i: number) =>
    `<p style="margin:0 0 6px 0;font-family:${SERIF};font-size:19px;line-height:1.35;color:${C.navy};">${i + 1}. ${esc(mv.move)}</p>` +
    para(esc(mv.why), "margin:0 0 8px 0;") +
    (mv.link ? para(link(url(mv.link.href), mv.link.label), "margin:0 0 18px 0;font-size:15px;") : `<div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>`);
  const adviceBlock = (headingText: string, moves: TideMove[], legacy: string[]) =>
    moves.length ? heading(headingText) + moves.map(moveHtml).join("") : legacy.length ? heading(headingText) + legacy.map((p) => para(esc(p))).join("") : "";
  const hasAdvice = Boolean(story && (story.buying.length || story.selling.length || story.buyers.length || story.sellers.length));
  const adviceHtml = story && hasAdvice
    ? [adviceBlock(TIDE_COPY.buyersHeading, story.buying, story.buyers), adviceBlock(TIDE_COPY.sellersHeading, story.selling, story.sellers), small(esc(TIDE_COPY.limits))].join("")
    : "";
  const watchHtml = story?.watch.length ? heading(TIDE_COPY.watchHeading) + story.watch.map((w) => para(`• ${esc(w)}`, "margin:0 0 10px 0;")).join("") : "";
  const noteHtml = (n: NoteSlot) =>
    n.paragraphs
      ? n.paragraphs.map((p) => para(esc(p))).join("") + para(esc(fill(TIDE_COPY.noteSign, { name: n.name })), "font-style:italic;")
      : dashedBox(boxLine(fill(TIDE_COPY.notePlaceholder, { first: n.first }), "margin:0;font-style:italic;"));
  const notesHtml = notes.length ? heading(TIDE_COPY.notesHeading) + notes.map(noteHtml).join("") : "";
  const placeholders = (told ? 0 : 1) + notes.filter((n) => !n.paragraphs).length;

  const textAdvice = (headingText: string, moves: TideMove[], legacy: string[]) =>
    moves.length
      ? [textHeading(headingText), ...moves.flatMap((mv, i) => [`${i + 1}. ${mv.move}`, mv.why, ...(mv.link ? [`${mv.link.label}: ${url(mv.link.href)}`] : []), ""])]
      : legacy.length
        ? [textHeading(headingText), ...legacy.flatMap((p) => [p, ""])]
        : [];

  const foot = footer({ ...input.footer, product: "Tide" }, "tide", campaign);
  const rows = [
    header({ eyebrow: TIDE_COPY.eyebrow, wordmark: "Tide", title, homeHref: url("/blog") }),
    spacer(24),
    ...(told ? [] : facts.length ? [row(factsHtml)] : []),
    row(dekHtml + opening.map((p) => para(esc(p))).join("") + (coverage ? para(esc(coverage)) : "") + (outside ? para(esc(outside)) : "") + (lag ? small(esc(lag)) : "")),
    ...(told ? [] : [row(storyBoxHtml)]),
    ...(adviceHtml ? [rule(), spacer(16), row(adviceHtml)] : []),
    ...markets.flatMap((m) => [rule(), spacer(16), row(marketHtml(m), "0 32px 16px 32px")]),
    ...(watchHtml ? [rule(), spacer(16), row(watchHtml)] : []),
    ...(notesHtml ? [rule(), spacer(16), row(notesHtml)] : []),
    rule(),
    spacer(16),
    row(heading(TIDE_COPY.linksHeading) + links.map(([label, path]) => para(link(url(path), label), "margin:0 0 8px 0;")).join("")),
    row(small(esc(source)) + small(esc(TIDE_COPY.methods))),
    foot.html,
  ];
  const bodyHtml = column(rows.join("\n"));
  const html = documentHtml({ title: subject, preheader, body: bodyHtml });

  const text = wrap(
    [
      `TIDE · ${title.toUpperCase()}`,
      "",
      ...(!told && facts.length ? [`[${TIDE_FACTS_COPY.heading.toUpperCase()}. ${TIDE_FACTS_COPY.note}`, ...facts.map((f) => `- ${f}`), "]", ""] : []),
      ...(story?.dek ? [story.dek, ""] : []),
      ...opening.flatMap((p, i) => (i ? ["", p] : [p])),
      ...(coverage ? ["", coverage] : []),
      ...(outside ? ["", outside] : []),
      ...(lag ? ["", lag] : []),
      "",
      ...(told ? [] : [`[${TIDE_COPY.storyPlaceholder}]`, ""]),
      ...(story && hasAdvice
        ? [
            ...textAdvice(TIDE_COPY.buyersHeading, story.buying, story.buyers),
            ...textAdvice(TIDE_COPY.sellersHeading, story.selling, story.sellers),
            TIDE_COPY.limits,
            "",
          ]
        : []),
      ...markets.flatMap((m) => [
        textHeading(m.name),
        `${m.complete ? TIDE_COPY.figureSales : TIDE_COPY.figureSalesPartial}: ${num(m.count)} · ${TIDE_COPY.figureMedian}: ${m.medianPrice !== null ? usd(m.medianPrice) : "–"} · ${TIDE_COPY.figurePpsf}: ${m.medianPpsf !== null ? usd(m.medianPpsf) : "–"} · ${TIDE_COPY.figureNew}: ${m.newBuildPct !== null ? `${m.newBuildPct}%` : "–"}`,
        "",
        ...marketWords(m).flatMap((p, i) => (i ? ["", p] : [p])),
        ...(marketMove(m) ? ["", `${fill(TIDE_COPY.marketMoveLabel, { market: m.name })}: ${marketMove(m)}`] : []),
        "",
        fill(TIDE_COPY.marketZips, { zips: list(m.zips) }),
        `${fill(TIDE_COPY.marketLink, { market: m.name })}: ${url(HUB[m.market])}`,
        "",
      ]),
      ...(story?.watch.length ? [textHeading(TIDE_COPY.watchHeading), ...story.watch.map((w) => `- ${w}`), ""] : []),
      ...(notes.length
        ? [
            textHeading(TIDE_COPY.notesHeading),
            ...notes.flatMap((n) => (n.paragraphs ? [...n.paragraphs.flatMap((p) => [p, ""]), fill(TIDE_COPY.noteSign, { name: n.name }), ""] : [`[${fill(TIDE_COPY.notePlaceholder, { first: n.first })}]`, ""])),
          ]
        : []),
      textHeading(TIDE_COPY.linksHeading),
      ...links.map(([label, path]) => `- ${label}: ${url(path)}`),
      "",
      source,
      TIDE_COPY.methods,
      "",
      foot.text,
    ].join("\n"),
  );

  return {
    kind: "tide",
    subject,
    preheader,
    period: { from, to, label: monthName },
    html,
    bodyHtml,
    text,
    needsEdit: placeholders > 0,
    ...(placeholders > 0 ? { placeholder: TIDE_COPY.placeholder } : {}),
    warnings,
    ...(partial ? { hold: `${monthName} isn't complete on the county record in all three markets` } : {}),
    month,
    markets,
    asOf,
    through,
    latestComplete,
    counties,
  };
}

/** The subject of the internal email that carries the issue to the team. */
export function tideTeamSubject(issue: Pick<Issue, "period">): string {
  return `Tide, ${issue.period.label}: ready to send`;
}
