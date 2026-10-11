import { REALTOR_PATHS, REALTOR_VIEWBOX } from "@/lib/brand-marks";
import { cn } from "@/lib/utils";

/**
 * The REALTOR® membership mark, NAR's own paths in a square frame, one colour
 * (currentColor). NAR asks for clear space of half the block R's width on
 * every side, so give it a gap of at least a quarter of `size` to its
 * neighbours.
 */
export function RealtorMark({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center text-current", className)} title="REALTOR®">
      <svg width={size} height={size} viewBox={REALTOR_VIEWBOX} aria-hidden="true" fill="currentColor">
        {REALTOR_PATHS.map((p) => (
          <path key={p.d.slice(0, 24)} d={p.d} fillRule={p.evenOdd ? "evenodd" : undefined} />
        ))}
      </svg>
      <span className="sr-only">REALTOR®</span>
    </span>
  );
}
