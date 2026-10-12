import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three data products' marks, drawn in code from the Figma file
 * ("JJ Premier Group · Atlas, Encore, Tide"). Each family has a ground, an
 * accent and a motif: Tide the waterline, Atlas the survey line and the
 * contours, Encore the proscenium and its footlights. The accents are CSS
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

/** The small mark that sits after a family's name: two swells, a survey line with a pin, or an arch with footlights. */
export function FamilyMark({ family, className }: { family: FamilyKey; className?: string }) {
  const c = cn("shrink-0", className);
  if (family === "tide")
    return (
      <svg width="30" height="12" viewBox="0 0 30 12" aria-hidden="true" className={c} style={{ color: "var(--color-tide)" }}>
        <path d="M0 4 C 3.75 2, 7.5 2, 11.25 4 S 18.75 6, 22.5 4 S 30 2, 30 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M0 9 C 3.75 7, 7.5 7, 11.25 9 S 18.75 11, 22.5 9 S 30 7, 30 9" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.1" />
      </svg>
    );
  if (family === "atlas")
    return (
      <svg width="38" height="12" viewBox="0 0 38 12" aria-hidden="true" className={c} style={{ color: "var(--color-atlas)" }}>
        <path d="M0 5 L30 5 M0 5 L0 9 M7.5 5 L7.5 7.5 M15 5 L15 9 M22.5 5 L22.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="33.5" cy="5" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="33.5" cy="5" r="1.1" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true" className={c} style={{ color: "var(--color-encore)" }}>
      <path d="M1.5 17 L1.5 8 C1.5 3 6.5 1.5 13 1.5 C19.5 1.5 24.5 3 24.5 8 L24.5 17" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7.5" cy="13.5" r="1.3" fill="currentColor" />
      <circle cx="13" cy="13.5" r="1.3" fill="currentColor" fillOpacity="0.55" />
      <circle cx="18.5" cy="13.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

/* ---- Masthead motifs: one per family, laid over the photograph. ------- */

/** Atlas's contours: closed, gently irregular rings round a point to the right, as on a survey map. Computed once, so server and client agree. */
const CONTOURS = (() => {
  const cx = 1080, cy = 250, out: { d: string; o: number; w: number }[] = [];
  for (let k = 0; k < 11; k++) {
    const r0 = 40 + k * 30;
    let d = "";
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const r = r0 * (1 + 0.13 * Math.sin(3 * t + k * 0.35) + 0.07 * Math.sin(5 * t + 1.3 - k * 0.2));
      d += `${i ? "L" : "M"}${(cx + r * Math.cos(t) * 1.25).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
    }
    out.push({ d: `${d}Z`, o: Math.max(0.16, 0.55 - k * 0.035), w: k % 4 === 0 ? 1.4 : 0.9 });
  }
  return out;
})();

/** The motif for a family's masthead. Purely decorative; it draws in once on load (not for reduced motion). */
export function FamilyMotif({ family }: { family: FamilyKey }) {
  if (family === "atlas")
    return (
      <svg className="motif motif-atlas" viewBox="0 0 1440 540" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        {CONTOURS.map((c, i) => (
          <path key={i} d={c.d} fill="none" stroke="var(--color-atlas)" strokeOpacity={c.o} strokeWidth={c.w} pathLength={1} style={{ ["--i" as string]: i }} />
        ))}
      </svg>
    );
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
