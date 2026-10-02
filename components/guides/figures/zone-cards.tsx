import type { ZoneCardsFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

const TONE = {
  highest: "var(--color-coral)",
  high: "var(--color-sky-600)",
  lower: "var(--color-success)",
} as const;

/**
 * One card per zone, in the coast drawing's order: the letter set large, the
 * risk in a word or two, what it means, and the two rules a buyer runs into,
 * the lender's and the building code's.
 */
export function ZoneCardsView({ figure, title }: { figure: ZoneCardsFigure; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ol className="grid gap-4 md:grid-cols-3">
        {figure.cards.map((c) => (
          <li key={c.code} className="flex flex-col border border-hairline bg-white">
            <span className="block h-1.5" style={{ background: TONE[c.tone] }} aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <span className="font-display text-[64px] font-light leading-[0.85] text-navy">{c.code}</span>
                <span className="text-[13px] font-medium uppercase tracking-[0.1em]" style={{ color: TONE[c.tone] === TONE.high ? "var(--color-sky-700)" : TONE[c.tone] }}>
                  {c.name}
                </span>
              </div>
              <p className="text-[16px] leading-snug text-body">{c.means}</p>
              <dl className="mt-auto flex flex-col gap-4 border-t border-hairline pt-4">
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-graphite-500">{figure.labels.lender}</dt>
                  <dd className="flex items-start gap-2.5 text-[15px] leading-snug text-ink">
                    <Mark mark={c.lender.mark} />
                    <span>{c.lender.text}</span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-graphite-500">{figure.labels.build}</dt>
                  <dd className="text-[15px] leading-snug text-ink">{c.build}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <FigureTable
        caption={title}
        columns={["Zone", "Risk", "What it means", figure.labels.lender, figure.labels.build]}
        rows={figure.cards.map((c) => [c.code, c.name, c.means, c.lender.text, c.build])}
      />
    </div>
  );
}

function Mark({ mark }: { mark: "yes" | "no" | "maybe" }) {
  if (mark === "maybe")
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className="mt-px shrink-0" role="img" aria-label="Sometimes">
        <circle cx="10" cy="10" r="9.25" fill="#ffffff" stroke="var(--color-navy)" strokeWidth="1.5" />
        <path d="M10 0.75 A9.25 9.25 0 0 1 10 19.25 Z" fill="var(--color-navy)" />
      </svg>
    );
  return mark === "yes" ? (
    <svg width="20" height="20" viewBox="0 0 20 20" className="mt-px shrink-0" role="img" aria-label="Yes">
      <circle cx="10" cy="10" r="10" fill="var(--color-navy)" />
      <path d="M5.5 10.5 L8.6 13.4 L14.5 7" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" className="mt-px shrink-0" role="img" aria-label="No">
      <circle cx="10" cy="10" r="9.25" fill="#ffffff" stroke="var(--color-graphite-400)" strokeWidth="1.5" />
      <path d="M6.5 10 L13.5 10" fill="none" stroke="var(--color-graphite-500)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
