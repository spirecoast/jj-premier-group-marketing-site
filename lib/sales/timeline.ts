/**
 * The geometry of Tide Street's timeline: every sale on the street as a
 * mark, date across and price up, resales filled and new builds and lots
 * hollow, with the chosen group's median as a dashed rule. Pure numbers in
 * the SVG's coordinate space, so the unit tests can check the axes and the
 * marks without a renderer; components/sales/sales-timeline.tsx draws it.
 */

export type TimelinePoint = { saleDate: string; salePrice: number; resale: boolean };

export type TimelineVariant = "wide" | "narrow";

const LAYOUT: Record<TimelineVariant, { width: number; height: number; top: number; right: number; bottom: number; left: number; font: number; everyMonths: number; r: number }> = {
  // Drawn at 3:1 in the content column on desktop; price labels in a 64px gutter, months 28px below.
  wide: { width: 1248, height: 416, top: 20, right: 20, bottom: 36, left: 64, font: 12, everyMonths: 3, r: 4 },
  // 2:1 on a phone: a label every six months, smaller marks.
  narrow: { width: 342, height: 171, top: 14, right: 10, bottom: 30, left: 52, font: 11, everyMonths: 6, r: 3 },
};

export type TimelineGeometry = {
  width: number;
  height: number;
  font: number;
  r: number;
  plot: { x0: number; x1: number; y0: number; y1: number };
  /** One tick per month on the baseline; the labelled ones carry text. */
  months: { month: string; x: number; label: string | null }[];
  yTicks: { value: number; y: number; label: string }[];
  marks: { x: number; y: number; resale: boolean; saleDate: string; salePrice: number }[];
  /** The dashed rule for the chosen group's median, or null without one. */
  median: { y: number; value: number; label: string } | null;
};

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayIndex = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;

/** The months from `from` through `to` (YYYY-MM-DD both), oldest first. */
export function monthsSpanning(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = [Number(from.slice(0, 4)), Number(from.slice(5, 7))];
  const end = `${to.slice(0, 7)}`;
  for (let i = 0; i < 60; i += 1) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (key >= end) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** "$450K", "$1.2M", "$250K": the price axis in the shortest honest form. */
export function priceLabel(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

/** Three round gridlines between the lowest and highest price, with a little room at both ends. */
export function priceAxis(prices: number[]): { yMin: number; yMax: number; ticks: number[] } {
  if (!prices.length) return { yMin: 0, yMax: 1, ticks: [0, 1] };
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const span = Math.max(hi - lo, hi * 0.1, 1_000);
  const raw = span / 2;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  let yMin = Math.floor(lo / step) * step;
  // Room under the lowest mark, so it never sits on the baseline.
  if (yMin === lo) yMin -= step;
  yMin = Math.max(0, yMin);
  let yMax = Math.ceil(hi / step) * step;
  if (yMax === hi) yMax += step;
  if (yMax <= yMin) yMax = yMin + step;
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + step / 1000; t += step) ticks.push(Math.round(t));
  // Keep to about three gridlines: thin the ticks when the step came out small.
  while (ticks.length > 5) ticks.splice(1, 1);
  return { yMin, yMax, ticks };
}

export function timelineGeometry(
  points: TimelinePoint[],
  window: { from: string; to: string },
  median: { value: number; label: string } | null,
  variant: TimelineVariant,
): TimelineGeometry {
  const L = LAYOUT[variant];
  const plot = { x0: L.left, x1: L.width - L.right, y0: L.top, y1: L.height - L.bottom };
  const d0 = dayIndex(window.from);
  const d1 = Math.max(d0 + 1, dayIndex(window.to));
  const x = (iso: string) => plot.x0 + ((plot.x1 - plot.x0) * Math.min(Math.max(dayIndex(iso) - d0, 0), d1 - d0)) / (d1 - d0);
  const axis = priceAxis([...points.map((p) => p.salePrice), ...(median ? [median.value] : [])]);
  const y = (v: number) => plot.y1 - ((v - axis.yMin) / (axis.yMax - axis.yMin || 1)) * (plot.y1 - plot.y0);

  // One tick per month; a label every third (sixth on a phone), counted from the newest so the last month is always named.
  const months = monthsSpanning(window.from, window.to);
  const monthTicks = months.map((m, i) => {
    const [yy, mm] = m.split("-").map(Number) as [number, number];
    const label = (months.length - 1 - i) % L.everyMonths === 0 ? `${SHORT[mm - 1]} ${String(yy).slice(2)}` : null;
    // The first month starts before the window; its tick sits at the window's start.
    return { month: m, x: Math.max(x(`${m}-01`), plot.x0), label };
  });

  return {
    width: L.width,
    height: L.height,
    font: L.font,
    r: L.r,
    plot,
    months: monthTicks,
    yTicks: axis.ticks.map((t) => ({ value: t, y: y(t), label: priceLabel(t) })),
    marks: points.map((p) => ({ x: x(p.saleDate), y: y(p.salePrice), resale: p.resale, saleDate: p.saleDate, salePrice: p.salePrice })),
    median: median ? { y: y(median.value), value: median.value, label: median.label } : null,
  };
}
