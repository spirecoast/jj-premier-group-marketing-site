import { checkFairHousing, type FairHousingResult } from "../fair-housing";
import { TIDE_COPY, fill } from "../issues/copy";
import { MARKET_NAMES, MARKET_ORDER, dateLong, easternDay, monthLabel, type MarketSlug } from "../issues/render";
import {
  addMonths,
  counted,
  latestCompleteMonth,
  marketOf,
  monthBounds,
  previousMonth,
  tideStats,
  topStreets,
  type TideManifest,
  type TideMarket,
  type TideStreet,
} from "../issues/tide-monthly";
import { median } from "../sales/stats";
import type { Sale } from "../sales/types";
import { TIDE_WEB_COPY as W } from "./copy";
import type { TideIssueEntry } from "./issues";
import { narrativeOf, noteSlots, type Narrative, type NoteSlot } from "./notes";

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
  charts: { sales: ChartModel; ppsf: ChartModel };
  guides: IssueGuide[];
  /** The month's story in the site's voice, hand-written in lib/tide/issues.ts; null until its opening is written. */
  narrative: Narrative | null;
  /** The plain line the page opens with while there's no narrative. */
  framing: string;
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
    ...(m.narrative ? [...m.narrative.opening, ...m.narrative.buyers, ...m.narrative.sellers, ...m.narrative.watch] : []),
    ...m.notes.flatMap((n) => n.paragraphs ?? []),
    ...Object.values(W),
  ].filter(Boolean);
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

  const markets: IssueMarket[] = stats.map((s) => ({
    market: s.market,
    name: s.name,
    href: HUB[s.market],
    stats: s,
    baseline: base[s.market],
    streets: topStreets(marketRows(sales, dataMonth, s.market), STREETS_PER_MARKET),
    series: series[s.market],
  }));

  const asOfDay = manifest.generatedAt && !Number.isNaN(Date.parse(manifest.generatedAt)) ? easternDay(new Date(manifest.generatedAt)) : null;
  const asOf = asOfDay ? dateLong(asOfDay) : null;
  const narrative = narrativeOf(entry);

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
    commentary: narrative ? [...narrative.opening, ...narrative.buyers, ...narrative.sellers, ...narrative.watch] : null,
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
export function issueCard(m: Pick<IssueModel, "issue" | "issueLabel" | "dataLabel">) {
  return {
    href: `/tide/${m.issue}`,
    eyebrow: W.cardEyebrow,
    title: fill(W.title, { issue: m.issueLabel }),
    excerpt: fill(W.cardExcerpt, { data: m.dataLabel }),
    data: fill(W.cardData, { data: m.dataLabel }),
  };
}

export { MARKET_NAMES };
