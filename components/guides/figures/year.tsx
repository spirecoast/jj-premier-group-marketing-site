import { useId } from "react";
import type { YearFigure } from "@/lib/guides/types";
import { FigureTable, HatchDefs, hatchUrl, seriesFill } from "./shared";

/**
 * One calendar year as a strip of twelve months. Spans are shaded across
 * the strip and marked days get a numbered chip above it, with the words
 * for each set as text under the drawing so they read on a phone. The
 * strip is an SVG with percentage coordinates, so it stretches and the
 * chips keep their size. Positions are months from January 1 (0 to 12).
 */

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const H = 44;

const pct = (m: number) => (Math.min(Math.max(m, 0), 12) / 12) * 100;
const firstMonth = (m: number) => NAMES[Math.min(11, Math.max(0, Math.floor(m)))];
const lastMonth = (m: number) => NAMES[Math.min(11, Math.max(0, Math.ceil(m) - 1))];

export function YearFigureView({ figure, title }: { figure: YearFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const hatched = [...new Set(figure.spans.filter((s) => s.hatched).map((s) => s.series))];
  return (
    <div className="flex flex-col gap-4">
      <div className="relative pt-8">
        <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true" className="block overflow-visible">
          <HatchDefs id={id} series={hatched} />
          <rect x="0" y="0" width="100" height={H} fill="var(--color-linen-100)" />
          {figure.spans.map((s) => (
            <rect
              key={s.label}
              x={pct(s.from)}
              y="0"
              width={Math.max(pct(s.to) - pct(s.from), 0.4)}
              height={H}
              className={s.hatched ? undefined : seriesFill(s.series)}
              fill={s.hatched ? hatchUrl(id, s.series) : undefined}
            />
          ))}
          {MONTHS.map((_, i) =>
            i > 0 ? <line key={i} x1={(i / 12) * 100} x2={(i / 12) * 100} y1="0" y2={H} stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" /> : null,
          )}
          <rect x="0" y="0" width="100" height={H} fill="none" stroke="var(--color-graphite-300)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {figure.marks.map((m) => (
            <line key={m.label} x1={pct(m.at)} x2={pct(m.at)} y1="-10" y2={H} stroke="var(--color-coral)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {figure.marks.map((m, i) => (
          <span
            key={m.label}
            aria-hidden="true"
            className="absolute top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-navy font-mono text-[10px] text-white"
            style={{ left: `clamp(12px, ${pct(m.at)}%, calc(100% - 12px))` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-12 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-graphite-500" aria-hidden="true">
        {MONTHS.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
      <ol className="flex flex-col gap-2.5 border-t border-hairline pt-4">
        {figure.marks.map((m, i) => (
          <li key={m.label} className="grid grid-cols-[24px_1fr] gap-x-3 text-[15px] leading-snug text-body">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy font-mono text-[10px] text-white" aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <span className="font-medium text-ink">{m.label}.</span> {m.detail}
            </span>
          </li>
        ))}
      </ol>
      {figure.spans.length ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="What the shaded parts mean">
          {figure.spans.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 text-[14px] text-body">
              <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true" className="shrink-0">
                {s.hatched ? <HatchDefs id={`${id}-k${s.series}`} series={[s.series]} /> : null}
                <rect
                  width="22"
                  height="12"
                  className={s.hatched ? undefined : seriesFill(s.series)}
                  fill={s.hatched ? hatchUrl(`${id}-k${s.series}`, s.series) : undefined}
                  stroke="var(--color-graphite-300)"
                  strokeWidth="1"
                />
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <FigureTable
        caption={title}
        columns={["When", "What happens"]}
        rows={[...figure.spans.map((s) => [`${firstMonth(s.from)} to ${lastMonth(s.to)}`, s.label]), ...figure.marks.map((m) => [m.label, m.detail])]}
      />
    </div>
  );
}
