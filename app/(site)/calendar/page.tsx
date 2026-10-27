import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrivedFrom } from "@/components/arrived-from";
import { EncoreIsland } from "@/components/encore/encore";
import { EncoreReaderClose } from "@/components/encore/reader-close";
import { LetterForm } from "@/components/letter-form";
import { Masthead } from "@/components/masthead";
import { TrackedLink } from "@/components/tracked-link";
import { getVenues } from "@/lib/content";
import { MARKETS, marketName } from "@/lib/content/markets";
import { loadEncoreIndex, localDay, sliceIndex } from "@/lib/encore/data";
import { FIRST_PAINT_DAYS } from "@/lib/encore/index-format";
import { addDays } from "@/lib/encore/select";
import { ENCORE_KEYS } from "@/lib/encore/url";
import { eventListJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";

export const metadata: Metadata = pageMetadata({
  title: "Encore Arts Calendar",
  description:
    "Encore lists tonight, this weekend and the whole season: theater, concerts, galleries, talks, film and festivals in Lakewood Ranch, Sarasota and Bradenton, by day, week and month. It is the arts calendar from JJ Premier Group.",
  path: "/calendar",
  fileImage: true, // opengraph-image.tsx beside this page
});

/** Hourly: "tonight" moves, and the index behind it is regenerated on the same schedule. */
export const revalidate = 3600;

/**
 * The calendar. Static and regenerated hourly: the server renders today and
 * the next three weeks from a slice of the index, so the page is complete
 * without JavaScript and for crawlers; the view a link asks for is applied in
 * the browser, which takes over with the full season
 * (components/encore/encore.tsx, EncoreIsland).
 */
export default async function CalendarPage() {
  const today = localDay(Date.now());
  const index = await loadEncoreIndex();
  // The first paint: today and the strip's first three weeks. A search, a far day or a shared list waits for the season.
  const sliceRange: [string, string] = [today, addDays(today, FIRST_PAINT_DAYS - 1)];
  const slice = sliceIndex(index, sliceRange[0], sliceRange[1]);
  const venues = await getVenues();
  // The next 30 productions, once each, in date order: the calendar's ItemList for crawlers.
  const now = Date.now();
  const listed = new Set<number>();
  for (const p of index.perfs) {
    if (listed.size >= 30) break;
    if (p[4] >= now) listed.add(p[0]);
  }
  const itemList = eventListJsonLd([...listed].map((i) => ({ slug: index.events[i]!.s, title: index.events[i]!.t })));

  return (
    <>
      <JsonLd data={itemList} />
      {/* On a phone the masthead is short (the lockup and the byline), so the first show is inside the first screen. */}
      <Masthead route="/calendar" titleId="encore-title" compact>
        <p className="rise d3 t-lead hidden max-w-[600px] text-linen-100 text-shadow-soft md:block">Theater, concerts and cultural events in Lakewood Ranch, Sarasota and Bradenton.</p>
      </Masthead>
      <UrlPending keys={ENCORE_KEYS} />
      <IslandBoundary name="the calendar" minHeight="480px">
        <EncoreIsland serverToday={today} initialIndex={slice} sliceRange={sliceRange} />
      </IslandBoundary>

      {/* The sign-up; for a reader who came from the Encore email, the week's own actions instead. */}
      <ArrivedFrom
        list="encore"
        reader={<EncoreReaderClose />}
        signup={
          <section id="subscribe" className="scroll-mt-header bg-linen-200">
            <div className="container-site grid items-center gap-8 py-section lg:grid-cols-[1.2fr_1fr] lg:gap-16">
              <div className="flex flex-col gap-3">
                <h2 className="t-h1 text-navy">Get Encore in your inbox.</h2>
                <p className="t-body max-w-measure text-body">The week&rsquo;s shows, concerts and openings come in one email every Monday.</p>
              </div>
              <div className="flex flex-col gap-4">
                <LetterForm form="calendar" label="Subscribe" />
                <p className="t-small text-linen-700">
                  Prefer your own calendar app?{" "}
                  <TrackedLink href="/api/calendar.ics" event="Calendar feed" props={{ kind: "feed", filter: "all" }} className="text-navy underline underline-offset-4 hover:text-harbor-700">
                    Subscribe to the feed
                  </TrackedLink>
                  , or narrow it to a category or a venue above and subscribe to just that.
                </p>
              </div>
            </div>
          </section>
        }
      />

      {venues.length ? (
        <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="venues-title">
          <div className="flex flex-col gap-3">
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
          <p className="t-note">{marketName("sarasota")}, {marketName("bradenton")} and {marketName("lakewood-ranch")}. Every listing comes from the venue&rsquo;s or presenter&rsquo;s own site.</p>
        </section>
      ) : null}
    </>
  );
}
