import type { ElevationExampleFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * An illustrative house drawn against its base flood elevation. The
 * vertical scale is real (feet above the datum, as the certificate prints
 * them); the house is a diagram, not a building. The items list beside it
 * carries the same numbers in the certificate's own item codes.
 *
 * Layout, left to right: the garage, the compressor on its pad, the house,
 * then clear ground where the readings are written against the scale.
 */
export function ElevationExampleView({ figure, title }: { figure: ElevationExampleFigure; title: string }) {
  const lo = Math.floor(Math.min(figure.lowestAdjacentGrade, figure.garageSlab, figure.bfe) - 0.5);
  const hi = Math.ceil(Math.max(figure.lowestFloor, figure.bfe) + 1.2);
  const top = 28;
  const bottom = 272;
  const y = (ft: number) => bottom - ((ft - lo) / (hi - lo)) * (bottom - top);
  const ticks: number[] = [];
  for (let f = lo; f <= hi; f += 1) ticks.push(f);

  const groundL = y(figure.lowestAdjacentGrade);
  const groundR = y(figure.highestAdjacentGrade);
  const floor = y(figure.lowestFloor);
  const garage = y(figure.garageSlab);
  const ac = y(figure.machinery);
  const bfe = y(figure.bfe);

  const W = 460;
  const scaleX = 426;
  const labelX = 412;
  const gx = 28;
  const gw = 72;
  const acX = 112;
  const hx = 156;
  const hw = 140;
  const roofY = Math.max(top + 6, floor - 88);
  const delta = (ft: number) => `${ft - figure.bfe > 0 ? "+" : ""}${(ft - figure.bfe).toFixed(1)}`;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.25fr_1fr] md:items-start">
      <svg viewBox={`0 0 ${W} 300`} width="100%" className="max-w-[620px] overflow-visible" aria-hidden="true">
        {/* Vertical scale, right. */}
        <line x1={scaleX} x2={scaleX} y1={top} y2={bottom} className="stroke-graphite-300" strokeWidth="1" />
        {ticks.map((f) => (
          <g key={f}>
            <line x1={scaleX - 3} x2={scaleX + 3} y1={y(f)} y2={y(f)} className="stroke-graphite-300" strokeWidth="1" />
            <text x={scaleX + 8} y={y(f) + 3.5} className="fill-graphite-500" fontFamily="var(--font-mono)" fontSize="9">
              {f} ft
            </text>
          </g>
        ))}
        <text x={W} y={top - 12} textAnchor="end" className="fill-graphite-500" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="0.8">
          {figure.datum.toUpperCase()}
        </text>

        {/* Ground: a gentle slope from the lowest adjacent grade at left to the highest at right, filled below. */}
        <path d={`M12 ${groundL} L${hx + hw + 20} ${groundR} L${scaleX - 14} ${groundR} L${scaleX - 14} ${bottom} L12 ${bottom} Z`} className="fill-linen-200" />
        <path d={`M12 ${groundL} L${hx + hw + 20} ${groundR} L${scaleX - 14} ${groundR}`} className="fill-none stroke-linen-500" strokeWidth="1.5" />

        {/* Garage, its slab below the house floor. */}
        <rect x={gx} y={garage - 54} width={gw} height={54 + (groundL - garage) + 4} className="fill-white stroke-harbor-800" strokeWidth="1.25" />
        <rect x={gx + 9} y={garage - 40} width={gw - 18} height={40} className="fill-linen-100 stroke-harbor-800" strokeWidth="1" />
        <line x1={gx} x2={gx + gw} y1={garage} y2={garage} className="stroke-harbor-800" strokeWidth="2" />

        {/* The compressor on its pad, between the garage and the house. */}
        <rect x={acX} y={ac} width="30" height={groundL - ac + 2} className="fill-linen-300" />
        <rect x={acX + 3} y={ac - 22} width="24" height="22" className="fill-white stroke-harbor-800" strokeWidth="1.25" />
        <circle cx={acX + 15} cy={ac - 11} r="7" className="fill-none stroke-harbor-800" strokeWidth="1" />

        {/* House on its stem wall. */}
        <rect x={hx} y={floor} width={hw} height={groundR - floor + 2} className="fill-linen-100 stroke-harbor-800" strokeWidth="1.25" />
        <rect x={hx} y={roofY} width={hw} height={floor - roofY} className="fill-white stroke-harbor-800" strokeWidth="1.25" />
        <path d={`M${hx - 12} ${roofY} L${hx + hw / 2} ${roofY - 32} L${hx + hw + 12} ${roofY}`} className="fill-white stroke-harbor-800" strokeWidth="1.25" strokeLinejoin="round" />
        <line x1={hx} x2={hx + hw} y1={floor} y2={floor} className="stroke-harbor-800" strokeWidth="2.5" />
        <rect x={hx + 18} y={roofY + 20} width="28" height="24" className="fill-none stroke-harbor-800" strokeWidth="1" />
        <rect x={hx + 92} y={floor - 44} width="24" height="44" className="fill-none stroke-harbor-800" strokeWidth="1" />

        {/* The base flood elevation: one solid coral line across the drawing. */}
        <line x1="12" x2={scaleX} y1={bfe} y2={bfe} className="stroke-coral" strokeWidth="2" />
        <rect x={labelX - 92} y={bfe - 17} width="92" height="13" className="fill-white" />
        <text x={labelX} y={bfe - 7} textAnchor="end" className="fill-ink" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.6">
          B9 · BFE {figure.bfe.toFixed(1)} FT
        </text>

        {/* The readings, written in the clear ground to the right of the house, against the scale. */}
        {(
          [
            ["C2.a", figure.lowestFloor, floor, hx + hw, "above"],
            ["C2.e", figure.machinery, ac - 22, acX + 27, "below"],
            ["C2.d", figure.garageSlab, garage, gx + gw, "below"],
            ["C2.f", figure.lowestAdjacentGrade, groundL, 20, undefined],
          ] as const
        ).map(([code, ft, yy, x0, verdict]) => (
          <g key={code}>
            <line x1={x0} x2={scaleX - 6} y1={yy} y2={yy} className="stroke-graphite-300" strokeWidth="0.75" />
            <circle cx={x0} cy={yy} r="3" className={verdict === "below" ? "fill-coral" : "fill-harbor-800"} stroke="#fff" strokeWidth="1.5" />
            <text x={labelX} y={yy - 3} textAnchor="end" className="fill-ink" fontFamily="var(--font-mono)" fontSize="8.5" letterSpacing="0.3">
              {code} · {ft.toFixed(1)} FT{verdict ? ` · ${delta(ft)}` : ""}
            </text>
          </g>
        ))}

        {/* The one number the figure is about. */}
        <line x1={hx + 24} x2={hx + 24} y1={floor} y2={bfe} className="stroke-coral" strokeWidth="1.5" />
        <line x1={hx + 20} x2={hx + 28} y1={floor} y2={floor} className="stroke-coral" strokeWidth="1.5" />
        <line x1={hx + 20} x2={hx + 28} y1={bfe} y2={bfe} className="stroke-coral" strokeWidth="1.5" />
        <text x={hx + 32} y={(floor + bfe) / 2 + 3} className="fill-ink" fontFamily="var(--font-mono)" fontSize="9" fontWeight="500">
          +{(figure.lowestFloor - figure.bfe).toFixed(1)} FT
        </text>

        <text x="12" y={bottom + 18} className="fill-graphite-500" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="0.8">
          ILLUSTRATIVE · ZONE {figure.zone} · DIAGRAM 1A, SLAB ON GRADE
        </text>
      </svg>

      <ol className="flex flex-col divide-y divide-hairline border-y border-hairline" aria-label="The certificate's items in this example">
        {figure.items.map((it) => (
          <li key={it.code} className="grid grid-cols-[56px_1fr_auto] items-baseline gap-3 py-2">
            <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-amber">{it.code}</span>
            <span className="text-[13px] leading-snug text-body">{it.label}</span>
            <span className="flex items-center gap-2 font-mono text-[12px] tabular-nums text-ink">
              {it.verdict ? <span className={`h-2 w-2 rounded-full ${it.verdict === "below" ? "bg-coral" : "bg-harbor-800"}`} aria-hidden="true" /> : null}
              {it.value}
              {it.verdict ? <span className="sr-only">{it.verdict === "below" ? ", below the base flood elevation" : ", above the base flood elevation"}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <div className="md:col-span-2">
        <FigureTable caption={title} columns={["Item", "Reading", "Value"]} rows={figure.items.map((i) => [i.code, i.label, `${i.value}${i.verdict ? ` (${i.verdict} the BFE)` : ""}`])} />
      </div>
    </div>
  );
}
