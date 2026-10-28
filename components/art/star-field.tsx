import { ART } from "@/lib/art/palette";
import type { StarChart } from "@/lib/art/atlas";
import { cn } from "@/lib/utils";

/**
 * The Atlas star chart, drawn: the faint web first, then the constellation
 * figures between the areas, the halos, and every place as a dot (a round
 * cap on a hair of a path, one path per market and level). The ground is
 * the container's (.art-ground), so a wider box simply shows more sky.
 *
 * `draw` is Atlas's arrival: the sky settles in from the back, the web and
 * the figures first, then the halos, then the stars by level, the faint
 * enclaves before the communities before the bright areas, each market a
 * beat after the last (one group of places every 60 ms, nine groups in all).
 * On the first paint when `draw` is set, or when an InView box reaches the
 * screen; reduced motion shows the finished sky at once.
 */
export function StarField({ g, preserve = "xMidYMid meet", className, draw }: { g: StarChart; preserve?: string; className?: string; draw?: boolean }) {
  const delay = (step: number) => ({ animationDelay: `${Math.round(step * 60)}ms` });
  return (
    <svg viewBox={`0 0 ${g.width} ${g.height}`} preserveAspectRatio={preserve} className={cn("absolute inset-0 h-full w-full", draw && "draw-on", className)} aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        {g.web.count ? <path className="art-settle" d={g.web.d} stroke={ART.sky} strokeOpacity={0.13} strokeWidth={0.5} /> : null}
        {g.figures.count ? <path className="art-settle" style={delay(1)} d={g.figures.d} stroke={ART.sky} strokeOpacity={0.3} strokeWidth={0.6} /> : null}
        {g.halos.map((h, i) => (
          <path key={h.market} className="art-settle" style={delay(2 + i * 0.5)} d={h.d} stroke={h.color} strokeOpacity={0.16} strokeWidth={h.radius * 2} />
        ))}
        {g.dots.map((c, i) => (
          <path key={`${c.market}-${c.level}`} className="art-settle" style={delay(4 + i)} d={c.d} stroke={c.color} strokeOpacity={c.opacity} strokeWidth={c.radius * 2} />
        ))}
      </g>
    </svg>
  );
}
