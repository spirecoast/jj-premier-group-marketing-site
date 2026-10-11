import type { Metadata } from "next";
import Link from "next/link";
import { VisitPlan } from "@/components/encore/visit-plan";
import { Masthead } from "@/components/masthead";
import { loadEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { parsePlanState } from "@/lib/encore/plan";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Encore Planner: what's on in Sarasota, Lakewood Ranch and Bradenton, day by day",
  description:
    "Pick your dates and Encore Planner lays out each day: up to three shows, concerts or openings every evening, from different venues. Coming to look at homes? It keeps ten to four free for showings. Add it to your calendar or share the link.",
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
        title="What’s on, day by day"
        titleId="plan-title"
        crumbs={
          <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-2 text-linen-200 text-shadow-soft">
            <Link href="/calendar" className="underline-offset-4 hover:text-white hover:underline">
              Encore
            </Link>
            <span aria-hidden="true">›</span>
            <span>Planner</span>
          </nav>
        }
      >
        <p className="rise d3 t-lead max-w-[620px] text-linen-100 text-shadow-soft">
          Pick your dates and get the shows, concerts and openings for each day. Coming to look at homes? It keeps ten to four free.
        </p>
      </Masthead>

      <VisitPlan initial={state} today={today} initialIndex={slice} trimmed={trimmed} />
    </>
  );
}
