import type { DecidesFigure } from "@/lib/guides/types";

/**
 * Two panels side by side: what the first thing decides, and what the
 * second thing decides. The first is set on navy and the second on white so
 * the eye reads them as two different answers, not one list.
 */
export function DecidesView({ figure }: { figure: DecidesFigure }) {
  const [a, b] = figure.panels;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="flex flex-col gap-4 bg-navy p-6 text-white md:p-8" aria-label={a.eyebrow}>
        <p className="t-eyebrow text-mist">{a.eyebrow}</p>
        <p className="font-display text-[26px] font-light leading-tight text-white md:text-[30px]">{a.title}</p>
        <ul className="mt-1 flex flex-col gap-3 border-t border-white/20 pt-4">
          {a.items.map((t) => (
            <li key={t} className="flex items-start gap-3 text-[15px] leading-snug text-linen-100">
              <span className="mt-[7px] block h-1.5 w-1.5 shrink-0 bg-sky-300" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4 border border-hairline bg-white p-6 md:p-8" aria-label={b.eyebrow}>
        <p className="t-eyebrow text-amber">{b.eyebrow}</p>
        <p className="font-display text-[26px] font-light leading-tight text-navy md:text-[30px]">{b.title}</p>
        <ol className="mt-1 flex flex-col gap-3 border-t border-hairline pt-4">
          {b.items.map((t, i) => (
            <li key={t} className="flex items-start gap-3 text-[15px] leading-snug text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-harbor-300 text-[12px] tabular-nums text-harbor-800" aria-hidden="true">
                {i + 1}
              </span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
