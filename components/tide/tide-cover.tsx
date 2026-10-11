import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const FALLBACK = img("library/gulf-beach-aerial", "The Gulf shore from above");

/** Sky 300, the brand's water colour. */
const SKY = "#89d4e3";

/** One swell across the 300-wide box, crest to crest every 150. */
const WAVE = "M0 80 C 25 72, 50 72, 75 80 S 125 88, 150 80 S 200 72, 225 80 S 275 88, 300 80";

/**
 * The Tide lockup: the word in the display serif, stretched to the width it's
 * given, with a waterline through it. Below the line the letters turn to the
 * sky colour, and two fainter swells run under them.
 */
export function TideWordmark({ id, className }: { id: string; className?: string }) {
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
    <svg viewBox="0 0 300 124" className={className} role="img" aria-label="Tide">
      <defs>
        <clipPath id={`${id}-water`}>
          <path d={`${WAVE} L300 124 L0 124 Z`} />
        </clipPath>
      </defs>
      {text("currentColor")}
      <g clipPath={`url(#${id}-water)`}>{text(SKY)}</g>
      <path d={WAVE} fill="none" stroke={SKY} strokeWidth="1.4" />
      <path d={WAVE} transform="translate(0 13)" fill="none" stroke={SKY} strokeOpacity="0.45" strokeWidth="1" />
      <path d={WAVE} transform="translate(0 24)" fill="none" stroke={SKY} strokeOpacity="0.22" strokeWidth="1" />
    </svg>
  );
}

export type TideCoverCard = {
  issue?: string;
  issueLabel?: string;
  headline?: string;
  cover?: ImageRef;
};

/**
 * An issue's cover, built from the issue itself so every month gets one: the
 * photograph under a navy wash, the team and the month on the top line, the
 * Tide lockup, the headline at the foot, and the brokerage and the three
 * places on the bottom line, the team's name never larger than the
 * brokerage's (FAC 61J2-10.026). Type is sized to the cover's width, so the
 * same cover works as a thumbnail and as the feature.
 */
export function TideCover({ card, priority, sizes, className }: { card: TideCoverCard; priority?: boolean; sizes: string; className?: string }) {
  return (
    <div className={cn("@container relative aspect-[4/5] overflow-hidden bg-navy text-white", className)}>
      <Photo image={card.cover ?? FALLBACK} priority={priority} sizes={sizes} className="card-img" />
      <div className="absolute inset-0 bg-linear-to-b from-harbor-950/90 via-harbor-950/20 to-harbor-950/90" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between p-[6.5cqw]">
        <div className="flex flex-col gap-[2.5cqw]">
          <div className="flex items-baseline justify-between gap-4 font-mono text-[2.5cqw] uppercase tracking-[0.18em] text-linen-100">
            <span>JJ Premier Group</span>
            {card.issueLabel ? <span>{card.issueLabel}</span> : null}
          </div>
          <span className="block h-px bg-white/35" aria-hidden="true" />
          <TideWordmark id={`tw-${card.issue ?? "x"}`} className="-mt-[1cqw] w-full text-white" />
        </div>
        <div className="flex flex-col gap-[3cqw]">
          {card.headline ? (
            <p className="max-w-[24ch] text-balance font-display text-[7.4cqw] font-light leading-[1.08] text-white text-shadow-photo">{card.headline}</p>
          ) : null}
          <span className="block h-px bg-white/35" aria-hidden="true" />
          <div className="flex items-baseline justify-between gap-4 font-mono text-[2.5cqw] uppercase tracking-[0.18em] text-linen-100">
            <span className="whitespace-nowrap">Coldwell Banker Realty</span>
            <span className="hidden text-right @[22rem]:inline">Monthly market report</span>
          </div>
        </div>
      </div>
    </div>
  );
}
