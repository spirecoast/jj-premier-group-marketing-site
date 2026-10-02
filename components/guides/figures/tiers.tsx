import type { TiersFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * A home's value drawn as a column, lowest value at the bottom, cut into
 * bands. Each band is one row: the drawn block on the left, sized to its
 * share of the column, and the words for it beside it as text. The top
 * band has a torn edge, because the value runs on past the drawing.
 */

const TONE = {
  exempt: "var(--color-success)",
  partial: "var(--color-sky-600)",
  taxed: "var(--color-linen-400)",
} as const;

const COLUMN_H = 360;
const MIN_H = 78;

export function TiersFigureView({ figure, title }: { figure: TiersFigure; title: string }) {
  const bands = [...figure.bands].sort((a, b) => b.from - a.from);
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{figure.axis}</p>
      <ol className="flex flex-col">
        {bands.map((b, i) => {
          const h = Math.max(MIN_H, Math.round(((b.to - b.from) / figure.top) * COLUMN_H));
          const open = i === 0 && b.to >= figure.top;
          return (
            <li key={`${b.from}-${b.label}`} className="grid grid-cols-[72px_1fr] gap-x-5 sm:grid-cols-[112px_1fr] sm:gap-x-7">
              <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden="true" className="block">
                <rect x="0" y="0" width="100" height={h} fill={TONE[b.tone]} />
                {open ? <path d="M0,0 L100,0 L100,9 L90,3 L80,9 L70,3 L60,9 L50,3 L40,9 L30,3 L20,9 L10,3 L0,9 Z" fill="#ffffff" /> : null}
                <line x1="0" x2="100" y1={h} y2={h} stroke="#ffffff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="flex flex-col justify-center gap-1 border-b border-hairline py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{b.range}</span>
                <span className="text-[15px] font-medium leading-snug text-ink">{b.label}</span>
                <span className="text-[13.5px] leading-snug text-body-muted">{b.detail}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="What the colours mean">
        {(["exempt", "partial", "taxed"] as const)
          .filter((t) => figure.bands.some((b) => b.tone === t))
          .map((t) => (
            <li key={t} className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-600">
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" className="shrink-0">
                <rect width="18" height="10" rx="2" fill={TONE[t]} />
              </svg>
              {figure.legend[t]}
            </li>
          ))}
      </ul>
      <FigureTable caption={title} columns={["Value", "What happens", "Detail"]} rows={bands.map((b) => [b.range, b.label, b.detail])} />
    </div>
  );
}
