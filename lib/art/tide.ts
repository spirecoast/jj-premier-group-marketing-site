import { addMonths, counted, marketOf } from "../issues/tide-monthly";
import type { Sale } from "../sales/types";
import { TIDE_RAMP, ramp } from "./palette";
import { polyline } from "./svg";

/**
 * Tide's portrait: a ridgeline of the market's sale prices. One ridge per
 * month, the oldest at the back and the newest at the front, each the
 * smoothed distribution of that month's qualified home sale prices in the
 * three markets (a Gaussian kernel density over log price, so the shape
 * reads whether a month sold cottages or waterfront). Every figure here is
 * computed from the county rows passed in; nothing is typed.
 *
 * Pure: the sales come in, the geometry goes out. components/art/tide-art.tsx
 * draws it; lib/art/load.ts chooses the months the way the Tide issue does.
 */

export type RidgeMonth = {
  /** YYYY-MM. */
  month: string;
  /** Sale prices, in dollars. */
  prices: number[];
};

/** A month with fewer qualified sales than this draws no ridge: its shape would be noise. */
export const MIN_RIDGE_SALES = 40;

/** The `n` months ending with `last`, oldest first. */
export function monthsEnding(last: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(last, i - (n - 1)));
}

/**
 * The months the ridgeline draws: the `n` ending with `last`, oldest first,
 * each with the prices of its qualified home sales in the three markets
 * (the rows the Tide issue counts, lib/issues/tide-monthly.ts). Months with
 * fewer than MIN_RIDGE_SALES are left out.
 */
export function ridgeMonths(sales: Sale[], last: string, n = 24): RidgeMonth[] {
  const byMonth = new Map<string, number[]>();
  for (const s of sales) {
    if (!counted(s) || marketOf(s) === null) continue;
    const m = s.saleDate.slice(0, 7);
    const list = byMonth.get(m);
    if (list) list.push(s.salePrice);
    else byMonth.set(m, [s.salePrice]);
  }
  return monthsEnding(last, n)
    .map((month) => ({ month, prices: byMonth.get(month) ?? [] }))
    .filter((m) => m.prices.length >= MIN_RIDGE_SALES);
}

/**
 * A Gaussian kernel density estimate of `values` at each of `xs`, with
 * bandwidth `h`. Normalised so the curve integrates to one over all of the
 * values (a tighter month peaks higher, a spread-out one sits lower), which
 * is what makes the ridges comparable. Values are binned at an eighth of the
 * bandwidth first, so a month of two thousand sales costs the same as one of
 * two hundred.
 */
export function density(values: readonly number[], xs: readonly number[], h: number): number[] {
  const out = new Array<number>(xs.length).fill(0);
  if (!values.length || !xs.length || !(h > 0)) return out;
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const x of xs) {
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  lo -= 4 * h;
  hi += 4 * h;
  const bw = h / 8;
  const bins = new Float64Array(Math.ceil((hi - lo) / bw) + 2);
  let kept = 0;
  for (const v of values) {
    if (!(v >= lo && v <= hi)) continue;
    // Linear binning: the value's weight is split between the two nearest bin centres, so nothing shifts by half a bin.
    const pos = (v - lo) / bw - 0.5;
    const b = Math.floor(pos);
    const f = pos - b;
    if (b >= 0) bins[b] += 1 - f;
    bins[b + 1] += f;
    kept += 1;
  }
  if (!kept) return out;
  const norm = 1 / (values.length * h * Math.sqrt(2 * Math.PI));
  const inv = 1 / (2 * h * h);
  for (let i = 0; i < xs.length; i += 1) {
    const x = xs[i]!;
    const b0 = Math.max(0, Math.floor((x - 4 * h - lo) / bw));
    const b1 = Math.min(bins.length - 1, Math.ceil((x + 4 * h - lo) / bw));
    let s = 0;
    for (let b = b0; b <= b1; b += 1) {
      const c = bins[b]!;
      if (!c) continue;
      const d = lo + (b + 0.5) * bw - x;
      s += c * Math.exp(-d * d * inv);
    }
    out[i] = s * norm;
  }
  return out;
}

export type RidgelineOptions = {
  width: number;
  height: number;
  /** Points along each ridge. */
  samples?: number;
  /** The price axis, as log10 dollars, left to right. */
  domain?: [number, number];
  /** The kernel bandwidth, in log10 dollars. */
  bandwidth?: number;
  /** Where the back and front baselines sit, as fractions of the height. */
  back?: number;
  front?: number;
  /** The tallest crest in the drawing, as a fraction of the height. */
  peak?: number;
  /** The ridges' horizontal reach, as fractions of the width (a little past the edges hides the ends). */
  left?: number;
  right?: number;
};

export type Ridge = {
  month: string;
  count: number;
  /** An open polyline whose ends sit on the baseline, so a fill closes along it and a stroke leaves it bare. */
  d: string;
  color: string;
  baseline: number;
  /** The crest's height above the baseline, in px. */
  crest: number;
  /** The stroke, fainter and thinner at the back than the front. */
  opacity: number;
  stroke: number;
};

export type Ridgeline = {
  width: number;
  height: number;
  /** Oldest first: the draw order, back to front. */
  ridges: Ridge[];
  domain: [number, number];
  /** The warm glow behind the back of the range. */
  horizon: { cx: number; cy: number; rx: number; ry: number };
};

/** The ridgeline for a box, from the months' prices. Months in the order given; the last is the front. */
export function ridgeline(months: readonly RidgeMonth[], o: RidgelineOptions): Ridgeline {
  const W = o.width;
  const H = o.height;
  const samples = Math.max(2, o.samples ?? 140);
  const domain = o.domain ?? [4.9, 6.5];
  const h = o.bandwidth ?? 0.07;
  const back = o.back ?? 0.46;
  const front = o.front ?? 0.9;
  const peak = o.peak ?? 0.36;
  const left = (o.left ?? -0.02) * W;
  const right = (o.right ?? 1.02) * W;
  const xs = Array.from({ length: samples }, (_, i) => domain[0] + ((domain[1] - domain[0]) * i) / (samples - 1));
  const px = xs.map((_, i) => left + ((right - left) * i) / (samples - 1));
  const dens = months.map((m) => density(m.prices.map((p) => Math.log10(p)), xs, h));
  let maxD = 0;
  for (const d of dens) for (const v of d) if (v > maxD) maxD = v;
  const scale = maxD > 0 ? (peak * H) / maxD : 0;
  const n = months.length;
  const ridges = months.map((m, i): Ridge => {
    const t = n > 1 ? i / (n - 1) : 1;
    const baseline = H * (back + (front - back) * t);
    const d = dens[i]!;
    const pts = d.map((v, k): [number, number] => [px[k]!, baseline - v * scale]);
    pts[0] = [px[0]!, baseline];
    pts[pts.length - 1] = [px[px.length - 1]!, baseline];
    let crest = 0;
    for (const v of d) if (v * scale > crest) crest = v * scale;
    return {
      month: m.month,
      count: m.prices.length,
      d: polyline(pts),
      color: ramp(TIDE_RAMP, t),
      baseline,
      crest,
      opacity: 0.45 + 0.55 * t,
      stroke: 1.1 * (1 + 0.5 * t),
    };
  });
  return {
    width: W,
    height: H,
    ridges,
    domain,
    horizon: { cx: W * 0.5, cy: H * back, rx: W * 0.6, ry: H * 0.26 },
  };
}
