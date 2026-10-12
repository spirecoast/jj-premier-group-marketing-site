import type { Metadata } from "next";
import { VisitPlan } from "@/components/encore/visit-plan";
import { Masthead } from "@/components/masthead";
import { loadEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { parsePlanState } from "@/lib/encore/plan";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Encore Planner: your nights out, day by day",
  description:
    "Pick your dates and Encore Planner lays out each evening’s shows, concerts and openings in Sarasota, Lakewood Ranch and Bradenton, with ten to four free for showings.",
  path: "/calendar/plan",
});

/** Hourly, like the calendar: the index behind the picks is regenerated on the same schedule. */
export const revalidate = 3600;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Encore Planner. The server builds the first plan from a slice of the
 * index covering the stay, so a shared link is complete without JavaScript;
 * the client takes over with the full season for new dates.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const today = localDay(Date.now());
  const { state, trimmed } = parsePlanState(params, today);
  const slice = sliceIndex(await loadEncoreIndex(), state.from, state.to);

  return (
    <>
      <Masthead
        route="/calendar/plan"
        title="Plan your nights out"
        titleId="plan-title"
      >
        <p className="rise d3 t-lead max-w-[620px] text-linen-100 text-shadow-soft">
          Pick your dates. We’ll line up the shows, concerts and openings for each one, and keep ten to four free if you’re here to see homes.
        </p>
      </Masthead>

      <VisitPlan initial={state} today={today} initialIndex={slice} trimmed={trimmed} />
    </>
  );
}
