import type { EventCategory } from "../content/types";
import { CATEGORY } from "../encore/categories";
import { mark, n } from "./svg";

/**
 * Encore's portrait: a season clock. A ring of the next 365 days, today at
 * the top and the year running clockwise. Every performance is a short
 * radial stroke at its day, in its category's light; when a day has many,
 * the strokes stack outward, so busy weekends bloom. Exhibitions and other
 * runs with no times draw as faint arcs inside the ring, from opening to
 * closing day.
 *
 * Pure: the performances' days and categories come in, the paths go out.
 * components/art/encore-art.tsx draws it.
 */

export type Perf = { day: string; category: EventCategory };
export type Run = { from: string; to: string; category: EventCategory };

/**
 * Inner to outer on a busy day: the categories with the most performances
 * first, so the bands read the same on every spoke of the ring.
 */
export const SPOKE_ORDER: EventCategory[] = ["theater", "music", "talks", "festival", "market", "film", "family", "gallery"];

export type SeasonClockOptions = {
  width: number;
  height: number;
  /** Today, YYYY-MM-DD: the top of the ring. */
  today: string;
  /** Days around the ring. */
  days?: number;
  /** The ring's radius as a fraction of half the height. */
  inner?: number;
  /** One stroke's length and the gap before the next, in px. */
  length?: number;
  gap?: number;
  /** How many lanes of run arcs fit inside the ring. */
  lanes?: number;
  /** Nudges the centre sideways, as a fraction of the width (negative is left), so the busy half of the year has room. */
  shift?: number;
};

export type Spoke = { category: EventCategory; color: string; count: number; d: string };
export type Arc = { category: EventCategory; color: string; count: number; d: string };

export type SeasonClock = {
  width: number;
  height: number;
  cx: number;
  cy: number;
  /** The ring's radius, where the strokes start. */
  r0: number;
  /** The outermost stroke's reach. */
  rMax: number;
  days: number;
  /** Performances on the ring. */
  total: number;
  busiest: { day: string; count: number } | null;
  /** One path per category, in SPOKE_ORDER. */
  spokes: Spoke[];
  /** One path per category of run arcs inside the ring. */
  arcs: Arc[];
  /** The ring of day ticks: a dashed circle, one dash per day. */
  ring: { r: number; dash: [number, number] };
  /** Hairline ticks inside the ring at the first of each month. */
  months: string;
  /** The mark at the top: today. */
  today: string;
};

const DAY_MS = 86_400_000;

function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `today` to `day`: 0 is today, negative is past. */
export function dayIndex(today: string, day: string): number {
  return Math.round((utc(day) - utc(today)) / DAY_MS);
}

function dayOfMonth(today: string, i: number): number {
  return new Date(utc(today) + i * DAY_MS).getUTCDate();
}

/** Lanes for the runs: each run takes the innermost lane free from its opening day. */
export function packLanes(runs: readonly { from: number; to: number }[], max: number): number[] {
  const order = runs.map((r, i) => i).sort((a, b) => runs[a]!.from - runs[b]!.from || runs[a]!.to - runs[b]!.to);
  const laneEnd: number[] = [];
  const lane = new Array<number>(runs.length).fill(-1);
  for (const i of order) {
    const r = runs[i]!;
    let l = laneEnd.findIndex((end) => end < r.from - 1);
    if (l === -1) {
      if (laneEnd.length >= max) continue;
      l = laneEnd.length;
      laneEnd.push(r.to);
    } else {
      laneEnd[l] = r.to;
    }
    lane[i] = l;
  }
  return lane;
}

