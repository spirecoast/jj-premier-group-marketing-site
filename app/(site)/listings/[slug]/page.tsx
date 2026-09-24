import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agent-card";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { EqualHousingMark } from "@/components/equal-housing";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { ListingCard, ListingTag } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatBand } from "@/components/stat-band";
import {
  getListing,
  getListingSlugs,
  getSimilarListings,
  getSiteSettings,
  getTeamMember,
} from "@/lib/content";
import {
  factsLine,
  formatAddress,
  formatBaths,
  formatDateLong,
  formatDateRecord,
  formatDateShort,
  formatNumber,
  formatPrice,
  pricePerSf,
} from "@/lib/content/format";
import { getMarket, marketName } from "@/lib/content/markets";
import type { Listing, RichText as RichTextValue, SiteSettings, Stat } from "@/lib/content/types";
import { breadcrumbJsonLd, listingJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getListingSlugs()).map((slug) => ({ slug }));
}

/** Date-only strings ("2026-06-12") parse as UTC midnight; pin them to noon so
    the site timezone never shows the day before. */
const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

function plainText(value: RichTextValue): string {
  return value
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => (typeof c.text === "string" ? c.text : "")).join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 0))}…`;
}

function place(l: Listing): string {
  return l.neighborhood ? `${l.neighborhood.name} · ${marketName(l.market)}` : marketName(l.market);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Nothing on that street", robots: { index: false, follow: false } };
  const lead = plainText(listing.description);
  return pageMetadata({
    title: `${listing.title}, ${listing.address.city} · ${formatPrice(listing.price)}`,
    description: truncate(`${factsLine(listing)} in ${place(listing)}. ${lead}`, 200),
    path: `/listings/${listing.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/** Copy for the inquiry card, by where the listing is in its life. */
function inquiryCopy(l: Listing) {
  if (l.status === "sold") {
    const when = l.soldDate ? formatDateLong(noon(l.soldDate)) : undefined;
    const pct = l.percentOfList ? `${l.percentOfList}% of list` : undefined;
    return {
      eyebrow: "Sold",
      title: ["Sold", when, pct ? `· ${pct}` : undefined].filter(Boolean).join(" "),
      body: "Ask about a home like this. We know which streets nearby are thinking about listing, and we’ll tell you which ones are worth waiting for.",
      submit: "Ask about this home",
      cta: "Ask about this home",
    };
  }
  if (l.status === "pending") {
    return {
      eyebrow: "Under contract",
      title: "Spoken for, for now.",
      body: "Contracts come back more often than people expect. Tell us the timing and you’re the first call if this one does, and the first to hear about the next one on this water.",
      submit: "Ask about this home",
      cta: "Ask about this home",
    };
  }
  if (l.tag === "coming-soon") {
    return {
      eyebrow: "Coming soon",
      title: `See ${l.address.street} first.`,
      body: "Showings begin the day it goes active on the MLS. Tell us the timing and we’ll hold a slot in that first week.",
      submit: "Ask to see it first",
      cta: "Ask to see it first",
    };
  }
  return {
    eyebrow: "See it",
    title: `See ${l.address.street} this week.`,
    body: "Either of us can show it and both of us know the file. Tell us the day, and whether there’s a house to sell first.",
    submit: "Request a showing",
    cta: "Request a showing",
  };
}

/** The MLS attribution and the Equal Housing line, as a band on every listing page. */
function ComplianceStrip({ settings }: { settings: SiteSettings }) {
  return (
    <div className="flex flex-col gap-3 border-y border-hairline py-4 md:flex-row md:items-center md:justify-between md:gap-10">
      <p className="t-mono-sm max-w-[820px] text-graphite-500">{settings.mlsAttribution}</p>
      <p className="t-mono-sm flex shrink-0 items-center gap-2 text-graphite-500">
        <span aria-hidden="true">
          <EqualHousingMark />
        </span>
        Equal Housing Opportunity · {settings.brokerageName}
      </p>
    </div>
  );
}

export default async function ListingPage({ params }: { params: Params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const [settings, similar, agent] = await Promise.all([
    getSiteSettings(),
    getSimilarListings(listing, 3),
    listing.agent ? getTeamMember(listing.agent.slug) : Promise.resolve(undefined),
  ]);

  const frames = listing.gallery.slice(0, 4);
  const photoCount = 1 + listing.gallery.length;
  const sold = listing.status === "sold";
  const inquiry = inquiryCopy(listing);
  const county = listing.county ?? getMarket(listing.market)?.county ?? "County";
  const address = formatAddress(listing.address);
  const mapsUrl = listing.geo
    ? `https://www.google.com/maps/search/?api=1&query=${listing.geo.lat},${listing.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const agentFirst = listing.agent?.name.split(" ")[0];

  const facts: { label: string; value: string; note?: string }[] = [
    { label: "BD", value: String(listing.beds) },
    { label: "BA", value: formatBaths(listing.baths) },
    { label: "SF", value: formatNumber(listing.sqft) },
    { label: "AC", value: listing.lotAcres ? listing.lotAcres.toFixed(2) : "—" },
    {
      label: listing.renovated ? "Built / renovated" : "Built",
      value: listing.yearBuilt ? String(listing.yearBuilt) : "—",
      note: listing.renovated,
    },
    { label: "MLS", value: listing.mlsNumber ?? "—" },
  ];

  const soldPrice = sold && listing.percentOfList ? Math.round((listing.price * listing.percentOfList) / 100) : undefined;
  const stats: Stat[] = [
    {
      value: pricePerSf(soldPrice ?? listing.price, listing.sqft),
      label: "Per SF",
      source: `${soldPrice ? "Sold" : "List"} price ÷ ${formatNumber(listing.sqft)} heated SF`,
    },
    {
      value: listing.daysOnMarket !== undefined ? String(listing.daysOnMarket) : "—",
      label: "Days on market",
      source: listing.listedAt ? `Listed ${formatDateShort(noon(listing.listedAt))} · Stellar MLS` : "Stellar MLS",
    },
    {
      value: listing.floodZone ?? "—",
      label: "Flood zone",
      source: "FEMA flood map, current panel · confirm with your insurer",
    },
    {
      value: listing.annualTaxes ? formatPrice(listing.annualTaxes) : "—",
      label: "Taxes",
      source: `2025 tax year · ${county} Property Appraiser`,
    },
  ];

  return (
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Listings", path: "/listings" },
          { name: listing.title, path: `/listings/${listing.slug}` },
        ])}
      />

      {/* Gallery: the hero and up to four frames. */}
      <section className="container-site flex flex-col gap-5 pt-8 md:pt-10" aria-label="Photographs">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 gap-y-1 t-mono-sm text-graphite-500">
          <Link href={"/listings" as Route} className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            Search
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/listings?market=${listing.market}` as Route} className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            {marketName(listing.market)}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-navy" aria-current="page">
            {listing.title}
          </span>
        </nav>
        <div className="grid gap-1.5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[270px_270px]">
          <div
            className={cn(
              "relative aspect-[3/2] overflow-hidden bg-linen-100 md:col-span-2 lg:row-span-2 lg:aspect-auto",
              frames.length ? "lg:col-span-2" : "lg:col-span-4",
            )}
          >
            <Photo
              image={listing.hero}
              priority
              sizes={frames.length ? "(min-width: 1024px) 624px, 100vw" : "(min-width: 1024px) 1248px, 100vw"}
            />
            <ListingTag listing={listing} className="absolute left-4 top-4" />
            <p className="t-mono-sm absolute bottom-4 right-4 bg-paper/95 px-3 py-2 text-navy">
              {photoCount === 1 ? "1 photo" : `All ${photoCount} photos`}
            </p>
          </div>
          {frames.length
            ? [0, 1, 2, 3].map((i) => {
                const frame = frames[i];
                return frame ? (
                  <div key={frame.src + i} className="relative aspect-[3/2] overflow-hidden bg-linen-100 lg:aspect-auto">
                    <Photo image={frame} sizes="(min-width: 1024px) 312px, (min-width: 768px) 50vw, 100vw" />
                  </div>
                ) : (
                  <div key={`blank-${i}`} className="hidden bg-linen-100 lg:block" aria-hidden="true" />
                );
              })
            : null}
        </div>
      </section>

      {/* Address, price, and the six facts. */}
      <section className="container-site flex flex-col gap-8 py-10 md:py-14" aria-labelledby="listing-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-amber">
              {listing.neighborhood ? (
                <>
                  <Link href={`/neighborhoods/${listing.neighborhood.slug}` as Route} className="-my-2 inline-block py-2 transition-colors hover:text-navy">
                    {listing.neighborhood.name}
                  </Link>
                  {" · "}
                </>
              ) : null}
              <Link href={`/listings?market=${listing.market}` as Route} className="-my-2 inline-block py-2 transition-colors hover:text-navy">
                {marketName(listing.market)}
              </Link>
            </p>
            <h1 id="listing-title" className="t-h1 text-navy">
              {listing.title}
            </h1>
            <p className="t-record text-graphite-600">{address}</p>
          </div>
          <div className="flex flex-col gap-2.5 lg:items-end lg:text-right">
            <p className="t-mono-sm text-graphite-500">{sold ? "List price" : listing.status === "pending" ? "List price · under contract" : "List price"}</p>
            <p className="t-stat text-navy">{formatPrice(listing.price)}</p>
            {sold ? (
              <p className="t-record uppercase text-graphite-600">
                Sold {listing.soldDate ? formatDateRecord(noon(listing.soldDate)) : ""}
                {listing.percentOfList ? ` · ${listing.percentOfList}% of list` : ""}
              </p>
            ) : (
              <p className="t-record uppercase text-graphite-600">
                {listing.daysOnMarket === 0 ? "New today" : listing.daysOnMarket !== undefined ? `${listing.daysOnMarket} days on market` : "On the market"}
                {listing.openHouse ? ` · ${listing.openHouse}` : ""}
              </p>
            )}
            <div className="pt-2">
              <ButtonLink href="#inquire" dash>
                {inquiry.cta}
              </ButtonLink>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-px border-y border-hairline bg-hairline md:grid-cols-6">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-1.5 bg-paper py-4 pl-4 pr-3 md:py-5 md:pl-5 [&:nth-child(3n+1)]:pl-0 md:[&:nth-child(3n+1)]:pl-5 md:first:pl-0"
            >
              <dt className="t-mono-sm text-graphite-500">{f.label}</dt>
              <dd className="font-mono text-[15px] font-medium tabular-nums text-navy">{f.value}</dd>
              {f.note ? <dd className="t-mono-sm text-graphite-500">{f.note}</dd> : null}
            </div>
          ))}
        </dl>
      </section>

      {/* The file: description, particulars, the friend note, the numbers, the map. Beside it, the agent and the form. */}
      <section className="container-site grid gap-14 pb-section lg:grid-cols-[1.4fr_1fr] lg:gap-20" aria-label="About this home">
        <div className="flex flex-col gap-14">
          <section aria-labelledby="about-title" className="flex flex-col gap-5">
            <h2 id="about-title" className="t-h2 text-navy">
              About {listing.address.street}
            </h2>
            <RichText value={listing.description} />
          </section>

          {listing.features.length ? (
            <section aria-labelledby="features-title" className="flex flex-col gap-5">
              <h2 id="features-title" className="t-h2 text-navy">
                The particulars
              </h2>
              <ul className="grid border-t border-hairline sm:grid-cols-2 sm:gap-x-10">
                {listing.features.map((f) => (
                  <li key={f} className="t-body border-b border-hairline py-3 text-body">
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {listing.friendNote ? (
            <section aria-labelledby="friend-title" className="flex flex-col gap-5 border border-hairline border-l-2 border-l-navy bg-white p-7 md:p-9">
              <div className="flex flex-col gap-3">
                <p className="t-eyebrow text-amber">Off the record</p>
                <h2 id="friend-title" className="t-h2 text-navy">
                  What we’d tell a friend.
                </h2>
              </div>
              <p className="t-quote max-w-measure text-navy">{listing.friendNote}</p>
              {agentFirst ? <p className="t-mono-sm text-graphite-500">— {agentFirst}</p> : null}
            </section>
          ) : null}

          <section aria-labelledby="numbers-title" className="flex flex-col gap-6">
            <h2 id="numbers-title" className="t-h2 text-navy">
              The numbers
            </h2>
            <StatBand stats={stats} className="border-t border-rule pt-6" />
          </section>

          <section aria-labelledby="map-title" className="flex flex-col gap-5">
            <h2 id="map-title" className="t-h2 text-navy">
              Where it is
            </h2>
            <div className="relative flex aspect-[2/1] items-center justify-center overflow-hidden border border-hairline bg-white p-6">
              <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" aria-hidden="true" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-hairline" aria-hidden="true" />
              <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rule" aria-hidden="true" />
              <div className="relative flex max-w-full flex-col items-center gap-3 bg-white px-6 py-4 text-center">
                <p className="t-mono-sm text-graphite-500">Map · {address}</p>
                {listing.geo ? (
                  <p className="t-record text-navy">
                    {listing.geo.lat.toFixed(4)}, {listing.geo.lng.toFixed(4)}
                  </p>
                ) : null}
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link-rule">
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-12 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start" aria-label="Your agent and the inquiry form">
          {agent ? (
            <div className="flex flex-col gap-5">
              <p className="t-eyebrow text-amber">{sold ? "Sold by" : "Listed by"}</p>
              <AgentCard member={agent} />
            </div>
          ) : null}
          <div id="inquire" className="flex scroll-mt-24 flex-col gap-7 border border-hairline bg-white p-7 md:p-8">
            <div className="flex flex-col gap-3">
              <p className="t-eyebrow text-amber">{inquiry.eyebrow}</p>
              <h2 className="t-h2 text-navy">{inquiry.title}</h2>
              <p className="t-body text-body">{inquiry.body}</p>
            </div>
            <LeadForm
              form="listing"
              fields={["name", "email", "phone", "message"]}
              submitLabel={inquiry.submit}
              columns={false}
              placeholderMessage="Saturday morning works, and there’s a house to sell first."
              hidden={{
                propertySlug: listing.slug,
                propertyTitle: listing.title,
                propertyStreet: listing.address.street,
                propertyCity: listing.address.city,
                propertyState: listing.address.state,
                propertyZip: listing.address.zip,
                propertyPrice: String(listing.price),
                propertyMls: listing.mlsNumber,
              }}
            />
          </div>
        </aside>
      </section>

      {similar.length ? (
        <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="similar-title">
          <SectionHeading
            eyebrow="Nearby"
            title={<span id="similar-title">See these the same afternoon.</span>}
            aside={<RuleLink href={`/listings?market=${listing.market}`}>All {marketName(listing.market)} listings</RuleLink>}
          />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {similar.map((l) => (
              <li key={l.slug} className="flex">
                <ListingCard listing={l} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="container-site pb-section" aria-label="Listing disclosures">
        <ComplianceStrip settings={settings} />
      </section>
    </>
  );
}
