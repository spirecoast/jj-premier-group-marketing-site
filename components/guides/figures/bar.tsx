import { useId } from "react";
import type { BarFigure } from "@/lib/guides/types";
import { FigureTable, HatchDefs, Legend, hatchUrl, seriesFill } from "./shared";

/**
 * Horizontal bars, one row per case, drawn to one scale. Each row is its
 * own SVG with percentage x-coordinates, so the labels keep their size at
 * every width and the bars stretch. Bars are 22px thick and square at the
 * baseline. The value label sits inside the bar end when the bar is long
 * enough and outside it otherwise; a zero-value bar shows as a tick in its
 * series colour with the label beside it.
 */
export function BarFigureView({ figure, title }: { figure: BarFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const series = [...new Set(figure.rows.flatMap((r) => r.segments.map((s) => s.series)))];
  const H = 22;
  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-4">
        {figure.rows.map((row) => {
          const total = row.segments.reduce((n, s) => n + s.value, 0);
          const pct = (total / figure.max) * 100;
          const inside = pct >= 55;
          // White type disappears into a hatch, so a hatched bar's label sits on its own white chip.
          const onHatch = inside && row.segments.some((s) => s.hatched);
          const label = row.segments.map((s) => s.label).join(" + ");
          let x = 0;
          return (
            <li key={row.label} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-5">
              <div className="flex flex-col">
                <span className="text-[15px] font-medium leading-snug text-ink">{row.label}</span>
                {row.sub ? <span className="text-[13px] leading-snug text-body-muted">{row.sub}</span> : null}
              </div>
              <div className="relative">
                <svg width="100%" height={H + 2} viewBox={`0 0 100 ${H + 2}`} preserveAspectRatio="none" aria-hidden="true" className="block overflow-visible">
                  <HatchDefs id={`${id}-r`} series={series} />
                  <line x1="0" x2="0" y1="0" y2={H + 2} className="stroke-graphite-300" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {row.segments.map((seg, i) => {
                    const w = (seg.value / figure.max) * 100;
                    const start = x;
                    x += w;
                    const gap = i > 0 ? 0.4 : 0;
                    return (
                      <rect
                        key={seg.label}
                        x={start + gap}
                        y="1"
                        width={Math.max(w - gap, seg.value === 0 ? 0.6 : 0)}
                        height={H}
                        className={seg.hatched ? undefined : seriesFill(seg.series)}
                        fill={seg.hatched ? hatchUrl(`${id}-r`, seg.series) : undefined}
                      />
                    );
                  })}
                </svg>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] tabular-nums ${onHatch ? "bg-white px-1.5 py-0.5 text-ink" : inside ? "text-white" : "text-ink"}`}
                  style={inside ? { right: `calc(${100 - pct}% + 10px)` } : { left: `calc(${pct}% + 10px)` }}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
        <Legend id={id} items={figure.legend} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">
          0 to {figure.max} {figure.unit}
        </span>
      </div>
      <FigureTable caption={title} columns={["Case", `Value (${figure.unit})`]} rows={figure.rows.map((r) => [r.label, r.segments.map((s) => `${s.value} (${s.label})`).join(", ")])} />
    </div>
  );
}
