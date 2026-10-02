import { useId, type ReactNode } from "react";
import type { SketchFigure } from "@/lib/guides/types";
import { FigureTable } from "./shared";

/**
 * A fixed drawing of a place or a thing, with numbered marks on it. The
 * drawing is part of the scene (the islands from above, the roads, a house
 * from the side, a seawall in section); the words come from the guide, and
 * they sit under the drawing as text, one entry per mark, so nothing shrinks
 * out of reach on a phone. The marks are HTML set over the drawing at
 * percentage positions, so they keep their size at every width. Shapes
 * only: the one piece of text inside a drawing is the number in a mark.
 */

type Scene = {
  w: number;
  h: number;
  /** Where each mark sits, in viewBox units, in the order the guide lists them. */
  marks: [number, number][];
  /** Small labels set over the drawing's corners, hidden on phones. */
  corners?: { tl?: string; bl?: string; br?: string; tr?: string };
  draw: (id: string) => ReactNode;
};

const C = {
  navy: "var(--color-navy)",
  harbor: "var(--color-harbor-800)",
  harbor7: "var(--color-harbor-700)",
  harbor6: "var(--color-harbor-600)",
  harbor3: "var(--color-harbor-300)",
  coral: "var(--color-coral)",
  sky1: "var(--color-sky-100)",
  sky2: "var(--color-sky-200)",
  sky3: "var(--color-sky-300)",
  sky5: "var(--color-sky-500)",
  sky6: "var(--color-sky-600)",
  sky7: "var(--color-sky-700)",
  linen2: "var(--color-linen-200)",
  linen3: "var(--color-linen-300)",
  linen4: "var(--color-linen-400)",
  linen5: "var(--color-linen-500)",
  linen6: "var(--color-linen-600)",
  linen7: "var(--color-linen-700)",
  g2: "var(--color-graphite-200)",
  g3: "var(--color-graphite-300)",
  g4: "var(--color-graphite-400)",
  g5: "var(--color-graphite-500)",
  success: "var(--color-success)",
  white: "#ffffff",
} as const;

/* ---- The islands and the mainland, shared by the two map scenes ---------- */

/** The mainland's west edge, from the north shore to the bottom of the scene, then closed to the right. */
const MAINLAND = "M470,112 C520,104 560,118 586,150 C600,176 584,206 604,236 C628,272 652,290 664,318 C682,360 652,392 672,430 C690,466 724,486 730,520 C736,560 694,588 706,626 C716,656 748,676 748,720 L1000,720 L1000,100 C940,96 900,112 860,106 C800,96 740,112 690,104 C640,96 580,102 520,108 Z";

const ISLANDS = {
  ami: "M150,40 C190,30 220,60 235,110 C250,160 275,200 300,235 C310,260 290,275 270,262 C240,240 205,195 180,140 C160,100 135,60 150,40 Z",
  lbk: "M300,282 C330,270 350,300 380,340 C420,390 470,440 520,490 C535,505 520,520 505,512 C455,470 400,420 350,370 C320,340 290,300 300,282 Z",
  lido: "M545,525 C575,510 620,530 630,565 C635,600 600,615 570,605 C545,595 530,560 545,525 Z",
  siesta: "M600,612 C640,600 680,620 700,650 C720,680 710,705 690,700 C650,690 615,665 598,640 Z",
} as const;

function Land({ muted = false }: { muted?: boolean }) {
  const fill = muted ? C.linen2 : C.linen3;
  const stroke = muted ? C.linen5 : C.linen7;
  return (
    <g>
      <path d={MAINLAND} fill={fill} stroke={stroke} strokeWidth="2" />
      {Object.values(ISLANDS).map((d) => (
        <path key={d} d={d} fill={muted ? C.linen2 : C.linen4} stroke={stroke} strokeWidth="2" />
      ))}
      <circle cx="668" cy="548" r="20" fill={muted ? C.linen2 : C.linen4} stroke={stroke} strokeWidth="2" />
    </g>
  );
}

