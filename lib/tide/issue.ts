import { checkFairHousing, type FairHousingResult } from "../fair-housing";
import { TIDE_COPY, fill } from "../issues/copy";
import { MARKET_NAMES, MARKET_ORDER, dateLong, easternDay, monthLabel, type MarketSlug } from "../issues/render";
import {
  addMonths,
  counted,
  latestCompleteMonth,
  marketOf,
  marketParagraph,
  monthBounds,
  previousMonth,
  tideStats,
  topStreets,
  type TideManifest,
  type TideMarket,
  type TideStreet,
} from "../issues/tide-monthly";
import type { ImageRef } from "../content/types";
import { median, rollChanged } from "../sales/stats";
import type { Sale } from "../sales/types";
import { TIDE_WEB_COPY as W } from "./copy";
import { tideCover } from "./cover";
import type { TideIssueEntry } from "./issues";
import { narrativeOf, narrativeParagraphs, noteSlots, type Narrative, type NoteSlot } from "./notes";

/**
 * The Tide web issue (/tide/<issue>) as data. Every figure is computed from
 * the county sales passed in, with the same engine functions the email issue
 * uses (lib/issues/tide-monthly.ts), so the page and the email agree. The
 * page renders this model and adds no figures of its own.
 *
 * Two months matter:
 * - the issue month, when the issue goes out (October 2026);
 * - the data month, the latest month the county record has complete in all
 *   three markets, looking back from the month before the issue (July 2026
 *   on the October 1 data). An entry in lib/tide/issues.ts may pin it.
 *
 * Pure: the sales, the manifest, the posts and the entry come in.
 */

/** How many months the charts cover, ending with the data month. */
export const CHART_MONTHS = 12;
/** How many streets "Where it sold" lists per market. */
export const STREETS_PER_MARKET = 5;

export type Baseline = {
  /** The median of the monthly values over the twelve months before the data month; null with fewer than three such months. */
  count: number | null;
  medianPrice: number | null;
  medianPpsf: number | null;
  newBuildPct: number | null;
  /** How many prior months the baselines are taken over. */
  months: number;
};

export type MonthPoint = {
  month: string;
  count: number;
  medianPrice: number | null;
  medianPpsf: number | null;
  newBuildPct: number | null;
};

/** The same month a year before the data month, and the data month's change against it. */
export type LastYear = {
  month: string;
  count: number;
  medianPrice: number | null;
  medianPpsf: number | null;
  /** The data month against it, in percent, unrounded; null when either side is missing or zero. */
  countPct: number | null;
  pricePct: number | null;
  ppsfPct: number | null;
};

export type MixKey = "single-family" | "attached" | "land";
/** One kind of home in the data month: how many sold, their share of the market's home sales, and their median price. */
export type MixPart = {
  key: MixKey;
  label: string;
  count: number;
  /** Whole percent of the month's home sales; the three parts add up to 100. Null with no sales. */
  share: number | null;
  /** Over the homes of this kind the county lists as built and unchanged since the sale; null with fewer than two (and always for land). */
  medianPrice: number | null;
  priceSample: number;
};

export type BandKey = "under-400k" | "400k-750k" | "750k-1.5m" | "1.5m-up";
/** A price band: [from, to) in dollars, `to` null for the top band. */
export type PriceBand = { key: BandKey; label: string; from: number; to: number | null; count: number; share: number | null };
/** The month's homes by price, over the same homes as the median price. */
export type Bands = { sample: number; bands: PriceBand[] };

/** All three markets together for the data month. */
export type Combined = {
  count: number;
  /** The median of the three markets' combined monthly sales over the twelve months before; null with fewer than three. */
  typical: number | null;
  /** Against the typical month: sales and percent (unrounded). */
  diff: number | null;
  pct: number | null;
  lastYear: { month: string; count: number; pct: number | null } | null;
  /** Each market's part of the total, whole percents adding to 100. */
  parts: { market: MarketSlug; name: string; count: number; share: number | null }[];
};

export type IssueMarket = {
  market: MarketSlug;
  name: string;
  href: string;
  /** The data month's figures, exactly as the email computes them. */
  stats: TideMarket;
  baseline: Baseline;
  /** Up to five streets with two or more sales, most first. */
  streets: TideStreet[];
  /** The chart months, oldest first. */
  series: MonthPoint[];
  /** The same month a year earlier; null when the data doesn't reach it. */
  lastYear: LastYear | null;
  /** Single-family, then condos, villas and townhomes, then land (parcels vacant on the roll). */
  mix: MixPart[];
  bands: Bands;
  /** The hand-written paragraphs for this market when written; else the computed paragraph the email uses. */
  story: { paragraphs: string[]; written: boolean };
};

