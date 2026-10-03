import { fill } from "../issues/copy";
import { monthLabel } from "../issues/render";
import { TIDE_FACTS_COPY as F } from "./copy";
import { CHART_MONTHS, STREETS_PER_MARKET, num, usd, type IssueMarket } from "./issue";
import { NARRATIVE_FIELDS, type TideIssueEntry } from "./issues";

/**
 * The words around Tide's figures: the hand-written narrative, the two signed
 * notes, and the checks that keep the prose tied to the data.
 *
 * Prose can't be computed from numbers without sounding templated, so each
 * month's story is written by hand in lib/tide/issues.ts. What this module
 * does instead:
 * - `issueFigures` lists every number the page computes, plus the plain
 *   differences a writer reaches for (87 more sales, 13% fewer, up 6%);
 * - `checkNarrative` finds every number written in the narrative and fails
 *   the ones the page doesn't compute, within rounding, so the prose can't
 *   drift from the data;
 * - `writingFacts` turns the month's figures into the short list the email
 *   draft carries before a narrative is written, to write it from;
 *
 * The narrative itself and the signed notes are read in lib/tide/notes.ts.
 *
 * Pure: the issue's markets and the entry come in.
 */

// ---------------------------------------------------------------------------
// The figures, and the numbers written in prose

export type FigureKind = "count" | "usd" | "pct" | "other";
export type Figure = { value: number; kind: FigureKind; label: string };

const pctChange = (now: number | null, then: number | null) => (now === null || then === null || then === 0 ? null : (100 * (now - then)) / then);

/** Every number the page computes for the markets, and the differences a writer would quote. */
export function issueFigures(m: { issue: string; dataMonth: string; markets: IssueMarket[] }): Figure[] {
  const out: Figure[] = [];
  const add = (value: number | null | undefined, kind: FigureKind, label: string) => {
    if (value === null || value === undefined || Number.isNaN(value)) return;
    out.push({ value: Math.abs(value), kind, label });
  };
  for (const x of m.markets) {
    const s = x.stats;
    const b = x.baseline;
    const prev = x.series.length >= 2 ? x.series[x.series.length - 2]! : null;
    add(s.count, "count", `${x.name} sales`);
    add(b.count, "count", `${x.name} typical sales`);
    add(b.count === null ? null : s.count - b.count, "count", `${x.name} sales against typical`);
    add(pctChange(s.count, b.count), "pct", `${x.name} sales against typical, %`);
    add(s.priceSample, "count", `${x.name} homes in the median price`);
    add(s.ppsfSample, "count", `${x.name} homes in the $/sq ft median`);
    add(s.newBuild, "count", `${x.name} new builds or lots`);
    add(s.newBuildPct, "pct", `${x.name} new-build share`);
    add(b.newBuildPct, "pct", `${x.name} typical new-build share`);
    add(s.medianPrice, "usd", `${x.name} median price`);
    add(b.medianPrice, "usd", `${x.name} typical median price`);
    add(s.medianPrice === null || b.medianPrice === null ? null : s.medianPrice - b.medianPrice, "usd", `${x.name} median price against typical`);
    add(pctChange(s.medianPrice, b.medianPrice), "pct", `${x.name} median price against typical, %`);
    add(s.medianPpsf, "usd", `${x.name} median $/sq ft`);
    add(b.medianPpsf, "usd", `${x.name} typical $/sq ft`);
    add(s.medianPpsf === null || b.medianPpsf === null ? null : s.medianPpsf - b.medianPpsf, "usd", `${x.name} $/sq ft against typical`);
    add(pctChange(s.medianPpsf, b.medianPpsf), "pct", `${x.name} $/sq ft against typical, %`);
    if (prev) {
      add(s.count - prev.count, "count", `${x.name} sales against the month before`);
      add(pctChange(s.count, prev.count), "pct", `${x.name} sales against the month before, %`);
      add(pctChange(s.medianPrice, prev.medianPrice), "pct", `${x.name} median price against the month before, %`);
      add(s.medianPrice === null || prev.medianPrice === null ? null : s.medianPrice - prev.medianPrice, "usd", `${x.name} median price against the month before`);
      add(pctChange(s.medianPpsf, prev.medianPpsf), "pct", `${x.name} $/sq ft against the month before, %`);
    }
    for (const p of x.series) {
      const when = monthLabel(p.month);
      add(p.count, "count", `${x.name} sales, ${when}`);
      add(p.medianPrice, "usd", `${x.name} median price, ${when}`);
      add(p.medianPpsf, "usd", `${x.name} $/sq ft, ${when}`);
      add(p.newBuildPct, "pct", `${x.name} new-build share, ${when}`);
    }
    for (const st of x.streets) add(st.count, "count", `${st.label} sales`);
  }
  for (const [v, label] of [
    [Number(m.issue.slice(0, 4)), "issue year"],
    [Number(m.dataMonth.slice(0, 4)), "data year"],
    [CHART_MONTHS, "months on the charts"],
    [STREETS_PER_MARKET, "streets listed per market"],
  ] as const) add(v, "other", label);
  for (const x of m.markets) add(x.baseline.months, "other", `${x.name} months in the typical month`);
  return out;
}

