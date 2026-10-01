import type { ComparisonFigure } from "@/lib/guides/types";

function Cell({ cell }: { cell: ComparisonFigure["rows"][number]["cells"][number] }) {
  if (typeof cell === "string") return <>{cell}</>;
  const mark = cell.mark === "yes" ? "✓" : cell.mark === "no" ? "✕" : "–";
  const tone = cell.mark === "yes" ? "text-success" : cell.mark === "no" ? "text-danger" : "text-graphite-500";
  return (
    <span className="flex items-start gap-2">
      <span className={`font-mono text-[12px] leading-[1.6] ${tone}`} aria-hidden="true">
        {mark}
      </span>
      <span>
        <span className="sr-only">{cell.mark === "yes" ? "Yes: " : cell.mark === "no" ? "No: " : ""}</span>
        {cell.text}
      </span>
    </span>
  );
}

/** Options side by side on the points that differ. A real table. */
export function ComparisonFigureView({ figure, title }: { figure: ComparisonFigure; title: string }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[520px] border-collapse text-[14px] leading-snug text-body">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col" className="pb-3 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600">
              {figure.columns[0]}
            </th>
            {figure.columns.slice(1).map((c) => (
              <th key={c} scope="col" className="pb-3 pr-4 text-left align-bottom font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {figure.rows.map((r) => (
            <tr key={r.label} className="border-t border-hairline">
              <th scope="row" className="py-3 pr-4 text-left align-top">
                <span className="block font-medium text-ink">{r.label}</span>
                {r.sub ? <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{r.sub}</span> : null}
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className="py-3 pr-4 align-top">
                  <Cell cell={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