export type ChartSeries = { market: MarketSlug; name: string; values: (number | null)[] };

export type ChartModel = {
  id: "sales" | "ppsf";
  title: string;
  note: string;
  axisLabel: string;
  unit: "count" | "usd";
  months: string[];
  /** "Aug" style labels, with the year on January and on the first month. */
  monthLabels: string[];
  series: ChartSeries[];
  /** The y-axis range and ticks, computed from the values. */
  yMin: number;
  yMax: number;
  ticks: number[];
  /** True when the axis starts at zero; otherwise `baselineLabel` names where it starts. */
  zeroBased: boolean;
  baselineLabel: string | null;
};

export type IssueGuide = { slug: string; title: string; excerpt: string; publishedAt: string };

export type IssueModel = {
  issue: string;
  issueLabel: string;
  dataMonth: string;
  dataLabel: string;
  /** The latest month complete in all three markets on this data, looking back from the month before the issue. */
  latestComplete: string | null;
  /** True when the entry pins the data month. */
  pinned: boolean;
  title: string;
  eyebrow: string;
  note: string;
  intro: string;
  description: string;
  markets: IssueMarket[];
  combined: Combined;
  /** The cover photograph, rotated by issue month. */
  cover: ImageRef;
  /** About how long the page takes to read, in whole minutes. */
  minutes: number;
  charts: { sales: ChartModel; ppsf: ChartModel };
  guides: IssueGuide[];
  /** The month's words in the site's voice, hand-written in lib/tide/issues.ts; null until any of it is written. Each field may be empty. */
  narrative: Narrative | null;
  /** The plain line the page opens with while there's no narrative. */
  framing: string;
  /** The cover's headline and dek: the written ones, or computed lines until they're written. */
  headline: string;
  dek: string;
  /** "Figures for July 2026 from the county record · 9 min read". */
  coverLine: string;
  /** The line under the combined figure: "home sales across the three markets in July, 7% more than a typical month". */
  combinedLine: string;
  /**
   * The signed notes to show: only the ones Joelyn or Jessica wrote; in sample
   * previews (NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true) both, an empty one as a
   * marked placeholder.
   */
  notes: NoteSlot[];
  /**
   * Compatibility for lib/search/sources.ts, which indexes this as the issue's
   * "What it means" section: the narrative's paragraphs in page order (never
   * the signed notes), or null. New code reads `narrative`.
   */
  commentary: string[] | null;
  /** The as-of date of the county files, "October 1, 2026". */
  asOf: string | null;
  source: string;
  methods: string;
  fairHousing: FairHousingResult;
};

export type IssueInput = {
  entry: TideIssueEntry;
  sales: Sale[];
  manifest: TideManifest;
  posts: { slug: string; title: string; excerpt: string; publishedAt: string; categories: string[] }[];
  /** NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS === "true". */
  showSamples?: boolean;
};

const HUB: Record<MarketSlug, string> = { "lakewood-ranch": "/lakewood-ranch", sarasota: "/sarasota", bradenton: "/bradenton" };

export const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const num = (n: number) => new Intl.NumberFormat("en-US").format(n);
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aug", or "Jan 2026" on a January and on the first label. */
export function shortMonth(month: string, withYear = false): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const name = MONTH_SHORT[m - 1]!;
  return withYear || m === 1 ? `${name} ${y}` : name;
}

/** The `n` months ending with `last`, oldest first. */
export function monthsEnding(last: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(last, i - (n - 1)));
}

/** The month the figures cover: the entry's pin, or the latest month complete in all three markets as of the issue. */
export function dataMonthFor(entry: TideIssueEntry, sales: Sale[]): { dataMonth: string; latestComplete: string | null } {
  const prev = previousMonth(`${entry.issue}-01`);
  const latestComplete = latestCompleteMonth(sales, prev);
  return { dataMonth: entry.data ?? latestComplete ?? prev, latestComplete };
}