/** The bridges: two to Anna Maria Island, the pass bridges, the causeway and the two to Siesta Key. */
function Bridges({ color = C.harbor, width = 4 }: { color?: string; width?: number }) {
  const s = { stroke: color, strokeWidth: width, strokeLinecap: "square" as const, fill: "none" };
  return (
    <g {...s}>
      <path d="M244,120 L586,150" />
      <path d="M296,206 L604,236" />
      <path d="M292,262 L304,284" />
      <path d="M518,508 L548,526" />
      <path d="M706,462 L684,534 L632,560" />
      <path d="M700,604 L640,626" />
      <path d="M746,672 L700,688" />
    </g>
  );
}

function Water({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.sky3} />
          <stop offset="1" stopColor={C.sky1} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-sea)`} />
    </>
  );
}

/* ---- Scene: the islands from above ---------------------------------------- */

const islands: Scene = {
  w: 1000,
  h: 720,
  marks: [
    [182, 84],
    [446, 444],
    [588, 572],
    [662, 664],
    [870, 400],
  ],
  corners: { tl: "North", bl: "The Gulf", br: "The mainland" },
  draw: (id) => (
    <>
      <Water id={id} w={1000} h={720} />
      <Land />
      {/* The county line, Manatee above and Sarasota below. */}
      <line x1="0" x2="1000" y1="400" y2="400" stroke={C.coral} strokeWidth="3" strokeDasharray="14 10" />
      {/* The three city lines on Anna Maria Island. */}
      <line x1="150" x2="245" y1="104" y2="94" stroke={C.harbor} strokeWidth="2" strokeDasharray="5 5" />
      <line x1="210" x2="300" y1="192" y2="178" stroke={C.harbor} strokeWidth="2" strokeDasharray="5 5" />
      <Bridges />
      {/* The two cities on the mainland. */}
      <rect x="790" y="150" width="22" height="22" fill={C.navy} />
      <rect x="840" y="548" width="22" height="22" fill={C.navy} />
    </>
  ),
};

/* ---- Scene: the roads, from the Skyway to the islands ---------------------- */

const corridor: Scene = {
  w: 1000,
  h: 720,
  marks: [
    [300, 74],
    [826, 262],
    [700, 332],
    [742, 446],
    [916, 442],
    [420, 180],
  ],
  corners: { tl: "North", bl: "The Gulf", tr: "Inland" },
  draw: (id) => (
    <>
      <Water id={id} w={1000} h={720} />
      {/* Pinellas, across the mouth of Tampa Bay. */}
      <path d="M0,0 L190,0 C186,34 160,62 118,74 C80,84 40,80 0,70 Z" fill={C.linen2} stroke={C.linen5} strokeWidth="2" />
      <Land muted />
      {/* Lakewood Ranch, east of the interstate, on both sides of the county line. */}
      <rect x="852" y="330" width="128" height="140" fill={C.linen4} stroke={C.linen7} strokeWidth="2" />
      {/* The county line. */}
      <line x1="0" x2="1000" y1="400" y2="400" stroke={C.coral} strokeWidth="3" strokeDasharray="14 10" />
      {/* The Skyway, from Pinellas to Manatee County. */}
      <path d="M150,54 C220,70 320,96 470,118" fill="none" stroke={C.harbor} strokeWidth="6" strokeLinecap="round" />
      {/* The interstate, inland. */}
      <path d="M814,100 C820,260 822,460 828,720" fill="none" stroke={C.harbor} strokeWidth="7" strokeLinecap="round" />
      {/* The Trail, along the bay. */}
      <path d="M560,116 C600,170 640,210 650,260 C664,330 690,390 720,440 C750,490 786,540 790,600 C794,650 806,690 810,720" fill="none" stroke={C.harbor6} strokeWidth="4" strokeLinecap="round" />
      <Bridges color={C.harbor7} width={4} />
      {/* The airport: two crossing runways between the cities. */}
      <g transform="translate(742 446)">
        <rect x="-34" y="-5" width="68" height="10" fill={C.g5} transform="rotate(-30)" />
        <rect x="-26" y="-5" width="52" height="10" fill={C.g5} transform="rotate(50)" />
      </g>
      {/* The two cities, and the Ranch's town center. */}
      <rect x="636" y="196" width="22" height="22" fill={C.navy} />
      <rect x="770" y="552" width="22" height="22" fill={C.navy} />
      <rect x="900" y="372" width="22" height="22" fill={C.navy} />
    </>
  ),
};

/* ---- Scene: a house from the side ------------------------------------------ */

const house: Scene = {
  w: 1000,
  h: 520,
  marks: [
    [500, 196],
    [302, 254],
    [670, 302],
    [236, 324],
    [770, 392],
    [858, 364],
    [160, 432],
  ],
  draw: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-sky-50)" />
          <stop offset="1" stopColor={C.white} />
        </linearGradient>
      </defs>
      <rect width="1000" height="520" fill={`url(#${id}-sky)`} />
      {/* The ground, sloping gently away from the house on both sides. */}
      <path d="M0,436 C120,430 200,418 250,412 L750,412 C800,418 880,430 1000,436 L1000,520 L0,520 Z" fill={C.linen3} />
      <path d="M0,436 C120,430 200,418 250,412 L750,412 C800,418 880,430 1000,436" fill="none" stroke={C.linen6} strokeWidth="2" />
      {/* The slab. */}
      <rect x="246" y="398" width="508" height="14" fill={C.linen6} />
      {/* The walls. */}
      <rect x="260" y="252" width="480" height="146" fill={C.white} stroke={C.harbor} strokeWidth="2.5" />
      {/* The roof, a hip, with the covering drawn as courses. */}
      <path d="M226,254 L360,158 L640,158 L774,254 Z" fill={C.navy} />
      {[182, 206, 230].map((y) => {
        const t = (y - 158) / (254 - 158);
        const x0 = 360 - t * 134;
        const x1 = 640 + t * 134;
        return <line key={y} x1={x0} x2={x1} y1={y} y2={y} stroke={C.harbor6} strokeWidth="1.5" />;
      })}
      {/* The straps where the roof meets the walls. */}
      {[270, 720].map((x) => (
        <rect key={x} x={x} y="246" width="10" height="16" fill={C.coral} />
      ))}
      {/* Windows and the door. */}
      <rect x="300" y="282" width="60" height="44" fill={C.sky2} stroke={C.harbor} strokeWidth="2" />
      <rect x="640" y="282" width="60" height="44" fill={C.sky2} stroke={C.harbor} strokeWidth="2" />
      <rect x="478" y="312" width="52" height="86" fill={C.harbor7} />
      {/* The meter and the panel, outside the left wall. */}
      <circle cx="240" cy="298" r="9" fill={C.white} stroke={C.g5} strokeWidth="2" />
      <rect x="230" y="312" width="20" height="30" fill={C.g3} stroke={C.g5} strokeWidth="1.5" />
      {/* The water line, out of the ground and into the wall. */}
      <path d="M770,520 L770,386 L740,386" fill="none" stroke={C.sky7} strokeWidth="4" />
      {/* The air conditioner on its pad. */}
      <rect x="788" y="404" width="68" height="8" fill={C.linen6} />
      <rect x="792" y="350" width="60" height="54" fill={C.g2} stroke={C.g5} strokeWidth="2" />
      <circle cx="822" cy="376" r="16" fill="none" stroke={C.g5} strokeWidth="2" />
    </>
  ),
};

