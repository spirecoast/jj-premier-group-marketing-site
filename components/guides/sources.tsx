import type { Guide } from "@/lib/guides/types";
import { guideFigures, guideSources } from "@/lib/guides";

const two = (n: number) => String(n).padStart(2, "0");

/**
 * "Where this comes from": every page the guide opened, numbered, with the
 * day it was opened; then the figure sources, one line per figure.
 */
export function GuideSources({ guide }: { guide: Guide }) {
  const sources = guideSources(guide);
  const figures = guideFigures(guide);
  return (
    <section className="guide-sources flex flex-col gap-8" aria-labelledby="guide-sources-title">
      <div className="flex flex-col gap-2">
        <p className="t-eyebrow text-amber">Where this comes from</p>
        <h2 id="guide-sources-title" className="t-h2 text-navy">
          Sources and further reading
        </h2>
        <p className="t-small max-w-measure text-body-muted">
          Every page below was opened on the day shown. Maps get redrawn and rules change; confirm the particulars of a house with the county, the surveyor and your insurance agent before you rely on them.
        </p>
      </div>
      <ol className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {sources.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[32px_1fr] gap-3 py-3">
            <span className="font-mono text-[11px] text-amber">{two(i + 1)}</span>
            <div className="flex flex-col gap-0.5">
              {s.href ? (
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium leading-snug text-ink underline decoration-harbor-300 underline-offset-2 hover:text-navy">
                  {s.label}
                </a>
              ) : (
                <span className="text-[14px] font-medium leading-snug text-ink">{s.label}</span>
              )}
              <span className="font-mono text-[11px] text-graphite-500">
                {s.href ? guide.checked : `${s.note ?? "did not load when we checked"}, ${guide.checked}`}
                {s.href && s.note ? `. ${s.note}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3">
        <p className="t-eyebrow text-amber">Figure sources</p>
        <ol className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {figures.map((f) => (
            <li key={f.number} className="grid grid-cols-[64px_1fr] gap-3 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-amber">Fig. {two(f.number)}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium leading-snug text-ink">{f.title}</span>
                <span className="text-[13px] leading-snug text-body-muted">
                  {f.source.href ? (
                    <a href={f.source.href} target="_blank" rel="noopener noreferrer" className="underline decoration-harbor-300 underline-offset-2 hover:text-navy">
                      {f.source.label}
                    </a>
                  ) : (
                    f.source.label
                  )}
                  .
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