/** Per market, the monthly figures for each month asked, computed the way the email computes one month. */
export function monthlySeries(sales: Sale[], months: string[]): Record<MarketSlug, MonthPoint[]> {
  const out = { "lakewood-ranch": [], sarasota: [], bradenton: [] } as Record<MarketSlug, MonthPoint[]>;
  for (const month of months) {
    for (const s of tideStats(sales, month)) {
      out[s.market].push({ month, count: s.count, medianPrice: s.medianPrice, medianPpsf: s.medianPpsf, newBuildPct: s.newBuildPct });
    }
  }
  return out;
}

const medianOf = (values: (number | null)[]): number | null => {
  const v = values.filter((x): x is number => x !== null);
  return v.length >= 3 ? Math.round(median(v) as number) : null;
};

/** The typical month: the median of each monthly figure over the twelve months before `month`, over the months the data reaches. */
export function baselines(sales: Sale[], month: string): Record<MarketSlug, Baseline> {
  const prior = monthsEnding(addMonths(month, -1), 12);
  const covered = new Set(sales.filter(counted).map((s) => s.saleDate.slice(0, 7)));
  const reached = prior.filter((m) => covered.has(m));
  const series = monthlySeries(sales, reached);
  return Object.fromEntries(
    MARKET_ORDER.map((m) => [
      m,
      {
        count: medianOf(series[m].map((p) => p.count)),
        medianPrice: medianOf(series[m].map((p) => p.medianPrice)),
        medianPpsf: medianOf(series[m].map((p) => p.medianPpsf)),
        newBuildPct: medianOf(series[m].map((p) => p.newBuildPct)),
        months: reached.length,
      },
    ]),
  ) as Record<MarketSlug, Baseline>;
}

/** The qualified home sales in a market in a month: the rows the email counts. */
export function marketRows(sales: Sale[], month: string, market: MarketSlug): Sale[] {
  const { from, to } = monthBounds(month);
  return sales.filter((s) => counted(s) && s.saleDate >= from && s.saleDate <= to && marketOf(s) === market);
}

/** Whole percents of the total that add up to 100 (largest remainder, ties to the earlier part); null each with a zero total. */
export function shares(counts: number[]): (number | null)[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => null);
  const raw = counts.map((c) => (100 * c) / total);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ rem: r - out[i]!, i })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    out[i]! += 1;
    left -= 1;
  }
  return out;
}

export const pctChange = (now: number | null, then: number | null): number | null => (now === null || then === null || then === 0 ? null : (100 * (now - then)) / then);

/**
 * Whether the data covers the whole of `month`: some counted sale falls in
 * it, and every county file starts on or before its first day (the record
 * begins in October 2024, so a month before that, or a partial first month,
 * isn't compared against).
 */
export function monthCovered(sales: Sale[], month: string, manifest?: TideManifest): boolean {
  const { from } = monthBounds(month);
  const starts = Object.values(manifest?.counties ?? {}).map((c) => c?.from ?? null);
  if (starts.some((d) => d && d > from)) return false;
  return sales.some((s) => counted(s) && s.saleDate.slice(0, 7) === month);
}

/** Per market, the same month a year before `month` and the change against it; null for every market when the data doesn't cover it. */
export function lastYearFor(sales: Sale[], month: string, manifest?: TideManifest): Record<MarketSlug, LastYear | null> {
  const then = addMonths(month, -12);
  const none = { "lakewood-ranch": null, sarasota: null, bradenton: null };
  if (!monthCovered(sales, then, manifest)) return none;
  const now = new Map(tideStats(sales, month).map((s) => [s.market, s]));
  return Object.fromEntries(
    tideStats(sales, then).map((p) => {
      const n = now.get(p.market)!;
      return [
        p.market,
        {
          month: then,
          count: p.count,
          medianPrice: p.medianPrice,
          medianPpsf: p.medianPpsf,
          countPct: pctChange(n.count, p.count),
          pricePct: pctChange(n.medianPrice, p.medianPrice),
          ppsfPct: pctChange(n.medianPpsf, p.medianPpsf),
        },
      ];
    }),
  ) as Record<MarketSlug, LastYear | null>;
}

const MIX_LABEL: Record<MixKey, string> = { "single-family": W.mixSingleFamily, attached: W.mixAttached, land: W.mixLand };
const MIX: { key: MixKey; uses: Sale["propertyUse"][] }[] = [
  { key: "single-family", uses: ["single-family"] },
  { key: "attached", uses: ["condo", "villa", "townhome"] },
  { key: "land", uses: ["vacant"] },
];

