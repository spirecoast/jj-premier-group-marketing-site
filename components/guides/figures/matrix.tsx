import type { MatrixFigure } from "@/lib/guides/types";

function Mark({ value }: { value: "yes" | "no" | "partial" }) {
  if (value === "no") return <span className="inline-block h-1.5 w-1.5 rounded-full bg-graphite-300" aria-hidden="true" />;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="inline-block">
      <circle cx="8" cy="8" r="7" className="fill-white stroke-harbor-800" strokeWidth="1.25" />
      {value === "yes" ? <circle cx="8" cy="8" r="4.5" className="fill-harbor-800" /> : <path d="M8 3.5 A4.5 4.5 0 0 0 8 12.5 Z" className="fill-harbor-800" />}
    </svg>
  );
}

/**
 * Rows of things against columns of questions, each cell a filled, half or
 * empty mark. From the small breakpoint up it is a real table; on phones
 * each row becomes a card listing the questions it answers, so nothing
 * scrolls sideways. The marks carry text alternatives from the legend.
 */
export function MatrixFigureView({ figure, title }: { figure: MatrixFigure; title: string }) {
  const word = (v: "yes" | "no" | "partial") => figure.legend[v];
  const legend = (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-hairline pt-3" aria-label="Legend">
      {(["yes", "partial", "no"] as const).map((v) => (
        <li key={v} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-600">
          <Mark value={v} />
          {figure.legend[v]}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="flex flex-col gap-4">
      <table className="hidden w-full border-collapse sm:table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[30%] pb-3 pr-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600">
              The document
            </th>
            {figure.columns.map((c) => (
              <th key={c} scope="col" className="px-1 pb-3 text-center align-bottom font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.1em] text-graphite-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {figure.rows.map((r) => (
            <tr key={r.label} className="border-t border-hairline">
              <th scope="row" className="py-3 pr-3 text-left align-middle">
                <span className="block text-[14px] font-medium leading-snug text-ink">{r.label}</span>
                {r.sub ? <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{r.sub}</span> : null}
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className="px-1 py-3 text-center align-middle">
                  <Mark value={c} />
                  <span className="sr-only">{word(c)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-col divide-y divide-hairline border-t border-hairline sm:hidden" aria-label={title}>
        {figure.rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-2 py-3">
            <div>
              <span className="block text-[14px] font-medium leading-snug text-ink">{r.label}</span>
              {r.sub ? <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{r.sub}</span> : null}
            </div>
            <ul className="flex flex-col gap-1">
              {figure.columns.map((c, i) => (
                <li key={c} className="grid grid-cols-[20px_1fr] items-center gap-2 text-[13px] leading-snug text-body">
                  <span className="flex justify-center">
                    <Mark value={r.cells[i]} />
                  </span>
                  <span>
                    {c}
                    <span className="sr-only">: {word(r.cells[i])}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {legend}
    </div>
  );
}
