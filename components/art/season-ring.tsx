import { ART } from "@/lib/art/palette";
import type { SeasonClock } from "@/lib/art/encore";
import { cn } from "@/lib/utils";

/**
 * The Encore season clock, drawn: the dotted ring of days, the month ticks
 * and today's mark inside it, the run arcs, then every performance as a
 * stroke in its category's light, each category's path used twice (a soft
 * halo, then the crisp mark). The ground is the container's (.art-ground).
 */
export function SeasonRing({ g, id, preserve = "xMidYMid meet", className }: { g: SeasonClock; id: string; preserve?: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${g.width} ${g.height}`} preserveAspectRatio={preserve} className={cn("absolute inset-0 h-full w-full", className)} aria-hidden="true" focusable="false">
      <defs>
        {g.spokes.map((s) => (
          <path key={s.category} id={`${id}-${s.category}`} d={s.d} />
        ))}
      </defs>
      <g fill="none" strokeLinecap="round">
        <circle cx={g.cx} cy={g.cy} r={g.ring.r} stroke={ART.sky} strokeOpacity={0.42} strokeWidth={0.9} strokeDasharray={`${g.ring.dash[0]} ${g.ring.dash[1]}`} strokeLinecap="butt" />
        {g.months ? <path d={g.months} stroke="#fff" strokeOpacity={0.45} strokeWidth={0.8} /> : null}
        <path d={g.today} stroke="#fff" strokeOpacity={0.9} strokeWidth={1.4} />
        {g.arcs.map((a) => (
          <path key={a.category} d={a.d} stroke={a.color} strokeOpacity={0.45} strokeWidth={1} />
        ))}
        {g.spokes.map((s) => (
          <use key={s.category} href={`#${id}-${s.category}`} stroke={s.color} strokeOpacity={0.2} strokeWidth={3.4} />
        ))}
        {g.spokes.map((s) => (
          <use key={s.category} href={`#${id}-${s.category}`} stroke={s.color} strokeOpacity={0.95} strokeWidth={1} />
        ))}
      </g>
    </svg>
  );
}