/** The month's home sales by kind: single-family; condos, villas and townhomes; and land (vacant on the roll). Medians leave out land and parcels changed since the sale, as the market's median does. */
export function homeMix(rows: Sale[]): MixPart[] {
  const parts = MIX.map(({ key, uses }) => {
    const of = rows.filter((r) => uses.includes(r.propertyUse));
    const priced = key === "land" ? [] : of.filter((r) => !rollChanged(r)).map((r) => r.salePrice);
    return { key, count: of.length, priced };
  });
  const sh = shares(parts.map((p) => p.count));
  return parts.map((p, i) => ({
    key: p.key,
    label: MIX_LABEL[p.key],
    count: p.count,
    share: sh[i]!,
    medianPrice: p.priced.length >= 2 ? Math.round(median(p.priced) as number) : null,
    priceSample: p.priced.length,
  }));
}

/** The four price bands, in dollars: under $400k, $400k to $750k, $750k to $1.5M, $1.5M and up. */
export const PRICE_BANDS: { key: BandKey; from: number; to: number | null }[] = [
  { key: "under-400k", from: 0, to: 400_000 },
  { key: "400k-750k", from: 400_000, to: 750_000 },
  { key: "750k-1.5m", from: 750_000, to: 1_500_000 },
  { key: "1.5m-up", from: 1_500_000, to: null },
];
const BAND_LABEL: Record<BandKey, string> = {
  "under-400k": W.bandUnder400,
  "400k-750k": W.band400to750,
  "750k-1.5m": W.band750to1500,
  "1.5m-up": W.band1500up,
};

/** The month's homes by price band, over the homes in the median price (built, unchanged since the sale). */
export function priceBands(rows: Sale[]): Bands {
  const prices = rows.filter((r) => r.propertyUse !== "vacant" && !rollChanged(r)).map((r) => r.salePrice);
  const counts = PRICE_BANDS.map((b) => prices.filter((p) => p >= b.from && (b.to === null || p < b.to)).length);
  const sh = shares(counts);
  return { sample: prices.length, bands: PRICE_BANDS.map((b, i) => ({ ...b, label: BAND_LABEL[b.key], count: counts[i]!, share: sh[i]! })) };
}

/** All three markets together: the month's sales, against the typical month of the combined totals and the same month a year before. */
export function combinedFor(sales: Sale[], month: string, markets: Pick<IssueMarket, "market" | "name" | "stats" | "lastYear">[]): Combined {
  const count = markets.reduce((a, m) => a + m.stats.count, 0);
  const prior = monthsEnding(addMonths(month, -1), 12);
  const covered = new Set(sales.filter(counted).map((s) => s.saleDate.slice(0, 7)));
  const reached = prior.filter((m) => covered.has(m));
  const totals = monthlySeries(sales, reached);
  const typical = medianOf(reached.map((_, i) => MARKET_ORDER.reduce((a, k) => a + totals[k][i]!.count, 0)));
  const ly = markets.every((m) => m.lastYear) ? markets.reduce((a, m) => a + m.lastYear!.count, 0) : null;
  const sh = shares(markets.map((m) => m.stats.count));
  return {
    count,
    typical,
    diff: typical === null ? null : count - typical,
    pct: pctChange(count, typical),
    lastYear: ly === null ? null : { month: addMonths(month, -12), count: ly, pct: pctChange(count, ly) },
    parts: markets.map((m, i) => ({ market: m.market, name: m.name, count: m.stats.count, share: sh[i]! })),
  };
}

/** A tick step of 1, 2, 2.5 or 5 times a power of ten giving about `target` intervals. */
export function niceStep(span: number, target = 4): number {
  if (span <= 0) return 1;
  const raw = span / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * pow;
}

/**
 * The y-axis for a chart. Counts start at zero. Prices per square foot start
 * at the nice step at or below the lowest value, so the month-to-month change
 * is readable, and the chart labels where the axis starts.
 */
