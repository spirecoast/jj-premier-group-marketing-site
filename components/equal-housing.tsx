import { EQUAL_HOUSING_PATH, EQUAL_HOUSING_VIEWBOX } from "@/lib/brand-marks";
import { cn } from "@/lib/utils";

/** HUD's Equal Housing Opportunity mark, in a square frame, drawn in currentColor so it prints in any ink. */
export function EqualHousingMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center text-current", className)} title="Equal Housing Opportunity">
      <svg width={size} height={size} viewBox={EQUAL_HOUSING_VIEWBOX} aria-hidden="true" fill="currentColor">
        <path d={EQUAL_HOUSING_PATH} fillRule="evenodd" />
      </svg>
      <span className="sr-only">Equal Housing Opportunity</span>
    </span>
  );
}