export type Written = { raw: string; value: number; kind: "usd" | "pct" | "plain" };

/** Every number written in digits: "$399,450", "13%", "1,080", "$625K". */
export function writtenNumbers(text: string): Written[] {
  const out: Written[] = [];
  const re = /(\$)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\s?%|\s?percent\b|[kK]\b)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let value = Number(`${m[2]!.replace(/,/g, "")}${m[3] ?? ""}`);
    const suffix = (m[4] ?? "").trim().toLowerCase();
    if (suffix === "k") value *= 1000;
    const kind = suffix === "%" || suffix === "percent" ? "pct" : m[1] ? "usd" : "plain";
    out.push({ raw: m[0].trim(), value, kind });
  }
  return out;
}

/** Within rounding: half a unit, or 1% of a dollar figure or count. A percent is held to half a point. */
export function closeEnough(written: number, figure: number, kind: FigureKind): boolean {
  const tol = kind === "pct" ? 0.5 : Math.max(0.5, 0.01 * Math.abs(figure));
  return Math.abs(written - figure) <= tol + 1e-9;
}

/** The figure a written number matches, if any: a percent matches percents, a dollar amount dollars, a bare number counts and the rest. */
export function matchFigure(w: Written, figures: Figure[]): Figure | null {
  const kinds: FigureKind[] = w.kind === "pct" ? ["pct"] : w.kind === "usd" ? ["usd"] : ["count", "other"];
  return figures.find((f) => kinds.includes(f.kind) && closeEnough(w.value, f.value, f.kind)) ?? null;
}

/** Figures spelled out as words, which the number check can't see: write them in digits. "one" to "ten" are fine. */
const SPELLED = /\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|percent)\b/i;

export type NarrativeProblem = { field: string; text: string; problem: string };

