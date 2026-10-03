import type { MarketSlug } from "../issues/render";
import type { ChartModel } from "./issue";

/**
 * The geometry of a Tide line chart, as numbers: where each point, tick,
 * month label and end label sits in the SVG's coordinate space. Pure, so the
 * unit tests can check the axis honesty (counts from zero, the $/sqft
 * baseline labelled) without a renderer. components/tide/issue-chart.tsx
 * draws it.
 */

/**
 * The three markets' colors, in a fixed order that never changes with the
 * data: Harbor 800, the brand's amber, Sky 600. Each is 3:1 or better on
 * white; the worst pair is 14.9 (CVD) and 15.6 (normal vision) apart in OKLab.
 * The brand palette is muted by design, so each line also carries its own end
 * marker shape and a direct label, and a legend sits above the chart.
 */
export const SERIES_STYLE: Record<MarketSlug, { color: string; shape: "circle" | "square" | "diamond" }> = {
  "lakewood-ranch": { color: "#35566b", shape: "circle" },
  sarasota: { color: "#96702a", shape: "square" },
  bradenton: { color: "#35899c", shape: "diamond" },
};

export type Variant = "wide" | "narrow";

const LAYOUT: Record<Variant, { width: number; height: number; top: number; right: number; bottom: number; left: number; font: number; every: number }> = {
  // Shown at about 1:1 in a half-width column on desktop.
  wide: { width: 600, height: 320, top: 28, right: 64, bottom: 52, left: 52, font: 12, every: 1 },
  // Shown at about 1:1 on a 390px phone: fewer month labels, larger type.
  narrow: { width: 340, height: 280, top: 28, right: 48, bottom: 52, left: 44, font: 12, every: 3 },
};

export type ChartGeometry = {
  width: number;
  height: number;
  font: number;
  plot: { x0: number; x1: number; y0: number; y1: number };
  yTicks: { value: number; y: number; label: string }[];
  /** The month, and under it the year on the first label and on January. */
  xLabels: { index: number; x: number; label: string; year: string | null }[];
  lines: {
    market: MarketSlug;
    name: string;
    color: string;
    shape: "circle" | "square" | "diamond";
    points: { index: number; x: number; y: number; value: number; month: string }[];
    /** The end label: the last value, moved apart from the others when they'd overlap, with the line end it belongs to. */
    end: { x: number; y: number; labelY: number; text: string } | null;
  }[];
  /** Text under the month labels when the axis doesn't start at zero. */
  baselineNote: string | null;
};

export const formatTick = (unit: ChartModel["unit"], v: number) =>
  unit === "usd" ? `$${new Intl.NumberFormat("en-US").format(v)}` : new Intl.NumberFormat("en-US").format(v);

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function chartGeometry(c: ChartModel, variant: Variant): ChartGeometry {
  const L = LAYOUT[variant];
  const plot = { x0: L.left, x1: L.width - L.right, y0: L.top, y1: L.height - L.bottom };
  const n = c.months.length;
  const x = (i: number) => (n <= 1 ? (plot.x0 + plot.x1) / 2 : plot.x0 + ((plot.x1 - plot.x0) * i) / (n - 1));
  const y = (v: number) => plot.y1 - ((v - c.yMin) / (c.yMax - c.yMin || 1)) * (plot.y1 - plot.y0);

  // Month labels: every month on the wide chart; every third, ending on the latest, on the narrow one.
  const shown = c.months.map((_, i) => i).filter((i) => (n - 1 - i) % L.every === 0);
  const xLabels = shown.map((i, k) => {
    const [yy, mm] = c.months[i]!.split("-").map(Number) as [number, number];
    return { index: i, x: x(i), label: SHORT[mm - 1]!, year: k === 0 || mm === 1 ? String(yy) : null };
  });

  const lines = c.series.map((s) => {
    const style = SERIES_STYLE[s.market];
    const points = s.values.flatMap((v, i) => (v === null ? [] : [{ index: i, x: x(i), y: y(v), value: v, month: c.months[i]! }]));
    const last = points[points.length - 1];
    return {
      market: s.market,
      name: s.name,
      ...style,
      points,
      end: last ? { x: last.x, y: last.y, labelY: last.y, text: formatTick(c.unit, last.value) } : null,
    };
  });

  // Keep end labels at least one line apart, inside the plot, in their value order.
  const gap = L.font + 3;
  const ends = lines.map((l) => l.end).filter((e): e is NonNullable<typeof e> => e !== null).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i += 1) if (ends[i]!.labelY - ends[i - 1]!.labelY < gap) ends[i]!.labelY = ends[i - 1]!.labelY + gap;
  const overflow = ends.length ? ends[ends.length - 1]!.labelY - (plot.y1 + 4) : 0;
  if (overflow > 0) {
    ends[ends.length - 1]!.labelY -= overflow;
    for (let i = ends.length - 2; i >= 0; i -= 1) if (ends[i + 1]!.labelY - ends[i]!.labelY < gap) ends[i]!.labelY = ends[i + 1]!.labelY - gap;
  }

  return {
    width: L.width,
    height: L.height,
    font: L.font,
    plot,
    yTicks: c.ticks.map((t) => ({ value: t, y: y(t), label: formatTick(c.unit, t) })),
    xLabels,
    lines,
    baselineNote: c.zeroBased ? null : c.baselineLabel,
  };
}

/**
 * A market's sparkline: its monthly sales as one line in a small box, the
 * axis from zero so the height reads as volume, with the typical month as a
 * dashed reference and the last point marked. Pure numbers for
 * components/tide/sparkline.tsx.
 */
export type SparkGeometry = {
  width: number;
  height: number;
  points: { x: number; y: number; value: number; month: string }[];
  /** The typical month's height, or null when there isn't one. */
  typicalY: number | null;
  max: number;
};

export function sparkGeometry(
  series: { month: string; value: number }[],
  typical: number | null,
  { width = 320, height = 72, pad = 6 }: { width?: number; height?: number; pad?: number } = {},
): SparkGeometry {
  const max = Math.max(1, ...series.map((p) => p.value), typical ?? 0);
  const n = series.length;
  const x = (i: number) => (n <= 1 ? width / 2 : pad + ((width - 2 * pad) * i) / (n - 1));
  const y = (v: number) => height - pad - (v / max) * (height - 2 * pad);
  return {
    width,
    height,
    points: series.map((p, i) => ({ x: x(i), y: y(p.value), value: p.value, month: p.month })),
    typicalY: typical === null ? null : y(typical),
    max,
  };
}

/**
 * A horizontal stacked bar of shares (whole percents adding up to 100): each
 * segment's x and width in a box `width` wide, with a hairline gap between
 * segments that never eats a small one. Null shares draw nothing.
 */
export function stackGeometry(shares: (number | null)[], width = 100, gap = 0.6): { x: number; w: number; share: number }[] {
  const total = shares.reduce<number>((a, s) => a + (s ?? 0), 0);
  if (!total) return [];
  const drawn = shares.filter((s): s is number => (s ?? 0) > 0);
  const room = width - gap * Math.max(0, drawn.length - 1);
  let x = 0;
  const out: { x: number; w: number; share: number }[] = [];
  for (const s of shares) {
    if (!s) continue;
    const w = (room * s) / total;
    out.push({ x, w, share: s });
    x += w + gap;
  }
  return out;
}
