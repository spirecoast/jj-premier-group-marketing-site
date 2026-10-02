import { loadRidgeMonths } from "@/lib/art/load";
import { ridgeline } from "@/lib/art/tide";
import { Ridges } from "./ridges";

/**
 * Tide's portrait on the page: the ridgeline of the market's sale prices
 * (lib/art/tide.ts), one ridge per month, computed on the server from the
 * county sales at build or revalidation time. The prices never reach the
 * browser; the drawing does.
 *
 * Two placements. The masthead (components/masthead.tsx) is composed twice,
 * a 3:1 drawing from the small breakpoint up (sliced to the 2:1 band on
 * tablets) and a 4:3 one for phones, each with its ridges kept clear of the
 * heading; the card head on the home page is one 3:2 drawing, sliced to
 * 2:1 where the cards stack.
 */
export const TIDE_BOXES = {
  wide: { width: 1440, height: 480, samples: 150, back: 0.44, front: 0.9, peak: 0.36 },
  tall: { width: 390, height: 292, samples: 90, back: 0.26, front: 0.58, peak: 0.24 },
  card: { width: 600, height: 400, samples: 110, back: 0.42, front: 0.86, peak: 0.3 },
} as const;

export async function TideMasthead({ alt }: { alt: string }) {
  const months = await loadRidgeMonths();
  return (
    <div className="art-ground absolute inset-0 overflow-hidden" role="img" aria-label={alt}>
      <Ridges g={ridgeline(months, TIDE_BOXES.wide)} id="tm-w" className="hidden sm:block" fade={{ left: 0.32 }} live />
      <Ridges g={ridgeline(months, TIDE_BOXES.tall)} id="tm-t" className="sm:hidden" fade={{ bottom: 0.42 }} live />
    </div>
  );
}

export async function TideCard() {
  const months = await loadRidgeMonths();
  return <Ridges g={ridgeline(months, TIDE_BOXES.card)} id="tc" className="card-img" />;
}
