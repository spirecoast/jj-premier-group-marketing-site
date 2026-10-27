import type { Metadata } from "next";
import { VisitPlanIsland } from "@/components/encore/visit-plan";
import { Masthead } from "@/components/masthead";
import { loadEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { PLAN_DRAFT, PLAN_KEYS, parsePlanState } from "@/lib/encore/plan";
import { nearbyVenues } from "@/lib/places/google";
import { pageMetadata } from "@/lib/seo";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";

export const metadata: Metadata = pageMetadata({
  title: "Encore Planner: your nights out, day by day",
  description:
    "Pick your dates and Encore Planner lays out each evening’s shows, concerts and openings in Sarasota, Lakewood Ranch and Bradenton, with ten to four free for showings.",
  path: "/calendar/plan",
});

/** Hourly, like the calendar: the index behind the picks is regenerated on the same schedule. */
export const revalidate = 3600;

/**
 * Encore Planner. Static: the server builds the plan for the coming weekend
 * from a slice of the index, so the page is complete without JavaScript; a
 * plan link's dates are applied in the browser, which fetches the full season
 * for them (components/encore/visit-plan.tsx, VisitPlanIsland).
 */
export default async function PlanPage() {
  const today = localDay(Date.now());
  const { state } = parsePlanState({}, today);
  const slice = sliceIndex(await loadEncoreIndex(), state.from, state.to);

  return (
    <>
      <Masthead
        route="/calendar/plan"
        titleId="plan-title"
      >
        <p className="rise d3 t-lead max-w-[620px] text-linen-100 text-shadow-soft">Plan your nights out, if you live here or you’re visiting.</p>
      </Masthead>

      <UrlPending keys={PLAN_KEYS} draftKey={PLAN_DRAFT} />
      <IslandBoundary name="the planner" minHeight="480px">
        <VisitPlanIsland serverToday={today} initialIndex={slice} nearby={nearbyVenues()} />
      </IslandBoundary>
    </>
  );
}