export function yAxis(values: number[], zeroBased: boolean): { yMin: number; yMax: number; ticks: number[] } {
  if (!values.length) return { yMin: 0, yMax: 1, ticks: [0, 1] };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  let step = zeroBased ? niceStep(hi, 5) : niceStep(Math.max(hi - lo, hi * 0.1), 4);
  let yMin = zeroBased ? 0 : Math.floor(lo / step) * step;
  // Leave a step of room under the lowest value when the axis doesn't start at zero.
  if (!zeroBased && yMin === lo) yMin -= step;
  if (!zeroBased) yMin = Math.max(0, yMin);
  let yMax = Math.ceil(hi / step) * step;
  if (yMax === yMin) yMax = yMin + step;
  // Keep the tick count readable: double the step past six intervals.
  while ((yMax - yMin) / step > 6) {
    step *= 2;
    yMin = zeroBased ? 0 : Math.floor(yMin / step) * step;
    yMax = Math.ceil(hi / step) * step;
  }
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + step / 1000; t += step) ticks.push(Math.round(t * 100) / 100);
  return { yMin, yMax, ticks };
}

function chart(id: ChartModel["id"], months: string[], series: ChartSeries[]): ChartModel {
  const from = monthLabel(months[0]!);
  const to = monthLabel(months[months.length - 1]!);
  const values = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const axis = yAxis(values, id === "sales");
  const min = usd(axis.yMin);
  return {
    id,
    title: id === "sales" ? W.salesChartTitle : W.ppsfChartTitle,
    note: id === "sales" ? fill(W.salesChartNote, { from, to }) : fill(W.ppsfChartNote, { from, to, min }),
    axisLabel: id === "sales" ? W.salesAxis : W.ppsfAxis,
    unit: id === "sales" ? "count" : "usd",
    months,
    monthLabels: months.map((m, i) => shortMonth(m, i === 0)),
    series,
    ...axis,
    zeroBased: axis.yMin === 0,
    baselineLabel: axis.yMin === 0 ? null : fill(W.axisStart, { min }),
  };
}

/** The guides published in the issue month, newest first. Market reports are left out: the issue is the report. */
export function guidesForMonth(posts: IssueInput["posts"], issue: string): IssueGuide[] {
  return posts
    .filter((p) => p.publishedAt.slice(0, 7) === issue && !p.categories.includes("Market report"))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
    .map(({ slug, title, excerpt, publishedAt }) => ({ slug, title, excerpt, publishedAt }));
}

/** Every string the page shows, for the Fair Housing check. */
export function issueText(m: Omit<IssueModel, "fairHousing">): string[] {
  return [
    m.title,
    m.eyebrow,
    m.note,
    m.intro,
    m.description,
    m.source,
    m.methods,
    ...m.markets.flatMap((x) => [x.name, ...x.streets.map((s) => s.label)]),
    ...[m.charts.sales, m.charts.ppsf].flatMap((c) => [c.title, c.note, c.axisLabel, c.baselineLabel ?? "", ...c.monthLabels]),
    ...m.guides.flatMap((g) => [g.title, g.excerpt]),
    m.framing,
    m.headline,
    m.dek,
    m.coverLine,
    m.combinedLine,
    m.cover.alt,
    ...m.markets.flatMap((x) => [...x.story.paragraphs, ...x.mix.map((p) => p.label), ...x.bands.bands.map((b) => b.label)]),
    ...narrativeParagraphs(m.narrative),
    ...(m.narrative ? [...m.narrative.buying, ...m.narrative.selling].map((mv) => mv.link?.label ?? "") : []),
    ...m.notes.flatMap((n) => n.paragraphs ?? []),
    ...Object.values(W),
  ].filter(Boolean);
}

/** Words read at 200 a minute, plus a minute for every three figures on the page (the two charts and three per market), rounded up. */
export function readingMinutes(paragraphs: string[]): number {
  const words = paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
  const figures = 2 + 3 * MARKET_ORDER.length;
  return Math.max(1, Math.ceil(words / 200 + figures / 3));
}

/** "home sales across the three markets in July, 7% more than a typical month". */
export function combinedLine(c: Combined, dataMonth: string): string {
  const month = monthLabel(dataMonth).split(" ")[0]!;
  if (c.pct === null) return fill(W.combinedNoTypical, { month });
  const r = Math.round(Math.abs(c.pct));
  if (r === 0) return fill(W.combinedSame, { month });
  return fill(c.pct > 0 ? W.combinedMore : W.combinedFewer, { month, pct: String(r) });
}

