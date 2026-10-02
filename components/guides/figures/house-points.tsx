import { useId } from "react";
import type { HousePoint, HousePointsFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * A house from the side with numbered points on the parts a wind
 * inspection checks. The drawing is fixed (a hip roof, two shuttered
 * windows, a door); each point in the figure names one of its spots and
 * gets the next number. Only the numbers sit inside the drawing. The
 * words are set under it as a numbered list.
 */

const W = 600;
const H = 320;
const EAVE = 156;
const RIDGE = 72;

/** Where each named part sits on the drawing. */
const SPOT: Record<HousePoint, [number, number]> = {
  "roof-cover": [300, 110],
  "roof-deck": [470, 148],
  "roof-wall": [130, 158],
  "roof-shape": [364, 72],
  "water-barrier": [205, 128],
  openings: [406, 207],
};

/** The roof face's left and right edges at a height, for the shingle lines. */
const edge = (y: number) => {
  const t = (EAVE - y) / (EAVE - RIDGE);
  return [104 + t * 132, 496 - t * 132];
};

export function HousePointsView({ figure, title }: { figure: HousePointsFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden border border-hairline bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="block h-auto w-full">
          <title id={`${id}-t`}>{`${title}. ${figure.points.map((p, i) => `${i + 1}, ${p.label}`).join(". ")}.`}</title>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sky-50)" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${id}-sky)`} />
          {/* Ground */}
          <rect x="0" y="272" width={W} height={H - 272} fill="var(--color-linen-300)" />
          <line x1="0" x2={W} y1="272" y2="272" stroke="var(--color-linen-600)" strokeWidth="2" />
          {/* Walls */}
          <rect x="130" y={EAVE} width="340" height={272 - EAVE} fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
          {/* The hip roof, seen from the front */}
          <path d={`M104,${EAVE} L236,${RIDGE} L364,${RIDGE} L496,${EAVE} Z`} fill="var(--color-navy)" />
          {[96, 118, 140].map((y) => {
            const [l, r] = edge(y);
            return <line key={y} x1={l} x2={r} y1={y} y2={y} stroke="var(--color-sky-200)" strokeWidth="1.5" opacity="0.6" />;
          })}
          <line x1="100" x2="500" y1={EAVE} y2={EAVE} stroke="var(--color-harbor-800)" strokeWidth="4" />
          {/* Windows, with shutters beside them */}
          {[168, 380].map((x) => (
            <g key={x}>
              <rect x={x - 14} y="184" width="10" height="46" fill="var(--color-harbor-700)" />
              <rect x={x + 56} y="184" width="10" height="46" fill="var(--color-harbor-700)" />
              <rect x={x} y="186" width="52" height="42" fill="var(--color-sky-200)" stroke="var(--color-harbor-800)" strokeWidth="2" />
              <line x1={x + 26} x2={x + 26} y1="186" y2="228" stroke="var(--color-harbor-800)" strokeWidth="1.5" />
            </g>
          ))}
          {/* Door */}
          <rect x="278" y="206" width="44" height="66" fill="var(--color-harbor-700)" />
          {/* The numbered points */}
          {figure.points.map((p, i) => {
            const [cx, cy] = SPOT[p.at];
            return (
              <g key={p.at}>
                <circle cx={cx} cy={cy} r="17" fill="var(--color-coral)" stroke="#ffffff" strokeWidth="2.5" />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {figure.points.map((p, i) => (
          <li key={p.at} className="grid grid-cols-[28px_1fr] gap-x-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral font-sans text-[13px] font-semibold text-white" aria-hidden="true">
              {i + 1}
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-[15px] font-medium leading-snug text-ink">{p.label}</span>
              <span className="text-[13.5px] leading-snug text-body-muted">{p.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <FigureTable caption={title} columns={["Number", "Part of the house", "What the inspector checks"]} rows={figure.points.map((p, i) => [i + 1, p.label, p.detail])} />
    </div>
  );
}
