import { useId, type ReactNode } from "react";
import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three product emblems. Tide is a disc with the water cut through it.
 * Atlas is a folded street map with a pin on its middle panel: finding your
 * place. Encore is a ticket stub with a star: one ticket for a play, a
 * concert or an opening.
 * Each is one solid shape with the details cut out, so it reads at 16px and
 * on any ground. The colour is the family accent unless `ink` asks for the
 * darker shade a light ground needs.
 */
type Family = ProductFamily["key"];

function wave(y: number, a: number) {
  let d = `M0 ${y}`;
  for (let x = 2; x <= 64; x += 2) d += ` L${x} ${(y + a * Math.sin((x / 32) * Math.PI * 2)).toFixed(2)}`;
  return d;
}
function star5(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const t = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(t)).toFixed(2)} ${(cy + rr * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/** The ticket leans a little, like one held up at the door. */
const TICKET_TILT = "rotate(-14 32 32) translate(32 32) scale(0.94) translate(-32 -32)";
const STAR = star5(24.5, 32.6, 10.5);

/** Per family: the solid shape, and what the mask cuts from it (black) or keeps back (white). */
const GEOMETRY: Record<Family, { shape: ReactNode; cut: ReactNode }> = {
  tide: {
    shape: <circle cx="32" cy="32" r="30" />,
    cut: (
      <>
        <path d={wave(33, 2.6)} stroke="#000" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d={wave(42.5, 2.6)} stroke="#000" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <path d={wave(51, 2.6)} stroke="#000" strokeWidth={1.9} strokeLinecap="round" fill="none" />
      </>
    ),
  },
  atlas: {
    shape: <path d="M4 13 L22 7 L42 13 L60 7 L60 51 L42 57 L22 51 L4 57 Z" strokeLinejoin="round" />,
    cut: (
      <>
        <path d="M22 7 L22 51 M42 13 L42 57" stroke="#000" strokeWidth={2} fill="none" />
        <path d="M32 43 C29.4 39.4 24.6 33.6 24.6 27.6 A7.4 7.4 0 0 1 39.4 27.6 C39.4 33.6 34.6 39.4 32 43 Z" fill="#000" />
        <circle cx="32" cy="27.6" r="2.7" fill="#fff" />
      </>
    ),
  },
  encore: {
    shape: (
      <path
        transform={TICKET_TILT}
        d="M8 14 H56 Q60 14 60 18 V27 A5 5 0 0 0 60 37 V46 Q60 50 56 50 H8 Q4 50 4 46 V37 A5 5 0 0 0 4 27 V18 Q4 14 8 14 Z"
      />
    ),
    cut: (
      <g transform={TICKET_TILT}>
        <path d="M45 18.5 L45 45.5" stroke="#000" strokeWidth={2.2} strokeDasharray="2.6 3.1" strokeLinecap="round" />
        <path d={STAR} fill="#000" stroke="#000" strokeWidth={1} strokeLinejoin="round" />
      </g>
    ),
  },
};

export function Emblem({ family, ink, className, title }: { family: Family; ink?: boolean; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const g = GEOMETRY[family];
  const color = `var(--color-${family}${ink ? "-ink" : ""})`;
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <defs>
        <mask id={`${id}-m`}>
          <rect width="64" height="64" fill="#fff" />
          {g.cut}
        </mask>
      </defs>
      <g fill={color} mask={`url(#${id}-m)`}>
        {g.shape}
      </g>
    </svg>
  );
}

/* ---- The lockup: one drawing, then JJ Premier Group under it. ---------- */

/** Drawn at the display face's 132-unit size: baseline at 104, caps from about 14. */
const H = 136;
const BASE = 104;
const SIZE = 132;
/** The emblem stands as tall as the capitals and a little more, centred on them. */
const EMBLEM = 100;
const EMBLEM_Y = 9;
const GAP = 30;
const WORD_GAP = 34;

/** Each family's name, a little wide, the way Tide has always been set. Widths are the display face's, measured. */
const WORD: Record<Family, { text: string; w: number }> = {
  tide: { text: "Tide", w: 292 },
  atlas: { text: "Atlas", w: 318 },
  encore: { text: "Encore", w: 449 },
};
/** The products' names at their natural width in the display face. */
const PRODUCT_W: Record<string, number> = {
  "Market Report": 836,
  Street: 332,
  "Sale Calculator": 850,
  Neighborhoods: 881,
  Match: 373,
  Move: 331,
  "Arts Calendar": 790,
  Planner: 440,
};

/**
 * Where each family's name turns to its colour. Tide's turns at a waterline,
 * with two fainter swells under it. Atlas and Encore turn along a straight
 * line through the lower part of the letters, with no line drawn.
 */
const SPLIT = 74;
function waterline(w: number): string {
  let d = "";
  for (let x = 0; x <= w; x += 3) d += `${x ? "L" : "M"}${x} ${(80 - 6 * Math.sin((x / 150) * Math.PI * 2)).toFixed(2)}`;
  return d;
}
function split(family: Family, w: number): string {
  return family === "tide" ? waterline(w) : `M0 ${SPLIT} L${w} ${SPLIT}`;
}

type LockupSize = "bar" | "sm" | "md" | "hero" | "xl";
/** The drawing's height, and the byline's size and tracking (em) at each breakpoint. */
/**
 * Per size: the drawing's height; the byline's size, tracking (em) and its
 * spacing, set as --by-top (from the drawing's foot) and --by-gap (between
 * "by" and JJ). The spacing was measured on the letters at each breakpoint so
 * the name's foot to the "b" and the "y" to JJ's capitals are the same distance.
 */
const SIZES: Record<LockupSize, { wrap: string; svg: string; by: string; space: string; track: number; lines: number }> = {
  bar: { wrap: "", svg: "h-[26px] sm:h-[28px]", by: "", space: "", track: 0, lines: 2.4 },
  sm: { wrap: "", svg: "h-[30px]", by: "text-[7px]", space: "[--by-top:1.2em] [--by-gap:0.83em]", track: 0.24, lines: 2 },
  md: { wrap: "", svg: "h-[40px] sm:h-[48px]", by: "text-[8px] sm:text-[9px]", space: "[--by-top:0.2em] [--by-gap:0.8em]", track: 0.28, lines: 1.5 },
  hero: {
    wrap: "",
    svg: "h-[34px] sm:h-[42px] lg:h-[54px]",
    by: "text-[7px] sm:text-[8.5px] lg:text-[10.5px]",
    space: "[--by-top:-0.1em] [--by-gap:0.58em] sm:[--by-top:-0.12em] sm:[--by-gap:0.77em] lg:[--by-top:-0.18em] lg:[--by-gap:0.83em]",
    track: 0.3,
    lines: 1.2,
  },
  xl: { wrap: "w-full sm:w-auto", svg: "w-full sm:w-auto sm:h-[64px] lg:h-[92px]", by: "text-[8px] sm:text-[10px] lg:text-[13px]", space: "[--by-top:-0.18em] [--by-gap:0.83em]", track: 0.34, lines: 1 },
};

/**
 * A product's lockup, the same on every page: the emblem, the family's name
 * in its colour, and the product's name, drawn as one piece; then "by JJ
 * Premier Group" in the team's own lettering, centred under the words between
 * two equal rules. Without `product` it's the family alone. `tone` is the ground: dark
 * for a photograph or a family colour, light for the page.
 */
export function ProductLockup({
  family,
  product,
  tone = "dark",
  size = "hero",
  byline = true,
  decorative,
  className,
}: {
  family: Family;
  /** The product's full name, e.g. "Tide Street". */
  product?: string;
  tone?: "dark" | "light";
  size?: LockupSize;
  /** "by JJ Premier Group" under the words. Only with a product: a family's name alone is too short to carry it. */
  byline?: boolean;
  /** The words are already on the page (an h1 says them). */
  decorative?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const word = WORD[family];
  const rest = product ? (product.startsWith(word.text) ? product.slice(word.text.length).trim() : product) : "";
  const pw = rest ? (PRODUCT_W[rest] ?? rest.length * 64) : 0;
  const x0 = EMBLEM + GAP;
  const x1 = x0 + word.w + WORD_GAP;
  const width = rest ? x1 + pw : x0 + word.w;
  const accent = `var(--color-${family}${tone === "light" ? "-ink" : ""})`;
  const line = split(family, word.w);
  const sz = SIZES[size];
  const g = GEOMETRY[family];
  const label = [word.text, rest].filter(Boolean).join(" ");
  const text = (fill: string) => (
    <text x="0" y={BASE} fontSize={SIZE} textLength={word.w} lengthAdjust="spacingAndGlyphs" fill={fill} style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
      {word.text}
    </text>
  );
  const track = `${sz.track}em`;

  return (
    <span className={cn("inline-flex max-w-full flex-col self-start", sz.wrap, tone === "dark" ? "text-white" : "text-navy", className)}>
      <svg viewBox={`0 0 ${width} ${H}`} className={cn("block max-w-full", sz.svg)} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": `${label}, by JJ Premier Group` })}>
        <defs>
          <mask id={`${id}-m`}>
            <rect width="64" height="64" fill="#fff" />
            {g.cut}
          </mask>
          <clipPath id={`${id}-c`}>
            <path d={`${line} L${word.w} ${H} L0 ${H} Z`} />
          </clipPath>
        </defs>
        <g transform={`translate(0 ${EMBLEM_Y}) scale(${EMBLEM / 64})`}>
          <g fill={accent} mask={`url(#${id}-m)`}>{g.shape}</g>
        </g>
        <g transform={`translate(${x0} 0)`}>
          {text("currentColor")}
          <g clipPath={`url(#${id}-c)`}>{text(accent)}</g>
          {family === "tide" ? (
            <>
              <path d={line} fill="none" stroke={accent} strokeWidth={1.4 * sz.lines} />
              <path d={line} transform="translate(0 13)" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth={1 * sz.lines} />
              <path d={line} transform="translate(0 24)" fill="none" stroke={accent} strokeOpacity="0.22" strokeWidth={1 * sz.lines} />
            </>
          ) : null}
        </g>
        {rest ? (
          <text x={x1} y={BASE} fontSize={SIZE} textLength={pw} lengthAdjust="spacing" fill="currentColor" fillOpacity={0.86} style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            {rest}
          </text>
        ) : null}
      </svg>
      {byline && sz.by && rest ? (
        /*
          Three lines, all centred on the words (never on the emblem): the
          name above, "by" under it, then JJ PREMIER GROUP between two rules
          that reach exactly to the words' outer edges. The tracking after
          the last letter is taken back, so the rules and gaps are equal.
        */
        <span className="block w-0 min-w-full" aria-hidden="true">
          <span
            className={cn("flex flex-col items-center", sz.by, sz.space, tone === "dark" ? "text-white/80" : "text-navy/80")}
            style={{ paddingLeft: `${((x0 / width) * 100).toFixed(3)}%`, marginTop: "var(--by-top)", gap: "var(--by-gap)" }}
          >
            <span className="font-display text-[1.45em] font-light italic leading-none">by</span>
            <span className="flex w-full items-center gap-[0.9em]">
              <span className="h-px min-w-0 flex-1 bg-current opacity-45" />
              <span className="shrink-0 whitespace-nowrap font-wordmark font-semibold uppercase leading-none" style={{ letterSpacing: track, marginRight: `-${track}` }}>
                JJ Premier Group
              </span>
              <span className="h-px min-w-0 flex-1 bg-current opacity-45" />
            </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