export function buildIssueModel(input: IssueInput): IssueModel {
  const { entry, sales, manifest } = input;
  const { dataMonth, latestComplete } = dataMonthFor(entry, sales);
  const issueLabel = monthLabel(entry.issue);
  const dataLabel = monthLabel(dataMonth);
  const months = monthsEnding(dataMonth, CHART_MONTHS);
  const series = monthlySeries(sales, months);
  const base = baselines(sales, dataMonth);
  const stats = tideStats(sales, dataMonth);

  const lastYear = lastYearFor(sales, dataMonth, manifest);
  const narrative = narrativeOf(entry);
  const markets: IssueMarket[] = stats.map((s) => {
    const rows = marketRows(sales, dataMonth, s.market);
    const written = narrative?.markets[s.market] ?? [];
    return {
      market: s.market,
      name: s.name,
      href: HUB[s.market],
      stats: s,
      baseline: base[s.market],
      streets: topStreets(rows, STREETS_PER_MARKET),
      series: series[s.market],
      lastYear: lastYear[s.market],
      mix: homeMix(rows),
      bands: priceBands(rows),
      story: written.length ? { paragraphs: written, written: true } : { paragraphs: [marketParagraph(s, dataMonth)], written: false },
    };
  });
  const combined = combinedFor(sales, dataMonth, markets);

  const asOfDay = manifest.generatedAt && !Number.isNaN(Date.parse(manifest.generatedAt)) ? easternDay(new Date(manifest.generatedAt)) : null;
  const asOf = asOfDay ? dateLong(asOfDay) : null;
  const minutes = readingMinutes([
    ...narrativeParagraphs(narrative),
    ...(narrative?.opening.length ? [] : [W.note, W.intro]),
    ...markets.flatMap((m) => (m.story.written ? [] : m.story.paragraphs)),
  ]);
  const headline = narrative?.headline ?? fill(W.headlineFallback, { data: dataLabel });
  const dek = narrative?.dek ?? W.dekFallback;

  const model: Omit<IssueModel, "fairHousing"> = {
    issue: entry.issue,
    issueLabel,
    dataMonth,
    dataLabel,
    latestComplete,
    pinned: Boolean(entry.data),
    title: fill(W.title, { issue: issueLabel }),
    eyebrow: W.eyebrow,
    note: fill(dataMonth === latestComplete ? W.note : W.noteLatest, { data: dataLabel }),
    intro: W.intro,
    description: fill(W.description, { issue: issueLabel, data: dataLabel }),
    markets,
    combined,
    cover: tideCover(entry.issue),
    minutes,
    headline,
    dek,
    coverLine: fill(W.coverLine, { data: dataLabel, minutes: String(minutes) }),
    combinedLine: combinedLine(combined, dataMonth),
    charts: {
      sales: chart(
        "sales",
        months,
        markets.map((m) => ({ market: m.market, name: m.name, values: m.series.map((p) => p.count) })),
      ),
      ppsf: chart(
        "ppsf",
        months,
        markets.map((m) => ({ market: m.market, name: m.name, values: m.series.map((p) => p.medianPpsf) })),
      ),
    },
    guides: guidesForMonth(input.posts, entry.issue),
    narrative,
    commentary: narrative ? narrativeParagraphs(narrative) : null,
    framing: fill(W.framing, { data: dataLabel }),
    notes: noteSlots(entry.commentary, input.showSamples ? "draft" : "public"),
    asOf,
    source: fill(W.source, { asOf: asOf ?? "the last refresh" }),
    methods: TIDE_COPY.methods,
  };
  const flags = issueText(model).map(checkFairHousing).flatMap((r) => (r.passed ? [] : r.flags));
  return { ...model, fairHousing: flags.length ? { passed: false, flags } : { passed: true } };
}

/** The archive card: computed from the model, so the card and the page agree. */
export function issueCard(m: Pick<IssueModel, "issue" | "issueLabel" | "dataLabel"> & Partial<Pick<IssueModel, "cover" | "headline" | "dek">>) {
  return {
    href: `/tide/${m.issue}`,
    eyebrow: W.cardEyebrow,
    title: fill(W.title, { issue: m.issueLabel }),
    issueLabel: m.issueLabel,
    excerpt: m.dek ?? fill(W.cardExcerpt, { data: m.dataLabel }),
    data: fill(W.cardData, { data: m.dataLabel }),
    cover: m.cover,
    headline: m.headline,
  };
}

export { MARKET_NAMES };
