import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { EventHero } from "@/components/encore/event-hero";
import { VenuePanel } from "@/components/encore/venue-panel";
import { ListingCard } from "@/components/listing-card";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { SaveInline } from "@/components/encore/save-inline";
import { ShareButton } from "@/components/share-button";
import { subcategoryLabel } from "@/lib/encore/categories";
import { findEvent, getEventSlugs, getListings, getUpcomingEvents, type Event } from "@/lib/content";
import { EVENT_CATEGORY_LABEL, formatAddress, formatDateLong, formatEventWhen, formatRun, weekdayName } from "@/lib/content/format";
import { cardEndsAt } from "@/lib/encore/fresh";
import { FreshList } from "@/components/encore/fresh-events";
import { localDay } from "@/lib/encore/day";
import { varyStock } from "@/lib/encore/stock";
import { isMarketSlug, marketName } from "@/lib/content/markets";
import { breadcrumbJsonLd, eventJsonLd, pageMetadata } from "@/lib/seo";
import { ExternalLink } from "@/components/ui/external-link";
import { ButtonLink } from "@/components/buttons";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getEventSlugs()).map((slug) => ({ slug }));
}

/** "at Van Wezel, Sarasota", or just "in Sarasota" when the venue isn't named (a placeholder or a home). */
const where = (e: Event) => (e.venue.unlisted ? `in ${e.venue.address.city || marketName(e.venue.market)}` : `at ${e.venue.name}, ${e.venue.address.city}`);

/**
 * An address the calendar never had, but shaped like an event's (`…-2026-09`)
 * with its month already past: an event pruned a year after it closed.
 */
const PAST_SLUG = /-(\d{4})-(0[1-9]|1[0-2])(?:-\d+)?$/;
function isPastEventSlug(slug: string): boolean {
  const m = slug.match(PAST_SLUG);
  return Boolean(m) && `${m![1]}-${m![2]}` < localDay(Date.now()).slice(0, 7);
}

