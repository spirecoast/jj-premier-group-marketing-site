import type { Metadata } from "next";
import Link from "next/link";
import { VisitPlan } from "@/components/encore/visit-plan";
import { SectionHeading } from "@/components/section-heading";
import { getEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { parsePlanState } from "@/lib/encore/plan";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Plan a visit · Encore",
  description:
    "Coming to look at homes in Lakewood Ranch, Sarasota or Bradenton? Give Encore your dates and the places you want to see, and get a day-by-day plan: showings from ten to four, then the evening's theater, music and openings.",
  path: "/calendar/plan",
});

/** Hourly, like the calendar: the index behind the picks is regenerated on the same schedule. */
export const revalidate = 3600;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The visit planner. The server builds the first plan from a slice of the
 * index covering the stay, so a shared link is complete without JavaScript;
 * the client takes over with the full season for new dates.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const today = localDay(Date.now());
  const { state, trimmed } = parsePlanState(params, today);
  const slice = sliceIndex(getEncoreIndex(), state.from, state.to);

  return (
    <>
      {/* 01 · Hero on Paper: the eyebrow, the headline, the promise. */}
      <section className="container-site flex flex-col gap-7 pb-12 pt-10 md:pt-14 lg:pb-16">
        <SectionHeading
          number="01"
          eyebrow="Encore · Plan a visit"
          as="h1"
          size="display"
          title={
            <>
              Houses by day.
              <br className="hidden sm:block" /> Encore by night.
            </>
          }
          aside={
            <Link href="/calendar" className="link-rule">
              The whole calendar
            </Link>
          }
        />
        <p className="t-lead max-w-[600px] text-body">
          Tell us when you&rsquo;re arriving and where you want to look. You&rsquo;ll get a day for each date: the hours from ten to four held for showings, then up to three performances that evening from
          Encore, spread across venues and categories so no two nights look alike.
        </p>
        <p className="t-body max-w-measure text-body">
          Weekends get a matinee option too. Save anything into your Encore list, put the whole plan in your calendar, or send the link to whoever is coming with you.
        </p>
      </section>

      <VisitPlan initial={state} today={today} initialIndex={slice} trimmed={trimmed} />
    </>
  );
}
