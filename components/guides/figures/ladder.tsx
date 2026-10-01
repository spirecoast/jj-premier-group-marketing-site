import type { LadderFigure } from "@/lib/guides/types";
import { seriesBg } from "./shared";

/**
 * The zones as a stair from dry ground to the open Gulf. Each step is a
 * row; the code sits on a tread that steps right as the ground gets wetter,
 * and three columns read the same letter three ways. On phones the columns
 * stack under the step.
 */
export function LadderFigureView({ figure, title }: { figure: LadderFigure; title: string }) {
  const n = figure.steps.length;
  return (
    <div className="flex flex-col">
      <div className="hidden grid-cols-[150px_1.3fr_1fr_1fr_1fr] gap-x-4 border-b border-hairline pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600 md:grid">
        <span>The zone</span>
        <span>What it means</span>
        <span>{figure.columns.lender}</span>
        <span>{figure.columns.insurer}</span>
        <span>{figure.columns.building}</span>
      </div>
      <ol className="flex flex-col" aria-label={title}>
        {figure.steps.map((s, i) => (
          <li key={s.name} className="grid gap-x-4 gap-y-2 border-b border-hairline py-4 md:grid-cols-[150px_1.3fr_1fr_1fr_1fr]">
            <div className="flex items-start gap-3">
              {/* The tread: a short bar that steps right with each row. */}
              <svg width="56" height="44" viewBox="0 0 56 44" aria-hidden="true" className="shrink-0">
                <rect x="0" y={2 + i * (40 / n)} width={16 + (i * 40) / n} height="3" rx="1.5" className={`${s.series === 0 ? "fill-harbor-800" : s.series === 1 ? "fill-coral" : "fill-sky-600"}`} />
                {i < n - 1 ? <line x1={16 + (i * 40) / n} x2={16 + (i * 40) / n} y1={5 + i * (40 / n)} y2={44} className="stroke-hairline" strokeWidth="1" /> : null}
                {i === n - 1 ? <path d="M0 40 q7 -5 14 0 t14 0 t14 0 t14 0" className="fill-none stroke-sky-600" strokeWidth="1.5" strokeLinecap="round" /> : null}
              </svg>
              <div className="flex flex-col">
                <span className="font-display text-[26px] font-light leading-none text-navy">{s.code}</span>
                <span className="mt-1 text-[13px] font-medium text-ink">{s.name}</span>
              </div>
            </div>
            <p className="text-[14px] leading-snug text-body">{s.means}</p>
            {(
              [
                [figure.columns.lender, s.lender],
                [figure.columns.insurer, s.insurer],
                [figure.columns.building, s.building],
              ] as const
            ).map(([head, text]) => (
              <p key={head} className="flex flex-col gap-0.5 text-[13px] leading-snug text-body md:text-[14px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500 md:hidden">{head}</span>
                <span className="flex items-start gap-2">
                  <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${seriesBg(s.series)} md:hidden`} aria-hidden="true" />
                  {text}
                </span>
              </p>
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}
