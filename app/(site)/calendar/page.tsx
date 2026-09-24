import type { Metadata, Route } from "next";
import Link from "next/link";
import { Encore } from "@/components/encore/encore";
import { LetterForm } from "@/components/letter-form";
import { getVenues } from "@/lib/content";
import { MARKETS, marketName } from "@/lib/content/markets";
import { getEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { addDays, monthEnd, monthStart, weekStart } from "@/lib/encore/select";
import { parseEncoreState } from "@/lib/encore/url";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Encore Arts Calendar",
  description:
    "Tonight, this weekend and the whole season: theater, concerts, galleries, talks, film and festivals in Lakewood Ranch, Sarasota and Bradenton, by day, week and month. The Encore Arts Calendar from JJ Premier Group.",
  path: "/calendar",
});

/** Hourly: "tonight" moves, and the index behind it is regenerated on the same schedule. */
export const revalidate = 3600;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The calendar. The server renders the first view from a slice of the index
 * so the page is complete without JavaScript and for crawlers; the client
 * takes over with the full season.
 */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const initial = parseEncoreState(params);
  const today = localDay(Date.now());
  const anchor = initial.date || today;
  const index = getEncoreIndex();

  // The slice covers today's spotlight, the strip's counts for two weeks, and the requested window.
  let from = today;
  let to = addDays(today, 14);
  if (initial.view === "week") {
    from = weekStart(anchor) < from ? weekStart(anchor) : from;
    to = addDays(weekStart(anchor), 6) > to ? addDays(weekStart(anchor), 6) : to;
  } else if (initial.view === "month") {
    from = monthStart(anchor) < from ? monthStart(anchor) : from;
    to = monthEnd(anchor) > to ? monthEnd(anchor) : to;
  } else {
    from = anchor < from ? anchor : from;
    to = addDays(anchor, 6) > to ? addDays(anchor, 6) : to;
  }
  const slice = initial.list.length ? sliceIndex(index, today, addDays(today, 365)) : sliceIndex(index, from, to);
  const venues = await getVenues();

  return (
    <>
      <Encore initial={initial} today={today} initialIndex={slice} />

      <section className="bg-linen-200">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Every Monday</p>
            <h2 className="t-h1 text-navy">Get Encore in your inbox.</h2>
            <p className="t-body max-w-measure text-body">The week&rsquo;s shows, concerts and openings, in one email every Monday.</p>
          </div>
          <div className="flex flex-col gap-4">
            <LetterForm form="calendar" label="Subscribe" />
            <p className="t-small text-linen-700">
              Prefer your own calendar app?{" "}
              <a href="/api/calendar.ics" className="text-navy underline underline-offset-4 hover:text-harbor-700">
                Subscribe to the feed
              </a>
              , or narrow it to a category or a venue above and subscribe to just that.
            </p>
          </div>
        </div>
      </section>

      {venues.length ? (
        <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="venues-title">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">The venues</p>
            <h2 id="venues-title" className="t-h1 text-navy">
              {venues.length} places the calendar draws from.
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {MARKETS.map((m) => {
              const mine = venues.filter((v) => v.market === m.slug);
              return (
                <div key={m.slug} className="flex flex-col gap-3">
                  <h3 className="t-h3 border-b border-hairline pb-2 text-navy">
                    <Link href={`/calendar?market=${m.slug}` as Route} className="hover:text-harbor-700">
                      {m.name}
                    </Link>
                    <span className="t-mono-sm ml-2 text-graphite-500">{mine.length}</span>
                  </h3>
                  <ul className="columns-1 gap-x-6 lg:columns-2">
                    {mine.map((v) => (
                      <li key={v.slug} className="break-inside-avoid">
                        <Link href={`/venues/${v.slug}`} className="t-small -my-1 inline-block py-1 text-body transition-colors hover:text-navy">
                          {v.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="t-mono-sm text-graphite-500">{marketName("sarasota")}, {marketName("bradenton")} and {marketName("lakewood-ranch")}. Every listing comes from the venue&rsquo;s or presenter&rsquo;s own site.</p>
        </section>
      ) : null}
    </>
  );
}
