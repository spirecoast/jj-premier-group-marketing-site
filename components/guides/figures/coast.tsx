import { useId } from "react";
import type { CoastFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * The coast from the side: the Gulf on the left, higher ground on the right,
 * the big flood drawn as a dashed line across it and storm waves on top of
 * it at the beach. Three houses show how each zone builds: on pilings, on a
 * raised foundation, and on the ground. The drawing is fixed (it shows the
 * idea, not a place); the words come from the guide. Words never sit inside
 * the drawing except the zone letters, so nothing shrinks out of reach on a
 * phone: the line labels and the zone meanings are set below it as text.
 */

const W = 1000;
const H = 400;
const CALM = 300; // the Gulf on an ordinary day
const FLOOD = 228; // the base flood
const VE_END = 300;
const AE_END = 768;

/** The land's top edge, from the sea floor at the left to higher ground at the right. */
const GROUND =
  "M0,362 C70,356 120,338 168,314 C196,300 214,282 238,272 C258,266 272,280 296,286 " +
  "C330,292 362,286 396,288 C408,289 414,318 424,320 L458,320 C468,318 474,290 488,288 " +
  "C540,284 600,276 660,262 C712,250 740,236 768,228 C808,216 846,206 892,200 C940,194 972,192 1000,191";

const COLORS = { VE: "var(--color-coral)", AE: "var(--color-sky-600)", X: "var(--color-success)" } as const;

export function CoastFigureView({ figure, title }: { figure: CoastFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const [ve, ae, x] = figure.zones;
  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden border border-hairline bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="block h-auto w-full">
          <title id={`${id}-t`}>
            {`${title}. ${ve.code}, ${ve.name}: ${ve.means} ${ae.code}, ${ae.name}: ${ae.means} ${x.code}, ${x.name}: ${x.means}`}
          </title>
          <defs>
            <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sky-400)" />
              <stop offset="1" stopColor="var(--color-sky-800)" />
            </linearGradient>
            <linearGradient id={`${id}-flood`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sky-200)" stopOpacity="0.95" />
              <stop offset="1" stopColor="var(--color-sky-300)" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sky-50)" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <rect width={W} height={H} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${id}-clip)`}>
            {/* Sky */}
            <rect width={W} height={H} fill={`url(#${id}-sky)`} />

            {/* The big flood, behind the land: it shows only where the land is lower than the line. */}
            <rect x="0" y={FLOOD} width={W} height={H - FLOOD} fill={`url(#${id}-flood)`} />
            {/* Storm waves on top of the flood at the beach. */}
            <path
              d={`M0,${FLOOD} C20,${FLOOD - 22} 46,${FLOOD - 22} 66,${FLOOD} C86,${FLOOD - 22} 112,${FLOOD - 22} 132,${FLOOD} C152,${FLOOD - 20} 178,${FLOOD - 20} 198,${FLOOD} C214,${FLOOD - 14} 234,${FLOOD - 14} 250,${FLOOD} L250,${FLOOD + 6} L0,${FLOOD + 6} Z`}
              fill="var(--color-sky-200)"
              stroke="var(--color-sky-500)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* The Gulf on a calm day, behind the land: the sea and the canal. */}
            <rect x="0" y={CALM} width={W} height={H - CALM} fill={`url(#${id}-sea)`} />

            {/* The land, in two layers. */}
            <path d={`${GROUND} L${W},${H} L0,${H} Z`} fill="var(--color-linen-300)" />
            <path d={`${GROUND} L${W},${H} L0,${H} Z`} fill="var(--color-linen-400)" transform="translate(0 34)" opacity="0.55" />
            <path d={GROUND} fill="none" stroke="var(--color-linen-600)" strokeWidth="2" />

            {/* VE: a house up on pilings on the dune, its floor above the waves. */}
            <g>
              {[214, 232, 250, 268].map((px) => (
                <line key={px} x1={px} x2={px} y1={196} y2={290} stroke="var(--color-harbor-800)" strokeWidth="4" strokeLinecap="square" />
              ))}
              <line x1="208" x2="274" y1="196" y2="196" stroke="var(--color-harbor-800)" strokeWidth="4" />
              <rect x="210" y="150" width="62" height="46" fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
              <path d="M202,152 L241,120 L280,152 Z" fill="var(--color-navy)" />
              <rect x="222" y="162" width="14" height="12" fill="var(--color-sky-200)" />
              <rect x="246" y="168" width="14" height="28" fill="var(--color-harbor-700)" />
            </g>

            {/* AE: a house raised on a stem wall, its floor just above the flood line. */}
            <g>
              <rect x="526" y="220" width="96" height="66" fill="var(--color-linen-500)" stroke="var(--color-linen-700)" strokeWidth="2" />
              <rect x="530" y="174" width="88" height="46" fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
              <path d="M520,176 L574,140 L628,176 Z" fill="var(--color-navy)" />
              <rect x="542" y="186" width="16" height="12" fill="var(--color-sky-200)" />
              <rect x="566" y="186" width="16" height="12" fill="var(--color-sky-200)" />
              <rect x="592" y="192" width="14" height="28" fill="var(--color-harbor-700)" />
            </g>

            {/* X: a house on the ground, which is higher than the flood. */}
            <g>
              <rect x="862" y="154" width="84" height="46" fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
              <path d="M852,156 L904,120 L956,156 Z" fill="var(--color-navy)" />
              <rect x="874" y="166" width="16" height="12" fill="var(--color-sky-200)" />
              <rect x="914" y="172" width="14" height="28" fill="var(--color-harbor-700)" />
            </g>

            {/* The flood line itself, dashed, across the ground it covers. */}
            <line x1="0" x2={AE_END} y1={FLOOD} y2={FLOOD} stroke="var(--color-coral)" strokeWidth="3" strokeDasharray="12 8" />

            {/* Zone edges. */}
            {[VE_END, AE_END].map((ex) => (
              <line key={ex} x1={ex} x2={ex} y1="56" y2={ex === VE_END ? 286 : 228} stroke="var(--color-graphite-300)" strokeWidth="1.5" strokeDasharray="4 6" />
            ))}

            {/* Zone bands, with the letters. */}
            {[
              { code: ve.code, x0: 0, x1: VE_END, color: COLORS.VE },
              { code: ae.code, x0: VE_END, x1: AE_END, color: COLORS.AE },
              { code: x.code, x0: AE_END, x1: W, color: COLORS.X },
            ].map((b) => (
              <g key={b.code}>
                <rect x={b.x0 + (b.x0 ? 2 : 0)} y="16" width={b.x1 - b.x0 - (b.x0 ? 2 : 0) - (b.x1 < W ? 2 : 0)} height="40" fill={b.color} />
                <text x={(b.x0 + b.x1) / 2} y="44" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="600" letterSpacing="2" fontFamily="var(--font-sans)">
                  {b.code}
                </text>
              </g>
            ))}
          </g>
        </svg>
        <span className="pointer-events-none absolute bottom-[4%] left-[2%] hidden font-mono text-[11px] uppercase tracking-[0.14em] text-white sm:block" aria-hidden="true">
          The Gulf
        </span>
        <span className="pointer-events-none absolute bottom-[4%] right-[2%] hidden font-mono text-[11px] uppercase tracking-[0.14em] text-linen-800 sm:block" aria-hidden="true">
          Higher ground →
        </span>
      </div>

      {/* The two lines, named. */}
      <ul className="flex flex-wrap gap-x-8 gap-y-2" aria-label="What the lines mean">
        <li className="flex items-center gap-3 text-[14px] text-body">
          <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true">
            <line x1="0" x2="34" y1="5" y2="5" stroke="var(--color-coral)" strokeWidth="3" strokeDasharray="8 5" />
          </svg>
          {figure.floodLine}
        </li>
        <li className="flex items-center gap-3 text-[14px] text-body">
          <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true">
            <rect width="34" height="10" fill="var(--color-sky-500)" />
          </svg>
          {figure.calmWater}
        </li>
      </ul>

      {/* The three zones, in the drawing's order. */}
      <ol className="grid gap-4 md:grid-cols-3">
        {figure.zones.map((z, i) => (
          <li key={z.code} className="flex flex-col gap-2 border-t-[3px] bg-white p-4" style={{ borderTopColor: [COLORS.VE, COLORS.AE, COLORS.X][i] }}>
            <p className="flex items-baseline gap-3">
              <span className="font-display text-[28px] font-light leading-none text-navy">{z.code}</span>
              <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite-600">{z.name}</span>
            </p>
            <p className="text-[15px] leading-snug text-body">{z.means}</p>
          </li>
        ))}
      </ol>

      <FigureTable caption={title} columns={["Zone", "Risk", "What it means"]} rows={figure.zones.map((z) => [z.code, z.name, z.means])} />
    </div>
  );
}
