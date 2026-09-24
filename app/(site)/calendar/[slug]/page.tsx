import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { SaveInline } from "@/components/encore/save-inline";
import { ShareButton } from "@/components/share-button";
import { subcategoryLabel } from "@/lib/encore/categories";
import { getEvent, getEventSlugs, getListings, getUpcomingEvents } from "@/lib/content";
import { EVENT_CATEGORY_LABEL, formatAddress, formatEventWhen, formatRun, weekdayName } from "@/lib/content/format";
import { isMarketSlug, marketName } from "@/lib/content/markets";
import { breadcrumbJsonLd, eventJsonLd, pageMetadata } from "@/lib/seo";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getEventSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Not on the calendar", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${event.title} · ${event.venue.name}`,
    description: `${formatRun(event) && !event.performances?.length ? formatRun(event) : formatEventWhen(event.startsAt, event.endsAt, event.allDay)} at ${event.venue.name}, ${event.venue.address.city}. ${event.summary}`,
    path: `/calendar/${event.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const [atVenue, nearby] = await Promise.all([
    getUpcomingEvents({ venue: event.venue.slug, limit: 4, datedFirst: true }),
    isMarketSlug(event.venue.market) ? getListings({ market: event.venue.market }) : Promise.resolve([]),
  ]);
  const others = atVenue.filter((e) => e.slug !== event.slug).slice(0, 3);
  const listings = nearby.slice(0, 3);
  const address = formatAddress(event.venue.address);
  const mapsUrl = event.venue.geo
    ? `https://www.google.com/maps/search/?api=1&query=${event.venue.geo.lat},${event.venue.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue.name}, ${address}`)}`;
  const free = event.priceNote?.toLowerCase().startsWith("free");
  const soldOut = event.status === "sold-out";
  const nowIso = new Date().toISOString();
  const upcomingPerformances = (event.performances ?? []).filter((p) => (p.endsAt ?? p.startsAt) >= nowIso);
  const shownPerformances = upcomingPerformances.slice(0, 8);
  const morePerformances = upcomingPerformances.length - shownPerformances.length;
  const run = formatRun(event);
  const isRun = Boolean(event.runsThrough) && !event.performances?.length;

  return (
    <>
      <JsonLd data={eventJsonLd(event)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Encore Arts Calendar", path: "/calendar" },
          { name: event.title, path: `/calendar/${event.slug}` },
        ])}
      />

      <article className="container-site flex flex-col gap-10 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
          <Link href="/calendar" className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            Encore
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/calendar?market=${event.venue.market}` as Route} className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            {marketName(event.venue.market)}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-navy" aria-current="page">
            {event.title}
          </span>
        </nav>

        {event.image ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-linen-100">
            <Photo image={event.image} priority sizes="(min-width: 1024px) 1248px, 100vw" />
          </div>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <p className="t-eyebrow text-amber">
                {marketName(event.venue.market)} · {isRun ? "On view" : weekdayName(event.startsAt)} · {EVENT_CATEGORY_LABEL[event.category]}
                {subcategoryLabel(event.subcategory) ? ` · ${subcategoryLabel(event.subcategory)}` : ""}
              </p>
              <h1 className="t-display text-navy">{event.title}</h1>
              <p className="t-lead max-w-measure text-body">{event.summary}</p>
              {event.presenter && event.presenter !== event.venue.name ? (
                <p className="t-mono-sm text-graphite-500">Presented by {event.presenter}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                <SaveInline slug={event.slug} title={event.title} />
                <ShareButton title={`${event.title} · Encore`} what="event" label="Share" />
              </div>
            </div>
            <RichText value={event.description ?? []} />
            {event.source ? (
              <p className="t-mono-sm text-graphite-500">
                Source:{" "}
                {event.sourceUrl ? (
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-4">
                    {event.source}
                  </a>
                ) : (
                  event.source
                )}
                {" · "}confirm times against the venue before you go
              </p>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6 self-start border border-hairline bg-white p-7 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <dl className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <dt className="t-mono-sm text-graphite-500">{upcomingPerformances.length > 1 ? "Dates" : "When"}</dt>
                {isRun ? (
                  <dd className="t-record text-navy">{run}</dd>
                ) : upcomingPerformances.length > 1 ? (
                  <dd className="flex flex-col gap-1.5">
                    <ul className="flex flex-col">
                      {shownPerformances.map((p) => (
                        <li key={p.startsAt} className="flex items-baseline justify-between gap-3 border-b border-hairline py-1.5 last:border-b-0">
                          <span className="t-record text-navy">{formatEventWhen(p.startsAt, p.endsAt, p.allDay)}</span>
                          <a href={`/api/calendar.ics?event=${event.slug}&at=${encodeURIComponent(p.startsAt)}`} className="t-mono-sm shrink-0 text-harbor-700 underline underline-offset-4 hover:text-navy" aria-label={`Add ${formatEventWhen(p.startsAt, p.endsAt, p.allDay)} to your calendar`}>
                            + Cal
                          </a>
                        </li>
                      ))}
                    </ul>
                    {morePerformances > 0 ? (
                      <span className="t-mono-sm text-graphite-500">
                        and {morePerformances} more{run ? `, ${run.toLowerCase()}` : ""}
                      </span>
                    ) : run ? (
                      <span className="t-mono-sm text-graphite-500">{run}</span>
                    ) : null}
                  </dd>
                ) : (
                  <dd className="t-record text-navy">{formatEventWhen(event.startsAt, event.endsAt, event.allDay)}</dd>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <dt className="t-mono-sm text-graphite-500">Where</dt>
                <dd className="flex flex-col gap-1">
                  <Link href={`/venues/${event.venue.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
                    {event.venue.name}
                  </Link>
                  <span className="t-small text-body-muted">{address}</span>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link-rule mt-1 self-start">
                    Open in Google Maps ↗
                  </a>
                </dd>
              </div>
              {event.room ? (
                <div className="flex flex-col gap-1">
                  <dt className="t-mono-sm text-graphite-500">Room</dt>
                  <dd className="t-record text-navy">{event.room}</dd>
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <dt className="t-mono-sm text-graphite-500">Tickets</dt>
                <dd className="t-record text-navy">{soldOut ? "Sold out" : (event.priceNote ?? "See the venue")}</dd>
              </div>
            </dl>
            {event.ticketUrl ? (
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-navy">
                {soldOut ? "Details at the venue" : free ? "Details at the venue" : "Get tickets"}
                <span className="btn-dash" aria-hidden="true" />
              </a>
            ) : (
              <p className="t-small text-body-muted">{free ? "Free. No ticket needed." : "Tickets at the door or from the venue."}</p>
            )}
            <a href={`/api/calendar.ics?event=${event.slug}`} className="link-rule self-start">
              {upcomingPerformances.length > 1 ? "Add every date to your calendar" : "Add to your calendar"}
            </a>
          </aside>
        </div>
      </article>

      {others.length ? (
        <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="at-venue-title">
          <SectionHeading eyebrow="Also on" title={<span id="at-venue-title">Coming up at {event.venue.name}.</span>} aside={<Link href={`/venues/${event.venue.slug}`} className="link-rule">The venue</Link>} />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {others.map((e) => (
              <li key={e.slug} className="flex">
                <EventCard event={e} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {listings.length && isMarketSlug(event.venue.market) ? (
        <section className="bg-linen-100">
          <div className="container-site flex flex-col gap-10 py-section" aria-labelledby="nearby-title">
            <SectionHeading
              eyebrow="Nearby"
              title={<span id="nearby-title">Homes in {marketName(event.venue.market)}, in case the evening goes well.</span>}
              aside={<Link href={`/listings?market=${event.venue.market}` as Route} className="link-rule">All {marketName(event.venue.market)} listings</Link>}
            />
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <li key={l.slug} className="flex">
                  <ListingCard listing={l} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
