import type { ChecklistFigure } from "@/lib/guides/types";

/** A worksheet: square boxes to tick, in order, with the detail under each line. */
export function ChecklistView({ figure }: { figure: ChecklistFigure }) {
  return (
    <ol className="flex flex-col divide-y divide-hairline border-y border-hairline">
      {figure.items.map((it, i) => (
        <li key={it.text} className="grid grid-cols-[28px_1fr] gap-x-4 py-3.5 md:grid-cols-[28px_36px_1fr]">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="mt-0.5">
            <rect x="1" y="1" width="20" height="20" className="fill-white stroke-harbor-800" strokeWidth="1.25" />
          </svg>
          <span className="hidden font-mono text-[11px] leading-[26px] text-amber md:block">0{i + 1}</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-medium leading-snug text-ink">
              <span className="font-mono text-[11px] text-amber md:hidden">0{i + 1} · </span>
              {it.text}
            </span>
            {it.detail ? <span className="text-[13.5px] leading-snug text-body-muted">{it.detail}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
