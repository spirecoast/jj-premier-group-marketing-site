import { ART } from "@/lib/art/palette";
import type { StarChart } from "@/lib/art/atlas";
import { cn } from "@/lib/utils";

/**
 * The Atlas star chart, drawn: the faint web first, then the constellation
 * figures between the areas, the halos, and every place as a dot (a round
 * cap on a hair of a path, one path per market and level). The ground is
 * the container's (.art-ground), so a wider box simply shows more sky.
 */
export function StarField({ g, preserve = "xMidYMid meet", className }: { g: StarChart; preserve?: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${g.width} ${g.height}`} preserveAspectRatio={preserve} className={cn("absolute inset-0 h-full w-full", className)} aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        {g.web.count ? <path d={g.web.d} stroke={ART.sky} strokeOpacity={0.13} strokeWidth={0.5} /> : null}
        {g.figures.count ? <path d={g.figures.d} stroke={ART.sky} strokeOpacity={0.3} strokeWidth={0.6} /> : null}
        {g.halos.map((h) => (
          <path key={h.market} d={h.d} stroke={h.color} strokeOpacity={0.16} strokeWidth={h.radius * 2} />
        ))}
        {g.dots.map((c) => (
          <path key={`${c.market}-${c.level}`} d={c.d} stroke={c.color} strokeOpacity={c.opacity} strokeWidth={c.radius * 2} />
        ))}
      </g>
    </svg>
  );
}
