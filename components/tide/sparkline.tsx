import { fill } from "@/lib/issues/copy";
import { monthLabel } from "@/lib/issues/render";
import { SERIES_STYLE, sparkGeometry } from "@/lib/tide/chart";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, shortMonth, type IssueMarket } from "@/lib/tide/issue";

const W_ = 320;
const H_ = 80;

/**
 * A market's twelve months of sales as one quiet line, drawn on the server:
 * the axis from zero, the typical month as a dashed hairline, the last month
 * marked. The drawing stretches to its column at a fixed height (the strokes
 * keep their width), and the end mark is set over it in HTML so it stays
 * round. It's described in words for screen readers.
 */
export function Sparkline({ m }: { m: IssueMarket }) {
  const series = m.series.map((p) => ({ month: p.month, value: p.count }));
  const g = sparkGeometry(series, m.baseline.count, { width: W_, height: H_, pad: 6 });
  const color = SERIES_STYLE[m.market].color;
  const last = g.points[g.points.length - 1];
  const first = g.points[0];
  const label = fill(W.sparkLabel, {
    market: m.name,
    from: first ? monthLabel(first.month) : "",
    to: last ? monthLabel(last.month) : "",
    values: series.map((p) => `${shortMonth(p.month, true)} ${num(p.value)}`).join(", "),
  });
  const base = H_ - 6;
  const area = g.points.length ? `M ${g.points[0]!.x} ${base} ` + g.points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${last!.x} ${base} Z` : "";
  return (
    <figure className="flex flex-col gap-3" role="img" aria-label={label}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1" aria-hidden="true">
        <span className="t-label text-linen-700">{W.sparkTitle}</span>
        {m.baseline.count !== null ? (
          <span className="t-record flex items-center gap-2 text-linen-700">
            <span className="inline-block w-5 border-t border-dashed border-linen-500" />
            {fill(W.typical, { value: num(m.baseline.count) })}
          </span>
        ) : null}
      </div>
      <div className="relative h-20 w-full" aria-hidden="true">
        <svg viewBox={`0 0 ${W_} ${H_}`} preserveAspectRatio="none" className="absolute inset-0 block h-full w-full overflow-visible" focusable="false">
          <line x1={0} x2={W_} y1={base} y2={base} stroke="#d2c6b4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {g.typicalY !== null ? <line x1={0} x2={W_} y1={g.typicalY} y2={g.typicalY} stroke="#a3927a" strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" /> : null}
          <path d={area} fill={color} opacity={0.07} />
          <polyline
            points={g.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {last ? (
          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
            style={{ left: `${(100 * last.x) / W_}%`, top: `${(100 * last.y) / H_}%`, background: color }}
          />
        ) : null}
      </div>
      <div className="t-record flex justify-between gap-4 text-graphite-600" aria-hidden="true">
        <span>{first ? shortMonth(first.month, true) : ""}</span>
        <span className="text-navy">{last ? `${shortMonth(last.month, true)} · ${num(last.value)}` : ""}</span>
      </div>
    </figure>
  );
}