/* ---- Scene: a seawall in section ------------------------------------------- */

const seawall: Scene = {
  w: 1000,
  h: 480,
  marks: [
    [520, 161],
    [520, 330],
    [770, 200],
    [466, 404],
    [370, 135],
    [360, 346],
  ],
  corners: { bl: "The canal", br: "The yard" },
  draw: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-deep`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.sky3} />
          <stop offset="1" stopColor={C.sky7} />
        </linearGradient>
        <linearGradient id={`${id}-air`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-sky-50)" />
          <stop offset="1" stopColor={C.white} />
        </linearGradient>
      </defs>
      <rect width="1000" height="480" fill={`url(#${id}-air)`} />
      {/* The water, from high tide down. */}
      <rect x="0" y="240" width="520" height="240" fill={`url(#${id}-deep)`} />
      {/* The canal floor, rising to the toe of the wall. */}
      <path d="M0,430 C200,424 380,396 520,356 L520,480 L0,480 Z" fill={C.linen4} />
      {/* The yard. */}
      <rect x="535" y="175" width="465" height="305" fill={C.linen3} />
      <line x1="535" x2="1000" y1="175" y2="175" stroke={C.success} strokeWidth="4" />
      {/* The deadman, buried in the yard, and the rod from the cap. */}
      <rect x="754" y="178" width="32" height="48" fill={C.g5} />
      <line x1="544" x2="756" y1="162" y2="200" stroke={C.harbor} strokeWidth="4" />
      {/* The panels, interlocked, from below the floor to the cap. */}
      <rect x="505" y="172" width="30" height="236" fill={C.g3} stroke={C.g5} strokeWidth="2" />
      {[515, 525].map((x) => (
        <line key={x} x1={x} x2={x} y1="172" y2="408" stroke={C.g5} strokeWidth="1.5" />
      ))}
      <circle cx="520" cy="265" r="5" fill={C.white} stroke={C.g5} strokeWidth="1.5" />
      {/* The cap. */}
      <rect x="495" y="150" width="50" height="24" fill={C.g5} />
      {/* The dock, on pilings, from the yard out over the water. */}
      {[300, 420].map((x) => (
        <line key={x} x1={x} x2={x} y1="140" y2="420" stroke={C.harbor} strokeWidth="7" strokeLinecap="square" />
      ))}
      <rect x="240" y="128" width="262" height="14" fill={C.harbor7} />
      {/* High tide, solid; low tide, dashed. */}
      <line x1="0" x2="505" y1="240" y2="240" stroke={C.sky6} strokeWidth="3" />
      <line x1="0" x2="505" y1="290" y2="290" stroke={C.coral} strokeWidth="3" strokeDasharray="10 7" />
      {/* The depth at low tide, from the dashed line to the floor. */}
      <line x1="360" x2="360" y1="290" y2="400" stroke={C.coral} strokeWidth="3" />
      <path d="M352,298 L360,290 L368,298 M352,392 L360,400 L368,392" fill="none" stroke={C.coral} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

const SCENES: Record<SketchFigure["scene"], Scene> = { islands, corridor, house, seawall };

export function SketchView({ figure, title }: { figure: SketchFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const scene = SCENES[figure.scene];
  const marks = figure.marks.slice(0, scene.marks.length);
  const corner = "pointer-events-none absolute hidden font-mono text-[11px] uppercase tracking-[0.14em] text-graphite-600 sm:block";
  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden border border-hairline bg-white">
        <svg viewBox={`0 0 ${scene.w} ${scene.h}`} role="img" aria-labelledby={`${id}-t`} className="block h-auto w-full">
          <title id={`${id}-t`}>{`${title}. ${marks.map((m) => `${m.code}, ${m.name}: ${m.body}`).join(" ")}`}</title>
          {scene.draw(id)}
        </svg>
        {marks.map((m, i) => {
          const [x, y] = scene.marks[i];
          return (
            <span
              key={m.code}
              aria-hidden="true"
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy font-mono text-[12px] font-medium text-white ring-2 ring-white"
              style={{ left: `${(x / scene.w) * 100}%`, top: `${(y / scene.h) * 100}%` }}
            >
              {m.code}
            </span>
          );
        })}
        {scene.corners?.tl ? <span className={`${corner} left-[2%] top-[3%]`} aria-hidden="true">{scene.corners.tl}</span> : null}
        {scene.corners?.tr ? <span className={`${corner} right-[2%] top-[3%]`} aria-hidden="true">{scene.corners.tr}</span> : null}
        {scene.corners?.bl ? <span className={`${corner} bottom-[3%] left-[2%]`} aria-hidden="true">{scene.corners.bl}</span> : null}
        {scene.corners?.br ? <span className={`${corner} bottom-[3%] right-[2%]`} aria-hidden="true">{scene.corners.br}</span> : null}
      </div>

      {/* The marks, in order, as text. */}
      <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {marks.map((m) => (
          <li key={m.code} className="grid grid-cols-[28px_1fr] gap-x-3 border-t border-hairline pt-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy font-mono text-[12px] font-medium text-white" aria-hidden="true">
              {m.code}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium leading-snug text-ink">
                <span className="sr-only">{m.code}. </span>
                {m.name}
              </span>
              <span className="text-[14px] leading-snug text-body-muted">{m.body}</span>
            </div>
          </li>
        ))}
      </ol>

      <FigureTable caption={title} columns={["Mark", "What it is", "What to know"]} rows={marks.map((m) => [m.code, m.name, m.body])} />
    </div>
  );
}
