import { useId } from "react";
import type { PartsFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * A building seen from the front, with a numbered mark on each of the parts
 * the guide lists under it: the roof, the structure, the fire riser, the
 * plumbing stack, the electrical run, the waterproofed outside wall and the
 * windows and door. The drawing is fixed (it shows the idea, not a real
 * building); the words come from the guide. The numbered marks are HTML
 * laid over the drawing at percentage positions, so they keep their size on
 * a phone, and the list under the drawing carries every word.
 */

const W = 1000;
const H = 560;
const GROUND = 500;
const LEFT = 300;
const RIGHT = 700;
const TOP = 134;

/** Where each mark sits, in drawing units, in the order of the guide's items. */
const MARKS: [number, number][] = [
  [500, 100], // 1 the roof
  [318, 330], // 2 the structure (the left column)
  [500, 258], // 3 fire protection (the riser)
  [660, 392], // 4 plumbing (the stack)
  [340, 212], // 5 electrical (the run and panel)
  [760, 200], // 6 waterproofing and paint (the outside wall)
  [500, 468], // 7 windows and doors
];

const FLOORS = [150, 242, 334, 426]; // the top of each row of windows, top floor first
const WINDOW_X = [352, 426, 530, 604];

export function PartsView({ figure, title }: { figure: PartsFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden border border-hairline bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="block h-auto w-full">
          <title id={`${id}-t`}>{`${title}. ${figure.items.map((it, i) => `${i + 1}, ${it.label}`).join(". ")}`}</title>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sky-50)" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Sky and ground */}
          <rect width={W} height={H} fill={`url(#${id}-sky)`} />
          <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="var(--color-linen-300)" />
          <line x1="0" x2={W} y1={GROUND} y2={GROUND} stroke="var(--color-linen-600)" strokeWidth="2" />

          {/* The building */}
          <rect x={LEFT} y={TOP} width={RIGHT - LEFT} height={GROUND - TOP} fill="#ffffff" stroke="var(--color-harbor-800)" strokeWidth="2" />
          {/* The waterproofed, painted outside wall, seen edge-on at the right */}
          <rect x={RIGHT} y={TOP} width="18" height={GROUND - TOP} fill="var(--color-sky-300)" opacity="0.7" />
          <rect x={RIGHT + 18} y={TOP} width="6" height={GROUND - TOP} fill="var(--color-harbor-800)" opacity="0.35" />
          {/* The roof: a parapet and a rooftop unit */}
          <rect x={LEFT - 10} y={TOP - 22} width={RIGHT - LEFT + 44} height="22" fill="var(--color-navy)" />
          <rect x="560" y={TOP - 42} width="50" height="20" fill="var(--color-harbor-700)" />
          {/* Floor slabs */}
          {[222, 314, 406].map((y) => (
            <line key={y} x1={LEFT + 2} x2={RIGHT - 2} y1={y} y2={y} stroke="var(--color-linen-500)" strokeWidth="2" />
          ))}
          {/* The structure: a column at each side */}
          <rect x="312" y={TOP + 2} width="12" height={GROUND - TOP - 2} fill="var(--color-linen-500)" stroke="var(--color-linen-700)" strokeWidth="1" />
          <rect x="676" y={TOP + 2} width="12" height={GROUND - TOP - 2} fill="var(--color-linen-500)" stroke="var(--color-linen-700)" strokeWidth="1" />
          {/* Windows: four on each upper floor, two on the ground floor beside the door */}
          {FLOORS.map((y, f) =>
            WINDOW_X.filter((x) => f < FLOORS.length - 1 || x === WINDOW_X[0] || x === WINDOW_X[3]).map((x) => (
              <rect key={`${y}-${x}`} x={x} y={y} width="44" height="52" fill="var(--color-sky-200)" stroke="var(--color-harbor-800)" strokeWidth="1.5" />
            )),
          )}
          {/* The door */}
          <rect x="478" y="426" width="44" height="74" fill="var(--color-harbor-700)" stroke="var(--color-harbor-800)" strokeWidth="1.5" />
          {/* The electrical run and its panel, at the left */}
          <line x1="340" x2="340" y1={TOP + 2} y2={GROUND} stroke="var(--color-amber)" strokeWidth="4" />
          <rect x="332" y="372" width="16" height="30" fill="var(--color-amber)" />
          {/* The fire riser, up the middle, with a sprinkler head on each floor */}
          <line x1="500" x2="500" y1={TOP + 2} y2="426" stroke="var(--color-coral)" strokeWidth="5" />
          {[160, 252, 344].map((y) => (
            <g key={y}>
              <line x1="500" x2="522" y1={y} y2={y} stroke="var(--color-coral)" strokeWidth="3" />
              <circle cx="522" cy={y} r="5" fill="var(--color-coral)" />
            </g>
          ))}
          {/* The plumbing stack, at the right, with a branch on each floor */}
          <line x1="660" x2="660" y1={TOP + 2} y2={GROUND} stroke="var(--color-sky-600)" strokeWidth="5" />
          {[206, 298, 390, 482].map((y) => (
            <line key={y} x1="660" x2="640" y1={y} y2={y} stroke="var(--color-sky-600)" strokeWidth="3" />
          ))}
          {/* A paint roller, for the outside wall */}
          <rect x="744" y="150" width="46" height="18" rx="4" fill="var(--color-navy)" />
          <line x1="767" x2="767" y1="168" y2="186" stroke="var(--color-harbor-800)" strokeWidth="3" />
          <line x1="767" x2="790" y1="186" y2="186" stroke="var(--color-harbor-800)" strokeWidth="3" />
        </svg>

        {/* The numbered marks, as HTML so they keep their size on a phone */}
        {figure.items.slice(0, MARKS.length).map((it, i) => {
          const [x, y] = MARKS[i];
          return (
            <span
              key={it.label}
              aria-hidden="true"
              className="pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-navy font-mono text-[12px] font-medium text-white shadow-sm"
              style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
            >
              {i + 1}
            </span>
          );
        })}
      </div>

      {/* The parts, numbered to match the drawing */}
      <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {figure.items.map((it, i) => (
          <li key={it.label} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-[12px] font-medium text-white" aria-hidden="true">
              {i + 1}
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-[15px] font-medium leading-snug text-ink">{it.label}</span>
              {it.means ? <span className="text-[13.5px] leading-snug text-body-muted">{it.means}</span> : null}
            </span>
          </li>
        ))}
      </ol>

      <FigureTable caption={title} columns={["Number", "Part", "What it means"]} rows={figure.items.map((it, i) => [i + 1, it.label, it.means ?? ""])} />
    </div>
  );
}
