import { Fragment } from "react";
import { ART } from "@/lib/art/palette";
import type { Ridgeline } from "@/lib/art/tide";
import { cn } from "@/lib/utils";

type Fade = {
  /** Fade the ridges in from the left edge over this fraction of the width (room for a heading). */
  left?: number;
  /** Fade the ridges out over this fraction of the height at the bottom. */
  bottom?: number;
};

/**
 * The Tide ridgeline, drawn: each ridge's path is defined once and used
 * twice, as a wide faint halo and then as the crisp line over its own fill.
 * The fill runs from the ridge's light at the crest to the ground at the
 * baseline and is nearly opaque there, so each month stands in front of the
 * ones behind it. The ground itself is the container's (.art-ground); the
 * drawing is transparent, so cropping at another aspect leaves no seam.
 * `live` adds the masthead's slow drift and the horizon's breathing, both
 * off under prefers-reduced-motion (app/globals.css).
 */
export function Ridges({
  g,
  id,
  preserve = "xMidYMid slice",
  className,
  fade,
  live,
}: {
  g: Ridgeline;
  /** A prefix for the ids inside: unique per drawing on the page. */
  id: string;
  preserve?: string;
  className?: string;
  fade?: Fade;
  live?: boolean;
}) {
  const W = g.width;
  const H = g.height;
  const maskId = fade ? `${id}-mask` : undefined;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={preserve}
      className={cn("absolute inset-0 h-full w-full", live && "art-drift", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-h`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={ART.mango} stopOpacity={0.32} />
          <stop offset="0.5" stopColor={ART.coral} stopOpacity={0.1} />
          <stop offset="1" stopColor={ART.coral} stopOpacity={0} />
        </radialGradient>
        {g.ridges.map((r, i) => (
          <linearGradient key={r.month} id={`${id}-f${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={r.color} stopOpacity={0.36} />
            <stop offset="1" stopColor={ART.groundTop} stopOpacity={0.96} />
          </linearGradient>
        ))}
        {g.ridges.map((r, i) => (
          <path key={r.month} id={`${id}-r${i}`} d={r.d} />
        ))}
        {fade ? (
          <>
            {fade.left ? (
              <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity={0.08} />
                <stop offset={fade.left} stopColor="#fff" stopOpacity={1} />
              </linearGradient>
            ) : null}
            {fade.bottom ? (
              <linearGradient id={`${id}-fb`} x1="0" y1="0" x2="0" y2="1">
                <stop offset={1 - fade.bottom} stopColor="#000" stopOpacity={0} />
                <stop offset="1" stopColor="#000" stopOpacity={0.9} />
              </linearGradient>
            ) : null}
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <rect width={W} height={H} fill={fade.left ? `url(#${id}-fl)` : "#fff"} />
              {fade.bottom ? <rect width={W} height={H} fill={`url(#${id}-fb)`} /> : null}
            </mask>
          </>
        ) : null}
      </defs>
      <ellipse className={live ? "art-breathe" : undefined} cx={g.horizon.cx} cy={g.horizon.cy} rx={g.horizon.rx} ry={g.horizon.ry} fill={`url(#${id}-h)`} />
      <g mask={maskId ? `url(#${maskId})` : undefined} strokeLinejoin="round" strokeLinecap="round">
        {g.ridges.map((r, i) => (
          <Fragment key={r.month}>
            <use href={`#${id}-r${i}`} fill="none" stroke={r.color} strokeWidth={r.stroke * 4.5} strokeOpacity={0.14 * r.opacity} />
            <use href={`#${id}-r${i}`} fill={`url(#${id}-f${i})`} stroke={r.color} strokeWidth={r.stroke} strokeOpacity={r.opacity} />
          </Fragment>
        ))}
      </g>
    </svg>
  );
}
