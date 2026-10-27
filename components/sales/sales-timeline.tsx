"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { timelineGeometry, type TimelineGeometry, type TimelinePoint, type TimelineVariant } from "@/lib/sales/timeline";
import { SOLD_COPY as C } from "./copy";
import { fmtDate, usd } from "./sales-table";

/**
 * Every sale on the street as a mark: date across, price up. Resales are
 * filled navy, new builds and lots hollow in Sky 700, and the chosen group's
 * median runs across as a dashed rule. Two drawings of the same geometry
 * (lib/sales/timeline.ts): a 3:1 one from 640px up and a 2:1 one on a phone.
 * The marks draw on from the left the first time the figure comes into view
 * (none of that for reduced motion), and the median rule follows. The figure
 * is described in words; the table under it is the accessible copy.
 */

const NAVY = "#2e4a5c";
const SKY = "#2c6e7e";
const RULE = "#d2c6b4";
const GRID = "#e1eaf0";
const MUTED = "#53565a";

type Props = {
  points: TimelinePoint[];
  window: { from: string; to: string };
  median: { value: number; label: string } | null;
  months: number;
  resaleMedian: number | null;
  newerMedian: number | null;
};

function Drawing({ g, variant, id, drawn }: { g: TimelineGeometry; variant: TimelineVariant; id: string; drawn: boolean }) {
  const { plot, font } = g;
  const mono = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" as const };
  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      width="100%"
      className={variant === "wide" ? "hidden h-auto w-full overflow-visible sm:block" : "block h-auto w-full overflow-visible sm:hidden"}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${id}-${variant}-clip`}>
          <rect className="sales-timeline-reveal" x={plot.x0 - 8} y={0} width={drawn ? plot.x1 - plot.x0 + 16 : 0} height={g.height} />
        </clipPath>
      </defs>
      {g.yTicks.map((t) => (
        <g key={t.value}>
          <line x1={plot.x0} x2={plot.x1} y1={t.y} y2={t.y} stroke={GRID} strokeWidth={1} />
          <text x={plot.x0 - 8} y={t.y + font / 3} fontSize={font} textAnchor="end" fill={MUTED} style={mono}>
            {t.label}
          </text>
        </g>
      ))}
      <line x1={plot.x0} x2={plot.x1} y1={plot.y1} y2={plot.y1} stroke={RULE} strokeWidth={1} />
      {g.months.map((m) => (
        <g key={m.month}>
          <line x1={m.x} x2={m.x} y1={plot.y1} y2={plot.y1 + (m.label ? 6 : 3)} stroke={RULE} strokeWidth={1} />
          {m.label ? (
            <text x={m.x} y={plot.y1 + 20} fontSize={font} textAnchor="middle" fill={MUTED} style={mono}>
              {m.label}
            </text>
          ) : null}
        </g>
      ))}
      <g clipPath={`url(#${id}-${variant}-clip)`}>
        {g.marks.map((m, i) =>
          m.resale ? (
            <circle key={i} cx={m.x} cy={m.y} r={g.r} fill={NAVY} />
          ) : (
            <circle key={i} cx={m.x} cy={m.y} r={g.r} fill="none" stroke={SKY} strokeWidth={1.5} />
          ),
        )}
      </g>
      {g.median ? (
        <line
          className="sales-timeline-median"
          x1={plot.x0}
          x2={plot.x1}
          y1={g.median.y}
          y2={g.median.y}
          stroke={SKY}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          pathLength={1}
          style={{ strokeDashoffset: drawn ? 0 : 1, strokeDasharray: "4 4" }}
        />
      ) : null}
    </svg>
  );
}

export function SalesTimeline({ points, window, median, months, resaleMedian, newerMedian }: Props) {
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  // The marks draw on once, the first time a fifth of the figure is in view.
  useEffect(() => {
    if (seen || reduced) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, reduced]);
  const drawn = seen || reduced;
  const wide = timelineGeometry(points, window, median, "wide");
  const narrow = timelineGeometry(points, window, median, "narrow");
  const dates = points.map((p) => p.saleDate).sort();
  const label = C.timeline.label(points.length, fmtDate(dates[0] ?? window.from), fmtDate(dates[dates.length - 1] ?? window.to), resaleMedian ? usd.format(resaleMedian) : null, newerMedian ? usd.format(newerMedian) : null);
  return (
    <figure ref={ref} className="flex flex-col gap-3" role="img" aria-label={label} data-sales-timeline={drawn ? "drawn" : "waiting"}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1" aria-hidden="true">
        <span className="t-label text-linen-700">{C.timeline.title(months)}</span>
        {median ? <span className="t-record text-graphite-600">{median.label}</span> : null}
      </figcaption>
      <div aria-hidden="true">
        <Drawing g={wide} variant="wide" id={id} drawn={drawn} />
        <Drawing g={narrow} variant="narrow" id={id} drawn={drawn} />
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 t-note max-w-none" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ background: NAVY }} />
          {C.timeline.legendResale}
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full border-[1.5px]" style={{ borderColor: SKY }} />
          {C.timeline.legendNewer}
        </li>
        {median ? (
          <li className="flex items-center gap-2">
            <span className="inline-block w-5 border-t border-dashed" style={{ borderColor: SKY }} />
            {median.label}
          </li>
        ) : null}
      </ul>
    </figure>
  );
}
