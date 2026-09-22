import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { CtaBand } from "@/components/cta-band";
import { EventCard } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { getNeighborhood, getNeighborhoodSlugs } from "@/lib/content";
import { marketName } from "@/lib/content/markets";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getNeighborhoodSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNeighborhood(slug);
  if (!data) return { title: "Neighborhood not found", robots: { index: false, follow: false } };
  const { neighborhood: n } = data;
  return pageMetadata({
    title: `${n.name} · ${marketName(n.market)} homes, HOA, flood zones and what is on`,
    description: n.tagline ?? `${n.name}, ${marketName(n.market)}: geography, HOA mechanics, flood zones, distances, homes for sale and what is on this month.`,
    path: `/neighborhoods/${n.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/**
 * A neighborhood page: the place, the homes, and what is happening there
 * this month. The events row is where most of the calendar's search value
 * lives — a page showing what is on outranks one made of adjectives.
 */
export default async function NeighborhoodPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getNeighborhood(slug);
  if (!data) notFound();
  const { neighborhood: n, listings, events, market } = data;
  const active = listings.filter((l) => l.status !== "sold").slice(0, 3);
  const sold = listings.filter((l) => l.status === "sold").slice(0, 3);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Neighborhoods", path: "/neighborhoods" },
          { name: n.name, path: `/neighborhoods/${n.slug}` },
        ])}
      />

      <section className="relative -mt-header min-h-[560px] overflow-hidden bg-navy text-white lg:min-h-[680px]" aria-labelledby="nb-title">
        <Photo image={n.hero} priority sizes="100vw" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+3rem)]">
          <p className="t-eyebrow text-mist text-shadow-photo">
            <Link href={`/neighborhoods?market=${n.market}` as Route} className="hover:text-white">
              {marketName(n.market)}
            </Link>
            {n.county ?? market?.county ? ` · ${n.county ?? market?.county}` : ""}
          </p>
          <h1 id="nb-title" className="t-hero max-w-[900px] text-white text-shadow-photo">
            {n.name}
          </h1>
          {n.tagline ? <p className="t-lead max-w-[560px] text-white text-shadow-soft">{n.tagline}</p> : null}
        </div>
      </section>

      <section className="container-site grid gap-12 py-section lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-amber">The place</p>
          <RichText value={n.overview} />
        </div>
        {n.stat ? (
          <aside className="flex flex-col gap-2 self-start border border-hairline bg-white p-7">
            <p className="t-stat text-navy">{n.stat.value}</p>
            <p className="t-label text-linen-700">{n.stat.label}</p>
            {n.stat.source ? <p className="t-mono-sm text-graphite-500">{n.stat.source}</p> : null}
            <RuleLink href={`/listings?market=${n.market}`} className="mt-4 self-start">
              Search {marketName(n.market)}
            </RuleLink>
          </aside>
        ) : null}
      </section>

      {n.highlights.length ? (
        <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="highlights-title">
          <h2 id="highlights-title" className="t-eyebrow text-amber">
            The particulars
          </h2>
          <dl className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {n.highlights.map((h) => (
              <div key={h.label} className="flex flex-col gap-2 bg-white p-6">
                <dt className="t-label text-navy">{h.label}</dt>
                <dd className="t-body text-body">{h.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="nb-listings-title">
        <SectionHeading
          eyebrow="On the market"
          title={<span id="nb-listings-title">{active.length ? `In ${n.name} right now.` : `Nothing in ${n.name} right now.`}</span>}
          aside={<RuleLink href={`/listings?market=${n.market}`}>All {marketName(n.market)} listings</RuleLink>}
        />
        {active.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {active.map((l) => (
              <li key={l.slug} className="flex">
                <ListingCard listing={l} className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-body max-w-measure text-body">
            {sold.length
              ? `The last one here sold in ${sold[0]!.daysOnMarket ?? "a few"} days. Tell us the timing and you hear about the next one before it lists.`
              : "We usually know what is about to list a week or two before it does. Tell us the timing and you hear first."}
          </p>
        )}
        {sold.length ? (
          <div className="flex flex-col gap-5 border-t border-hairline pt-8">
            <p className="t-eyebrow text-amber">What the street actually did</p>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sold.map((l) => (
                <li key={l.slug} className="flex">
                  <ListingCard listing={l} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="bg-linen-100">
        <div className="container-site flex flex-col gap-10 py-section" aria-labelledby="nb-events-title">
          <SectionHeading
            eyebrow="Encore Arts Calendar"
            title={<span id="nb-events-title">What is on in {marketName(n.market)} this month.</span>}
            aside={<RuleLink href={`/calendar?market=${n.market}`}>The full calendar</RuleLink>}
          />
          {events.length ? (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => (
                <li key={e.slug} className="flex">
                  <EventCard event={e} className="w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body max-w-measure text-body">
              A quiet stretch on the calendar here. The Monday Encore email carries the full list for all three places;{" "}
              <Link href="/calendar#subscribe" className="text-harbor-700 underline underline-offset-4">
                the box is here
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <CtaBand image={n.hero} eyebrow={`${n.name} · ${marketName(n.market)}`} title="Tell us the timing." body="When do you need to be in, and is there a house to sell first? Those two answers change everything else." minHeight="min-h-[440px]">
        <div className="flex flex-wrap justify-center gap-3.5">
          <ButtonLink href="/contact" variant="linen" dash>
            Start the conversation
          </ButtonLink>
          <ButtonLink href={`/listings?market=${n.market}`} variant="outline-light">
            Search {marketName(n.market)}
          </ButtonLink>
        </div>
      </CtaBand>
    </>
  );
}
