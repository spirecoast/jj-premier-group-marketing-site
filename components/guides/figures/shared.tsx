import type { Series } from "@/lib/guides/types";

/** Fill class for a series slot. Marks carry the colour; text never does. */
export const seriesFill = (s: Series) => `series-${s}` as const;
export const seriesBg = (s: Series) => `series-${s}-bg` as const;
export const seriesStroke = (s: Series) => `series-${s}-stroke` as const;

/**
 * A 45° hatch in the series colour, tone on tone, for the one mark a figure
 * wants to read as "not yet" (a waiting period, a gap). One pattern per
 * series per figure, keyed on the figure's id.
 */
export function HatchDefs({ id, series }: { id: string; series: Series[] }) {
  return (
    <defs>
      {series.map((s) => (
        <pattern key={s} id={`${id}-hatch-${s}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" className="fill-white" />
          <rect width="2.2" height="6" className={seriesFill(s)} opacity="0.85" />
        </pattern>
      ))}
    </defs>
  );
}

export const hatchUrl = (id: string, s: Series) => `url(#${id}-hatch-${s})`;

/** The legend row every figure with two or more series carries. */
export function Legend({ id, items }: { id: string; items: { label: string; series: Series; hatched?: boolean }[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-600">
          <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" className="shrink-0">
            {it.hatched ? <HatchDefs id={`${id}-lg`} series={[it.series]} /> : null}
            <rect width="18" height="10" rx="2" className={it.hatched ? seriesStroke(it.series) : seriesFill(it.series)} fill={it.hatched ? hatchUrl(`${id}-lg`, it.series) : undefined} strokeWidth={it.hatched ? 1 : 0} />
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** The accessible twin of a drawn figure: a real table, folded under the drawing. */
export function FigureTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="print-hide mt-4 border-t border-hairline pt-3">
      <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-600 [&::-webkit-details-marker]:hidden">
        Read this figure as a table
      </summary>
      <table className="mt-3 w-full border-collapse text-[13px] leading-snug text-body">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="border-b border-hairline py-1.5 pr-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="border-b border-hairline py-1.5 pr-3 text-left font-medium text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="border-b border-hairline py-1.5 pr-3 align-top tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