/** Find the event, following a clipped slug to its clean one and a pruned one to the calendar. */
async function resolve(slug: string) {
  const found = await findEvent(slug);
  if (found?.kind === "moved") permanentRedirect(`/calendar/${found.slug}`);
  if (!found) {
    if (isPastEventSlug(slug)) permanentRedirect("/calendar");
    notFound();
  }
  return found;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolve(slug);
  const event = found.event;
  if (found.kind === "closed") {
    // Kept so links in posts and emails still answer, but not for search.
    return {
      ...pageMetadata({
        title: event.title,
        titleQualifiers: [event.venue.unlisted ? marketName(event.venue.market) : event.venue.name],
        description: `${event.title} has closed. What's next ${where(event)}, on the Encore Arts Calendar.`,
        path: `/calendar/${event.slug}`,
        fileImage: true,
        type: "article",
      }),
      robots: { index: false, follow: true },
    };
  }
  return pageMetadata({
    title: event.title,
        titleQualifiers: [event.venue.unlisted ? marketName(event.venue.market) : event.venue.name],
    description: `${formatRun(event) && !event.performances?.length ? formatRun(event) : formatEventWhen(event.startsAt, event.endsAt, event.allDay)} ${where(event)}. ${event.summary}`,
    path: `/calendar/${event.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const found = await resolve(slug);
  if (found.kind === "closed") return <ClosedEvent event={found.event} />;
  const event = found.event;

  const [atVenue, nearby] = await Promise.all([
    // A venue with no page of its own (a placeholder or a home) has no "coming up at" either.
    event.venue.unlisted ? Promise.resolve([]) : getUpcomingEvents({ venue: event.venue.slug, limit: 4, datedFirst: true }),
    isMarketSlug(event.venue.market) ? getListings({ market: event.venue.market }) : Promise.resolve([]),
  ]);
  const others = atVenue.filter((e) => e.slug !== event.slug).slice(0, 3);
  const listings = nearby.slice(0, 3);
  const mapsUrl = event.venue.unlisted
    ? undefined
    : event.venue.geo
    ? `https://www.google.com/maps/search/?api=1&query=${event.venue.geo.lat},${event.venue.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue.name}, ${formatAddress(event.venue.address)}`)}`;
  const isRun = Boolean(event.runsThrough) && !event.performances?.length;
  const renderedAt = new Date().toISOString();

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

      <article className="container-site flex flex-col gap-12 py-12 md:py-16 lg:gap-16">
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

        <EventHero event={event} />

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
              <p className="t-note">
                Source:{" "}
                {event.sourceUrl ? (
                  <ExternalLink href={event.sourceUrl} className="text-navy underline underline-offset-4">
                    {event.source}
                  </ExternalLink>
                ) : (
                  event.source
                )}

              </p>
            ) : null}
          </div>

          <VenuePanel event={event} mapsUrl={mapsUrl} renderedAt={renderedAt} />
        </div>
      </article>

      {others.length ? (
        <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="at-venue-title">
          <SectionHeading title={<span id="at-venue-title">Coming up at {event.venue.name}.</span>} aside={<Link href={`/venues/${event.venue.slug}`} className="link-rule">The venue</Link>} />
          <FreshList ends={others.map(cardEndsAt)} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {others.map((e) => (
              <li key={e.slug} className="flex">
                <EventCard event={e} className="w-full" />
              </li>
            ))}
          </FreshList>
        </section>
      ) : null}

      {listings.length && isMarketSlug(event.venue.market) ? (
        <section className="bg-linen-100">
          <div className="container-site flex flex-col gap-10 py-section" aria-labelledby="nearby-title">
            <SectionHeading
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

/**
 * An event whose dates are all behind us. The address stays alive for the
 * links already out there (posts, the Monday email, texts): the title, when
 * it last played, what's next at the same venue (or in the same town, when
 * the venue has no page) and the way back to the calendar. Noindex.
 */
async function ClosedEvent({ event }: { event: Event }) {
  const venueNamed = !event.venue.unlisted;
  const atVenue = venueNamed ? (await getUpcomingEvents({ venue: event.venue.slug, limit: 4, datedFirst: true })).filter((e) => e.slug !== event.slug) : [];
  // Nothing more at the venue (or no venue to name): the next shows in the same town.
  const inTown = atVenue.length ? [] : await getUpcomingEvents({ market: event.venue.market, limit: 4, datedFirst: true, distinctVenues: true });
  const next = (atVenue.length ? atVenue : inTown.filter((e) => e.slug !== event.slug)).slice(0, 3);
  const nextAtVenue = atVenue.length > 0;
  const art = varyStock(next.map((e) => ({ category: e.category, subcategory: e.subcategory, seed: e.slug })));
  const isRun = Boolean(event.runsThrough) && !event.performances?.length;
  const lastDay = formatDateLong(event.startsAt);
  const place = venueNamed ? event.venue.name : event.venue.address.city || marketName(event.venue.market);

  return (
    <>
      <article className="container-site flex flex-col gap-10 py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
          <Link href="/calendar" className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            Encore
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-navy" aria-current="page">
            {event.title}
          </span>
        </nav>
        <div className="flex max-w-[760px] flex-col gap-4">
          <h1 className="t-display text-navy">{event.title}</h1>
          <p className="t-lead text-body">
            This one has closed. {isRun ? "Its last day was" : "Its last date was"} {weekdayName(event.startsAt)}, {lastDay}, {venueNamed ? "at" : "in"} {place}.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <ButtonLink href="/calendar" dash>
              Back to the calendar
            </ButtonLink>
            {venueNamed ? (
              <Link href={`/venues/${event.venue.slug}`} className="link-rule">
                {event.venue.name}
              </Link>
            ) : null}
          </div>
        </div>
      </article>

      {next.length ? (
        <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="next-title">
          <SectionHeading title={<span id="next-title">{nextAtVenue ? `Next at ${event.venue.name}.` : `Next in ${marketName(event.venue.market)}.`}</span>} />
          <FreshList ends={next.map(cardEndsAt)} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {next.map((e, i) => (
              <li key={e.slug} className="flex">
                <EventCard event={e} className="w-full" pick={art[i]} />
              </li>
            ))}
          </FreshList>
        </section>
      ) : null}
    </>
  );
}
