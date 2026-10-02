import { useId } from "react";
import type { TwoHouse, TwoHousesFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * Two houses on one street, drawn to one scale against one flood line. The
 * higher floor clears the dashed line; the lower one sits under it, and the
 * flood water is drawn over that house so you can see it would come inside.
 * Heights come from the figure; the drawing turns feet into SVG units, and
 * every word sits under the drawing as text so it reads on a phone.
 */

const PANEL_W = 300;
const PANEL_H = 250;
const BOTTOM_FT = 6; // the panel's lowest foot
const PX_PER_FT = 22;
const y = (ft: number) => PANEL_H - 14 - (ft - BOTTOM_FT) * PX_PER_FT;

function Panel({ house, floodLine, id }: { house: TwoHouse; floodLine: number; id: string }) {
  const above = house.verdict === "above";
  // A raised house stands on a foundation from the ground to its floor; a low one sits on a slab at the ground.
  const ground = above ? house.floor - 3.5 : house.floor - 0.2;
  const floorY = y(house.floor);
  const groundY = y(ground);
  const floodY = y(floodLine);
  const wallH = 52;
  const x0 = 78;
  const w = 150;
  const floorColor = above ? "var(--color-success)" : "var(--color-danger)";
  return (
    <svg viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} className="block h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-sky-50)" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width={PANEL_W} height={PANEL_H} fill={`url(#${id}-sky)`} />
      {/* Ground */}
      <rect x="0" y={groundY} width={PANEL_W} height={PANEL_H - groundY} fill="var(--color-linen-300)" />
      <line x1="0" x2={PANEL_W} y1={groundY} y2={groundY} stroke="var(--color-linen-600)" strokeWidth="2" />
      {/* Foundation, for the raised house */}
      {above ? <rect x={x0 + 6} y={floorY} width={w - 12} height={groundY - floorY} fill="var(--color-linen-500)" stroke="var(--color-linen-700)" strokeWidth="2" /> : null}
      {/* The house */}
      <rect x={x0} y={floorY - wallH} width={w} height={wallH} fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
      <path d={`M${x0 - 12},${floorY - wallH + 2} L${x0 + w / 2},${floorY - wallH - 36} L${x0 + w + 12},${floorY - wallH + 2} Z`} fill="var(--color-navy)" />
      <rect x={x0 + 18} y={floorY - wallH + 12} width="22" height="16" fill="var(--color-sky-200)" />
      <rect x={x0 + 52} y={floorY - wallH + 12} width="22" height="16" fill="var(--color-sky-200)" />
      <rect x={x0 + w - 40} y={floorY - 34} width="20" height="34" fill="var(--color-harbor-700)" />
      {/* The flood water, drawn over the house so a low floor shows water inside */}
      {floodY < groundY ? <rect x="0" y={floodY} width={PANEL_W} height={groundY - floodY} fill="var(--color-sky-300)" opacity="0.55" /> : null}
      {/* The floor, in its verdict color */}
      <line x1={x0 - 22} x2={x0 + w + 22} y1={floorY} y2={floorY} stroke={floorColor} strokeWidth="4" />
      {/* The flood line */}
      <line x1="0" x2={PANEL_W} y1={floodY} y2={floodY} stroke="var(--color-coral)" strokeWidth="3" strokeDasharray="10 7" />
    </svg>
  );
}

export function TwoHousesView({ figure, title }: { figure: TwoHousesFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const ft = (n: number) => `${n} ft`;
  return (
    <div className="flex flex-col gap-5">
      <ol className="grid grid-cols-2 gap-3 md:gap-6">
        {figure.houses.map((h, i) => {
          const diff = Math.abs(h.floor - figure.floodLine);
          const above = h.verdict === "above";
          return (
            <li key={h.name} className="flex min-w-0 flex-col gap-3">
              <div className="overflow-hidden border border-hairline bg-white">
                <Panel house={h} floodLine={figure.floodLine} id={`${id}-${i}`} />
              </div>
              <p className="t-h4 text-navy">{h.name}</p>
              <dl className="flex flex-col gap-1.5 text-[13px] text-body sm:text-[14px]">
                <div className="flex items-center gap-2.5">
                  <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden="true" className="shrink-0">
                    <line x1="0" x2="26" y1="4" y2="4" stroke="var(--color-coral)" strokeWidth="3" strokeDasharray="7 4" />
                  </svg>
                  <dt className="min-w-0 leading-tight">{figure.floodLabel}</dt>
                  <dd className="ml-auto whitespace-nowrap font-medium tabular-nums text-ink">{ft(figure.floodLine)}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden="true" className="shrink-0">
                    <line x1="0" x2="26" y1="4" y2="4" stroke={above ? "var(--color-success)" : "var(--color-danger)"} strokeWidth="4" />
                  </svg>
                  <dt className="min-w-0 leading-tight">{figure.floorLabel}</dt>
                  <dd className="ml-auto whitespace-nowrap font-medium tabular-nums text-ink">{ft(h.floor)}</dd>
                </div>
              </dl>
              <p
                className="self-start px-2.5 py-1 text-[13px] font-medium"
                style={{ background: above ? "var(--color-success-fill)" : "var(--color-danger-fill)", color: above ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {diff} {diff === 1 ? "foot" : "feet"} {above ? "above" : "below"} the flood height
              </p>
              <p className="text-[15px] leading-snug text-body">{h.says}</p>
            </li>
          );
        })}
      </ol>
      <FigureTable
        caption={title}
        columns={["House", figure.floodLabel, figure.floorLabel, "What it means"]}
        rows={figure.houses.map((h) => [h.name, ft(figure.floodLine), ft(h.floor), h.says])}
      />
    </div>
  );
}
