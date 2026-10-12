import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three data products' marks, drawn in code from the Figma file
 * ("JJ Premier Group · Atlas, Encore, Tide"). Each family has a ground, an
 * accent, and Tide and Encore a motif: Tide the waterline, Encore the
 * proscenium and its footlights. The accents are CSS
 * tokens (--color-tide, --color-atlas, --color-encore in globals.css).
 */
export type FamilyKey = ProductFamily["key"];

/** One swell across a 300-wide box, crest to crest every 150. */
const WAVE = "M0 80 C 25 72, 50 72, 75 80 S 125 88, 150 80 S 200 72, 225 80 S 275 88, 300 80";

/**
 * The Tide lockup: the word in the display serif, stretched to the width it's
 * given, with a waterline through it. Below the line the letters turn to the
 * sky colour, and two fainter swells run under them. Pass `decorative` when
 * the words are already on the page (the masthead's h1 says them).
 */
export function TideWordmark({ id, className, decorative }: { id: string; className?: string; decorative?: boolean }) {
  const text = (fill: string) => (
    <text
      x="150"
      y="104"
      textAnchor="middle"
      fontSize="132"
      textLength="292"
      lengthAdjust="spacingAndGlyphs"
      fill={fill}
      style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.01em" }}
    >
      Tide
    </text>
  );
  return (
    <svg viewBox="0 0 300 124" className={className} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Tide" })}>
      <defs>
        <clipPath id={`${id}-water`}>
          <path d={`${WAVE} L300 124 L0 124 Z`} />
        </clipPath>
      </defs>
      {text("currentColor")}
      <g clipPath={`url(#${id}-water)`}>{text("var(--color-tide)")}</g>
      <path d={WAVE} fill="none" stroke="var(--color-tide)" strokeWidth="1.4" />
      <path d={WAVE} transform="translate(0 13)" fill="none" stroke="var(--color-tide)" strokeOpacity="0.45" strokeWidth="1" />
      <path d={WAVE} transform="translate(0 24)" fill="none" stroke="var(--color-tide)" strokeOpacity="0.22" strokeWidth="1" />
    </svg>
  );
}

/* ---- Masthead motifs: one per family, laid over the photograph. ------- */

/** The motif for a family's masthead. Purely decorative; it draws in once on load (not for reduced motion). */
export function FamilyMotif({ family }: { family: FamilyKey }) {
  // Atlas carries no motif: the photograph of the place and the family tint do the work.
  if (family === "atlas") return null;
  if (family === "encore")
    return (
      <div className="motif motif-encore" aria-hidden="true">
        <span className="motif-spot" />
        <span className="motif-arch" />
        <span className="motif-arch motif-arch-inner" />
        <span className="motif-lights">
          {Array.from({ length: 25 }, (_, i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </span>
        {/* Marquee bulbs up each side of the arch. */}
        {(["left", "right"] as const).map((side) => (
          <span key={side} className={`motif-lights motif-lights-side is-${side}`}>
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ ["--i" as string]: 6 - i }} />
            ))}
          </span>
        ))}
      </div>
    );
  // Tide: three straight hairlines along the foot, the brightest on top.
  return (
    <div className="motif motif-tide" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
