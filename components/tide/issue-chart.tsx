import { chartGeometry, formatTick, SERIES_STYLE, type ChartGeometry, type Variant } from "@/lib/tide/chart";
import type { ChartModel } from "@/lib/tide/issue";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { fill } from "@/lib/issues/copy";
import { monthLabel } from "@/lib/issues/render";

/**
 * A Tide line chart, drawn on the server as inline SVG: one line per market,
 * a fixed color and end-marker shape per market, a legend, direct end
 * labels, hairline gridlines, and the numbers as a table for screen readers.
 * Two drawings of the same geometry: a wide one from 640px up and a narrow
 * one (every third month labelled, larger type) below it. Hovering a point
 * shows its value (the SVG <title>); the table carries every value.
 */

const INK = "#2b2d30";
const MUTED = "#53565a";
const GRID = "#e1eaf0";
const AXIS = "#bcbec0";

function Marker({ shape, x, y, color, r = 4.5 }: { shape: "circle" | "square" | "diamond"; x: number; y: number; color: string; r?: number }) {
  const ring = { stroke: "#ffffff", strokeWidth: 2, fill: color };
  if (shape === "square") return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} {...ring} />;
  if (shape === "diamond") return <path d={`M ${x} ${y - r * 1.3} L ${x + r * 1.3} ${y} L ${x} ${y + r * 1.3} L ${x - r * 1.3} ${y} Z`} {...ring} />;
  return <circle cx={x} cy={y} r={r} {...ring} />;
}

function Drawing({ c, g, variant }: { c: ChartModel; g: ChartGeometry; variant: Variant }) {
  const { plot, font } = g;
  const mono = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" as const };
  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      width="100%"
      className={variant === "wide" ? "hidden h-auto w-full sm:block" : "block h-auto w-full sm:hidden"}
      style={{ maxWidth: g.width }}
      aria-hidden="true"
      focusable="false"
    >
      <text x={plot.x0 - 6} y={14} fontSize={font - 1} fill={MUTED} style={{ fontFamily: "var(--font-body)" }}>
        {c.axisLabel}
      </text>
      {g.yTicks.map((t) => (
        <g key={t.value}>
          <line x1={plot.x0} x2={plot.x1} y1={t.y} y2={t.y} stroke={t.y === plot.y1 ? AXIS : GRID} strokeWidth={1} />
          <text x={plot.x0 - 8} y={t.y + font / 3} fontSize={font - 1} textAnchor="end" fill={MUTED} style={mono}>
            {t.label}
          </text>
        </g>
      ))}
      {g.xLabels.map((l) => (
        <g key={l.index}>
          <line x1={l.x} x2={l.x} y1={plot.y1} y2={plot.y1 + 4} stroke={AXIS} strokeWidth={1} />
          <text x={l.x} y={plot.y1 + 18} fontSize={font - 1} textAnchor="middle" fill={MUTED} style={mono}>
            {l.label}
          </text>
          {l.year ? (
            <text x={l.x} y={plot.y1 + 32} fontSize={font - 1} textAnchor="middle" fill={MUTED} style={mono}>
              {l.year}
            </text>
          ) : null}
        </g>
      ))}
      {g.baselineNote ? (
        <text x={plot.x1} y={g.height - 6} textAnchor="end" fontSize={font - 1} fill={INK} style={{ fontFamily: "var(--font-body)" }}>
          {`↑ ${g.baselineNote}`}
        </text>
      ) : null}
      {g.lines.map((l) => (
        <g key={l.market}>
          <polyline
            points={l.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke={l.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {l.end ? <Marker shape={l.shape} x={l.end.x} y={l.end.y} color={l.color} /> : null}
          {l.end ? (
            <>
              {Math.abs(l.end.labelY - l.end.y) > 2 ? (
                <line x1={l.end.x + 7} y1={l.end.y} x2={l.end.x + 13} y2={l.end.labelY} stroke={AXIS} strokeWidth={1} />
              ) : null}
              <text x={l.end.x + 15} y={l.end.labelY + font / 3} fontSize={font} fill={INK} style={mono}>
                {l.end.text}
              </text>
            </>
          ) : null}
          {l.points.map((p) => (
            <circle key={p.index} cx={p.x} cy={p.y} r={10} fill="transparent">
              <title>{fill(c.unit === "usd" ? W.tipPpsf : W.tipSales, { market: l.name, month: monthLabel(p.month), value: formatTick(c.unit, p.value) })}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}

export function IssueChart({ chart }: { chart: ChartModel }) {
  const wide = chartGeometry(chart, "wide");
  const narrow = chartGeometry(chart, "narrow");
  const id = `chart-${chart.id}`;
  return (
    <figure className="flex min-w-0 flex-col gap-4 border border-hairline bg-white p-4 sm:p-6" aria-labelledby={`${id}-title`}>
      <figcaption className="flex flex-col gap-1.5">
        <h3 id={`${id}-title`} className="t-h3 text-navy">
          {chart.title}
        </h3>
        <p className="t-small text-body-muted">{chart.note}</p>
      </figcaption>
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-hidden="true">
        {chart.series.map((s) => {
          const st = SERIES_STYLE[s.market];
          return (
            <li key={s.market} className="flex items-center gap-2 text-[0.8125rem] text-body">
              <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
                <line x1="1" x2="25" y1="6" y2="6" stroke={st.color} strokeWidth="2" strokeLinecap="round" />
                <Marker shape={st.shape} x={13} y={6} color={st.color} r={4} />
              </svg>
              {s.name}
            </li>
          );
        })}
      </ul>
      <Drawing c={chart} g={wide} variant="wide" />
      <Drawing c={chart} g={narrow} variant="narrow" />
      <div className="sr-only">
      <table>
        <caption>{`${chart.title}. ${chart.note}`}</caption>
        <thead>
          <tr>
            <th scope="col">{W.tableMonth}</th>
            {chart.series.map((s) => (
              <th key={s.market} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.months.map((m, i) => (
            <tr key={m}>
              <th scope="row">{monthLabel(m)}</th>
              {chart.series.map((s) => (
                <td key={s.market}>{s.values[i] === null ? "–" : formatTick(chart.unit, s.values[i] as number)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