/** Every number in the narrative that the page doesn't compute, and every figure spelled out in words. */
export function checkNarrative(entry: TideIssueEntry, m: { issue: string; dataMonth: string; markets: IssueMarket[] }): NarrativeProblem[] {
  const figures = issueFigures(m);
  const problems: NarrativeProblem[] = [];
  for (const field of NARRATIVE_FIELDS) {
    for (const text of entry[field] ?? []) {
      for (const w of writtenNumbers(text)) {
        if (!matchFigure(w, figures)) problems.push({ field, text, problem: `“${w.raw}” isn’t a figure this issue computes` });
      }
      const spelled = SPELLED.exec(text);
      if (spelled) problems.push({ field, text, problem: `“${spelled[0]}”: write figures in digits so the check can see them` });
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// The facts to write from

const moveWord = (p: number | null) => {
  if (p === null) return null;
  const r = Math.round(Math.abs(p));
  return r === 0 ? F.same : fill(p > 0 ? F.up : F.down, { pct: r });
};

type Move = { market: string; what: string; value: string; typical: string; pct: number };

/**
 * The month's notable facts, in plain lines: the largest change against a
 * typical month, the median price against the price per square foot, the
 * new-build share, a typical home's price, the busiest street, and the busiest
 * and quietest months on the chart. Every number is from the model.
 */
export function writingFacts(m: { dataMonth: string; markets: IssueMarket[] }): string[] {
  const lines: string[] = [];
  const data = monthLabel(m.dataMonth);
  const moves: Move[] = m.markets.flatMap((x) => {
    const s = x.stats;
    const b = x.baseline;
    const c: (Move | null)[] = [
      b.count !== null ? { market: x.name, what: F.whatSales, value: num(s.count), typical: num(b.count), pct: pctChange(s.count, b.count)! } : null,
      s.medianPrice !== null && b.medianPrice !== null ? { market: x.name, what: F.whatPrice, value: usd(s.medianPrice), typical: usd(b.medianPrice), pct: pctChange(s.medianPrice, b.medianPrice)! } : null,
      s.medianPpsf !== null && b.medianPpsf !== null ? { market: x.name, what: F.whatPpsf, value: usd(s.medianPpsf), typical: usd(b.medianPpsf), pct: pctChange(s.medianPpsf, b.medianPpsf)! } : null,
    ];
    return c.filter((v): v is Move => v !== null);
  });
  const largest = [...moves].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))[0];
  if (largest) lines.push(fill(F.largest, { market: largest.market, what: largest.what, value: largest.value, move: moveWord(largest.pct)!, typical: largest.typical }));

  for (const x of m.markets) {
    const s = x.stats;
    const b = x.baseline;
    const prev = x.series.length >= 2 ? x.series[x.series.length - 2]! : null;
    lines.push(
      fill(F.market, {
        market: x.name,
        count: num(s.count),
        countMove: moveWord(pctChange(s.count, b.count)) ?? F.noTypical,
        price: s.medianPrice !== null ? usd(s.medianPrice) : "–",
        priceMove: moveWord(pctChange(s.medianPrice, b.medianPrice)) ?? F.noTypical,
        ppsf: s.medianPpsf !== null ? usd(s.medianPpsf) : "–",
        ppsfMove: moveWord(pctChange(s.medianPpsf, b.medianPpsf)) ?? F.noTypical,
        share: s.newBuildPct !== null ? `${s.newBuildPct}%` : "–",
        typicalShare: b.newBuildPct !== null ? `${b.newBuildPct}%` : "–",
      }),
    );
    if (prev) lines.push(fill(F.before, { market: x.name, month: monthLabel(prev.month), count: num(prev.count), price: prev.medianPrice !== null ? usd(prev.medianPrice) : "–" }));
    const priceMove = pctChange(s.medianPrice, b.medianPrice);
    const ppsfMove = pctChange(s.medianPpsf, b.medianPpsf);
    if (priceMove !== null && ppsfMove !== null && Math.abs(Math.round(priceMove) - Math.round(ppsfMove)) >= 3) {
      lines.push(fill(F.mix, { market: x.name, price: moveWord(priceMove)!, ppsf: moveWord(ppsfMove)! }));
    }
    const counts = x.series.map((p) => p.count);
    if (counts.length >= 3) {
      const hi = x.series.reduce((a, p) => (p.count > a.count ? p : a));
      const lo = x.series.reduce((a, p) => (p.count < a.count ? p : a));
      lines.push(fill(F.range, { market: x.name, high: monthLabel(hi.month), highCount: num(hi.count), low: monthLabel(lo.month), lowCount: num(lo.count) }));
    }
  }
  const streets = m.markets.flatMap((x) => x.streets.map((s) => ({ ...s, market: x.name }))).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  if (streets[0]) lines.push(fill(F.street, { street: streets[0].label, market: streets[0].market, count: num(streets[0].count), month: data }));
  return lines;
}
