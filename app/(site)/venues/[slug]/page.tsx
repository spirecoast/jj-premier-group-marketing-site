import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { getNeighborhoods, getUpcomingEvents, getVenue, getVenueSlugs } from "@/lib/content";
import { formatAddress } from "@/lib/content/format";
import { getMarket, marketName } from "@/lib/content/markets";
import { breadcrumbJsonLd, pageMetadata, placeJsonLd } from "@/lib/seo";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getVenueSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return { title: "Venue not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${venue.name} · ${marketName(venue.market)}`,
    description: `${venue.name}, ${formatAddress(venue.address)}. What is on, and how to get there.`,
    path: `/venues/${venue.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/** A venue page: the place, then what is on there. Overlay hero route. */
export default async function VenuePage({ params }: { params: Params }) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();
  const market = getMarket(venue.market);
  const [events, neighborhoods] = await Promise.all([
    getUpcomingEvents({ venue: venue.slug }),
    getNeighborhoods(venue.market),
  ]);
  const image = venue.image ?? market?.image;
  const address = formatAddress(venue.address);
  const mapsUrl = venue.geo
    ? `https://www.google.com/maps/search/?api=1&query=${venue.geo.lat},${venue.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${address}`)}`;

  return (
    <>
      <JsonLd data={placeJsonLd(venue)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "The Suncoast Calendar", path: "/calendar" },
          { name: venue.name, path: `/venues/${venue.slug}` },
        ])}
      />

      <section className="relative -mt-header min-h-[520px] overflow-hidden bg-navy text-white lg:min-h-[620px]" aria-labelledby="venue-title">
        {image ? <Photo image={image} priority sizes="100vw" /> : null}
        <div className="hero-shade" aria-hidden="true" />
        <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+3rem)]">
          <p className="t-eyebrow text-mist text-shadow-photo">
            {marketName(venue.market)} · {venue.address.city}
          </p>
          <h1 id="venue-title" className="t-hero max-w-[900px] text-white text-shadow-photo">
            {venue.name}
          </h1>
          <p className="t-record text-linen-200 text-shadow-soft">{address}</p>
        </div>
      </section>

      <section className="container-site grid gap-12 py-section lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-amber">About the venue</p>
          {venue.about?.length ? (
            <RichText value={venue.about} />
          ) : (
            <p className="t-body max-w-measure text-body">One of the places we keep going back to in {marketName(venue.market)}.</p>
          )}
        </div>
        <aside className="flex flex-col gap-5 self-start border border-hairline bg-white p-7">
          <dl className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="t-mono-sm text-graphite-500">Address</dt>
              <dd className="t-small text-body">{address}</dd>
            </div>
            {venue.website ? (
              <div className="flex flex-col gap-1">
                <dt className="t-mono-sm text-graphite-500">Website</dt>
                <dd>
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="t-small break-all text-harbor-700 underline underline-offset-4 hover:text-navy">
                    {venue.website.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            ) : null}
            {venue.neighborhood ? (
              <div className="flex flex-col gap-1">
                <dt className="t-mono-sm text-graphite-500">Neighborhood</dt>
                <dd>
                  <Link href={`/neighborhoods/${venue.neighborhood.slug}`} className="t-small text-harbor-700 underline underline-offset-4 hover:text-navy">
                    {venue.neighborhood.name}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link-rule self-start">
            Open in Google Maps ↗
          </a>
        </aside>
      </section>

      <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="venue-events-title">
        <SectionHeading
          eyebrow="Coming up"
          title={<span id="venue-events-title">What is on at {venue.name}.</span>}
          aside={<Link href={`/calendar?market=${venue.market}` as Route} className="link-rule">The {marketName(venue.market)} calendar</Link>}
        />
        {events.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.slug} className="flex">
                <EventCard event={e} className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-body max-w-measure text-body">
            Nothing on the calendar here this week. The Monday email carries the full list; the{" "}
            <Link href="/calendar#subscribe" className="text-harbor-700 underline underline-offset-4">
              box is here
            </Link>
            .
          </p>
        )}
      </section>

      {neighborhoods.length ? (
        <section className="bg-linen-100">
          <div className="container-site flex flex-col gap-6 py-16" aria-labelledby="venue-nb-title">
            <h2 id="venue-nb-title" className="t-eyebrow text-amber">
              Living near here
            </h2>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {neighborhoods.map((n) => (
                <li key={n.slug}>
                  <Link href={`/neighborhoods/${n.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
                    {n.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