export function seasonClock(perfs: readonly Perf[], runs: readonly Run[], o: SeasonClockOptions): SeasonClock {
  const W = o.width;
  const H = o.height;
  const cx = W / 2 + (o.shift ?? 0) * W;
  const cy = H / 2;
  const days = Math.max(1, o.days ?? 365);
  const half = Math.min(W, H) / 2;
  const r0 = half * (o.inner ?? 0.44);
  const len = o.length ?? 3.4;
  const gap = o.gap ?? 1.1;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / days;
  const at = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

  const perDay = new Map<number, Perf[]>();
  for (const p of perfs) {
    const i = dayIndex(o.today, p.day);
    if (i < 0 || i >= days) continue;
    const list = perDay.get(i);
    if (list) list.push(p);
    else perDay.set(i, [p]);
  }
  const rank = new Map(SPOKE_ORDER.map((c, i) => [c, i]));
  const byCat = new Map<EventCategory, { d: string; count: number }>(SPOKE_ORDER.map((c) => [c, { d: "", count: 0 }]));
  let rMax = r0;
  let total = 0;
  let busiest: SeasonClock["busiest"] = null;
  for (const [i, list] of [...perDay.entries()].sort((a, b) => a[0] - b[0])) {
    list.sort((a, b) => (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99));
    const a = angle(i);
    list.forEach((p, k) => {
      const ra = r0 + k * (len + gap);
      const rb = ra + len;
      const [x1, y1] = at(ra, a);
      const [x2, y2] = at(rb, a);
      const g = byCat.get(p.category) ?? { d: "", count: 0 };
      g.d += mark(x1, y1, x2, y2);
      g.count += 1;
      byCat.set(p.category, g);
      if (rb > rMax) rMax = rb;
    });
    total += list.length;
    if (!busiest || list.length > busiest.count) busiest = { day: new Date(utc(o.today) + i * DAY_MS).toISOString().slice(0, 10), count: list.length };
  }
  const spokes: Spoke[] = SPOKE_ORDER.flatMap((category) => {
    const g = byCat.get(category);
    return g && g.count ? [{ category, color: CATEGORY[category].art, count: g.count, d: g.d }] : [];
  });

  // Runs: clamp to the ring, pack into lanes just inside it, draw clockwise from opening to closing.
  const clamped = runs
    .map((r) => ({ from: Math.max(0, dayIndex(o.today, r.from)), to: Math.min(days - 1, dayIndex(o.today, r.to)), category: r.category }))
    .filter((r) => r.to >= 0 && r.from <= days - 1 && r.to >= r.from);
  const lanes = packLanes(clamped, o.lanes ?? 9);
  const laneGap = 3;
  const arcByCat = new Map<EventCategory, { d: string; count: number }>();
  clamped.forEach((r, i) => {
    const l = lanes[i]!;
    if (l < 0) return;
    const rr = r0 - 10 - l * laneGap;
    if (rr <= 4) return;
    const a1 = angle(r.from);
    const a2 = angle(Math.min(days, r.to + 1));
    const sweep = a2 - a1;
    const [x1, y1] = at(rr, a1);
    const [x2, y2] = at(rr, a2 - (sweep >= 2 * Math.PI ? 0.001 : 0));
    const d = sweep < 0.002 ? mark(x1, y1, x2, y2) : `M${n(x1)} ${n(y1)}A${n(rr)} ${n(rr)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${n(x2)} ${n(y2)}`;
    const g = arcByCat.get(r.category) ?? { d: "", count: 0 };
    g.d += d;
    g.count += 1;
    arcByCat.set(r.category, g);
  });
  const arcs: Arc[] = SPOKE_ORDER.flatMap((category) => {
    const g = arcByCat.get(category);
    return g && g.count ? [{ category, color: CATEGORY[category].art, count: g.count, d: g.d }] : [];
  });

  let months = "";
  for (let i = 0; i < days; i += 1) {
    if (dayOfMonth(o.today, i) !== 1) continue;
    const a = angle(i);
    const [x1, y1] = at(r0 - 3, a);
    const [x2, y2] = at(r0 - 8, a);
    months += mark(x1, y1, x2, y2);
  }
  const ringR = r0 - 1.5;
  const perDayArc = (2 * Math.PI * ringR) / days;
  const [tx1, ty1] = at(r0 - 16, angle(0));
  const [tx2, ty2] = at(r0 - 9, angle(0));

  return {
    width: W,
    height: H,
    cx,
    cy,
    r0,
    rMax,
    days,
    total,
    busiest,
    spokes,
    arcs,
    ring: { r: ringR, dash: [Math.round(perDayArc * 0.45 * 100) / 100, Math.round(perDayArc * 0.55 * 100) / 100] },
    months,
    today: mark(tx1, ty1, tx2, ty2),
  };
}
