import type { Metadata, Route } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { CtaBand } from "@/components/cta-band";
import { EventCard } from "@/components/event-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { getNeighborhood, getNeighborhoodSlugs, getUpcomingEvents } from "@/lib/content";
import { getMarket, marketName } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";
import { DATASET_VERSION, checkedDate, evacuationSource, getAncestors, getChildren, getRecord, getRecordSlugs } from "@/lib/neighborhoods/data";
import { LEVEL_LABEL, STATUS_LABEL, TYPE_LABEL, hostOf, monthYear, titleCase } from "@/lib/neighborhoods/format";
import type { NeighborhoodRecord } from "@/lib/neighborhoods/types";
import { explorerHref } from "@/lib/neighborhoods/url";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

const PlaceMap = dynamic(() => import("@/components/place-map").then((m) => m.PlaceMap), {
  loading: () => <div className="explorer-hero-map" aria-hidden="true" />,
});

/** Hourly ISR: the calendar row is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const [records, editorial] = await Promise.all([getRecordSlugs(), getNeighborhoodSlugs()]);
  return [...new Set([...records, ...editorial])].map((slug) => ({ slug }));
}

async function load(slug: string) {
  const [record, editorial] = await Promise.all([getRecord(slug), getNeighborhood(slug)]);
  if (!record && !editorial) return undefined;
  const [children, ancestors] = record ? await Promise.all([getChildren(slug), getAncestors(slug)]) : [[], []];
  return { record, editorial, children, ancestors };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Neighborhood not found", robots: { index: false, follow: false } };
  const { record, editorial, ancestors } = data;
  const name = editorial?.neighborhood.name ?? record!.name;
  const market = (editorial?.neighborhood.market ?? record!.market) as MarketSlug;
  const where = ancestors.length ? ancestors.map((a) => a.name).join(" › ") : marketName(market);
  const description =
    editorial?.neighborhood.tagline ??
    record?.description ??
    `${name}, ${marketName(market)}: jurisdiction, ZIPs, zoned schools, evacuation zone, builders and association, from county and district sources.`;
  return pageMetadata({
    title: `${name} · ${where}${record?.type ? ` · ${TYPE_LABEL[record.type]}` : ""}`,
    description,
    path: `/neighborhoods/${slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
    // County-registry names are thin pages until researched; keep them out of the index.
    noIndex: Boolean(record && record.research === "registry-only" && !editorial),
  });
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 bg-white p-5">
      <dt className="t-mono-sm text-graphite-500">{label}</dt>
      <dd className="t-body text-body">{children}</dd>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-harbor-700 underline underline-offset-4 hover:text-navy">
      {children}
    </a>
  );
}

function facts(r: NeighborhoodRecord): { label: string; value: React.ReactNode }[] {
  const out: { label: string; value: React.ReactNode }[] = [];
  const statusDate = monthYear(checkedDate(r, "status"));
  const builderDate = monthYear(checkedDate(r, "activeBuilders"));
  if (r.type) out.push({ label: "Type", value: TYPE_LABEL[r.type] });
  if (r.jurisdiction) out.push({ label: "Jurisdiction", value: r.jurisdiction });
  if (r.county) out.push({ label: "County", value: `${r.county} County` });
  if (r.zips.length) out.push({ label: r.zips.length > 1 ? "ZIP codes" : "ZIP code", value: r.zips.join(", ") });
  if (r.status && statusDate) out.push({ label: `Status · as of ${statusDate}`, value: STATUS_LABEL[r.status] });
  if (r.developer) out.push({ label: "Developer", value: r.developer });
  if (r.activeBuilders.length) out.push({ label: `Builders selling · as of ${builderDate ?? monthYear(DATASET_VERSION)}`, value: r.activeBuilders.join(", ") });
  if (r.yearsBuilt) out.push({ label: "Years built", value: r.yearsBuilt });
  if (r.homeTypes.length) out.push({ label: "Home types", value: r.homeTypes.map(titleCase).join(", ") });
  if (r.homeCount) out.push({ label: "Homes", value: r.homeCount.toLocaleString() });
  if (r.gated !== null) out.push({ label: "Gated", value: r.gated ? "Yes" : "No" });
  if (r.waterAccess && r.waterAccess !== "none") out.push({ label: "Water", value: titleCase(r.waterAccess.replace("-", " ")) });
  if (r.hoa?.name) out.push({ label: "Association", value: r.hoa.website ? <ExternalLink href={r.hoa.website}>{r.hoa.name}</ExternalLink> : r.hoa.name });
  if (r.cdd) out.push({ label: "Community development district", value: <ExternalLink href={r.cdd.source}>{r.cdd.name}</ExternalLink> });
  if (r.officialUrl) out.push({ label: "Official site", value: <ExternalLink href={r.officialUrl}>{hostOf(r.officialUrl)}</ExternalLink> });
  return out;
}

export default async function NeighborhoodPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { record, editorial, children, ancestors } = data;

  const name = editorial?.neighborhood.name ?? record!.name;
  const market = (editorial?.neighborhood.market ?? record!.market) as MarketSlug;
  const marketInfo = getMarket(market);
  const n = editorial?.neighborhood;
  const listings = editorial?.listings ?? [];
  const active = listings.filter((l) => l.status !== "sold").slice(0, 3);
  const events = editorial?.events ?? (await getUpcomingEvents({ market, limit: 4, distinctVenues: true, datedFirst: true }));
  const faqs = (n?.faqs ?? []).map((f) => ({ q: f.q, a: f.answer, answer: f.answer }));
  const evacUrl = record ? evacuationSource(record) : undefined;
  const factRows = record ? facts(record) : [];
  const communities = children.filter((c) => c.level !== "enclave");
  const enclaves = children.filter((c) => c.level === "enclave");
  const parent = ancestors.at(-1);
  const mapPoints = record && record.lat !== null && record.lng !== null
    ? [
        { slug: record.slug, name: record.name, lng: record.lng, lat: record.lat, kind: "self" as const },
        ...children.filter((c) => c.lat !== null && c.lng !== null).map((c) => ({ slug: c.slug, name: c.name, lng: c.lng!, lat: c.lat!, kind: "child" as const })),
        ...(parent && parent.lat !== null && parent.lng !== null && !children.length ? [{ slug: parent.slug, name: parent.name, lng: parent.lng, lat: parent.lat, kind: "parent" as const }] : []),
      ]
    : [];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Atlas", path: "/neighborhoods" },
    ...ancestors.map((a) => ({ name: a.name, path: `/neighborhoods/${a.slug}` })),
    { name, path: `/neighborhoods/${slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {record ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Place",
            "@id": absoluteUrl(`/neighborhoods/${slug}`),
            name: record.name,
            alternateName: record.aliases.length ? record.aliases : undefined,
            description: record.description ?? undefined,
            url: absoluteUrl(`/neighborhoods/${slug}`),
            ...(record.lat !== null && record.lng !== null ? { geo: { "@type": "GeoCoordinates", latitude: record.lat, longitude: record.lng } } : {}),
            ...(parent ? { containedInPlace: { "@type": "Place", name: parent.name, url: absoluteUrl(`/neighborhoods/${parent.slug}`) } } : {}),
            ...(record.officialUrl ? { sameAs: record.officialUrl } : {}),
          }}
        />
      ) : null}
      {faqs.length ? <JsonLd data={faqJsonLd(faqs)} /> : null}

      {n ? (
        <section className="relative -mt-header min-h-[560px] overflow-hidden bg-navy text-white lg:min-h-[680px]" aria-labelledby="nb-title">
          <Photo image={n.hero} priority sizes="100vw" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+3rem)]">
            <Crumbs ancestors={ancestors} market={market} light />
            <h1 id="nb-title" className="t-hero max-w-[900px] text-white text-shadow-photo">
              {name}
            </h1>
            {n.tagline ? <p className="t-lead max-w-[560px] text-white text-shadow-soft">{n.tagline}</p> : null}
          </div>
        </section>
      ) : (
        <section className="container-site flex flex-col gap-6 pt-10 md:pt-14" aria-labelledby="nb-title">
          <Crumbs ancestors={ancestors} market={market} />
          <div className="flex flex-col gap-4">
            <p className="t-eyebrow text-amber">
              {record?.type ? TYPE_LABEL[record.type] : LEVEL_LABEL[record!.level]}
              {record?.jurisdiction ? ` · ${record.jurisdiction}` : ""}
            </p>
            <h1 id="nb-title" className="t-display max-w-[900px] text-navy">
              {name}
            </h1>
            {record?.aliases.length ? <p className="t-mono-sm text-graphite-500">Also {record.aliases.join(", ")}</p> : null}
          </div>
        </section>
      )}

      <section className="container-site grid gap-12 py-section lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-amber">The place</p>
          {n ? <RichText value={n.overview} /> : null}
          {record?.description && (!n || record.research === "full") ? <p className="t-lead max-w-measure text-body">{record.description}</p> : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {record ? (
              <Link href={explorerHref({ place: slug }) as Route} className="link-rule">
                See it on the map
              </Link>
            ) : null}
            <ShareButton title={`${name} · JJ Premier Group`} what="place-page" label="Share this place" />
          </div>
        </div>
        {mapPoints.length ? (
          <div className="self-start overflow-hidden border border-hairline">
            <PlaceMap slug={slug} points={mapPoints} />
          </div>
        ) : n?.stat ? (
          <aside className="flex flex-col gap-2 self-start border border-hairline bg-white p-7">
            <p className="t-stat text-navy">{n.stat.value}</p>
            <p className="t-label text-linen-700">{n.stat.label}</p>
            {n.stat.source ? <p className="t-mono-sm text-graphite-500">{n.stat.source}</p> : null}
          </aside>
        ) : null}
      </section>

      {factRows.length || record?.amenities.length ? (
        <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="particulars-title">
          <h2 id="particulars-title" className="t-eyebrow text-amber">
            The particulars
          </h2>
          <dl className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {factRows.map((f) => (
              <Fact key={f.label} label={f.label}>
                {f.value}
              </Fact>
            ))}
            {record?.amenities.length ? (
              <Fact label="Amenities, per the association or builder">{record.amenities.join(" · ")}</Fact>
            ) : null}
          </dl>
        </section>
      ) : null}

      {record && (record.zonedSchools || record.evacuationZone) && record.level !== "area" ? (
        <section className="container-site grid gap-8 pb-section lg:grid-cols-2 lg:gap-12" aria-label="Schools and evacuation zone">
          {record.zonedSchools ? (
            <div className="flex flex-col gap-4 border border-hairline bg-white p-7">
              <h2 className="t-eyebrow text-amber">Zoned schools</h2>
              <dl className="flex flex-col gap-3">
                {(
                  [
                    ["Elementary", record.zonedSchools.elementary],
                    ["Middle", record.zonedSchools.middle],
                    ["High", record.zonedSchools.high],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
                    <dt className="t-mono-sm text-graphite-500">{k}</dt>
                    <dd className="t-h4 text-right text-navy">{v ?? "Not listed"}</dd>
                  </div>
                ))}
              </dl>
              <p className="t-small text-body-muted">{record.zonedSchools.note}</p>
              <ExternalLink href={record.zonedSchools.sourceUrl}>Check an address with the district locator ↗</ExternalLink>
            </div>
          ) : null}
          {record.evacuationZone ? (
            <div className="flex flex-col gap-4 border border-hairline bg-white p-7">
              <h2 className="t-eyebrow text-amber">Storm evacuation</h2>
              <p className="t-h2 text-navy">{record.evacuationZone === "none" ? "Outside every evacuation zone" : `Evacuation zone ${record.evacuationZone}`}</p>
              <p className="t-small text-body-muted">
                {record.county === "Manatee" ? "Manatee County evacuation level" : "Sarasota County evacuation zone"} at the address point we checked. Zones follow property lines, so
                confirm a specific address with the county before you count on it.
              </p>
              {evacUrl ? <ExternalLink href={evacUrl}>Look up an address with the county ↗</ExternalLink> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {children.length ? (
        <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="inside-title">
          <SectionHeading
            eyebrow="Inside"
            title={<span id="inside-title">{children.length === 1 ? "One place" : `${children.length} places`} inside {name}.</span>}
            aside={<RuleLink href={explorerHref({ place: slug }) as Route}>Explore them on the map</RuleLink>}
          />
          {[
            ["Communities", communities],
            ["Enclaves", enclaves],
          ]
            .filter(([, list]) => (list as NeighborhoodRecord[]).length)
            .map(([label, list]) => (
              <div key={label as string} className="flex flex-col gap-3">
                {enclaves.length && communities.length ? <h3 className="t-mono-sm text-graphite-500">{label as string}</h3> : null}
                <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {(list as NeighborhoodRecord[]).map((c) => (
                    <li key={c.slug} className="flex items-baseline justify-between gap-3 border-b border-hairline py-2.5">
                      <Link href={`/neighborhoods/${c.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
                        {c.name}
                      </Link>
                      <span className="t-mono-sm shrink-0 text-graphite-500">{c.type ? TYPE_LABEL[c.type] : LEVEL_LABEL[c.level]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      ) : null}

      {n?.highlights.length ? (
        <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="highlights-title">
          <h2 id="highlights-title" className="t-eyebrow text-amber">
            What we tell people first
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

      {active.length ? (
        <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="nb-listings-title">
          <SectionHeading eyebrow="On the market" title={<span id="nb-listings-title">In {name} right now.</span>} aside={<RuleLink href={`/listings?market=${market}`}>Find your home in {marketName(market)}</RuleLink>} />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {active.map((l) => (
              <li key={l.slug} className="flex">
                <ListingCard listing={l} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {faqs.length ? (
        <section className="container-site grid gap-10 pb-section lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="nb-faq-title">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Questions people ask</p>
            <h2 id="nb-faq-title" className="t-h1 text-navy">
              Before you drive out to {name}.
            </h2>
            <p className="t-body max-w-measure text-body">The short answers. Ask us the long ones.</p>
          </div>
          <FaqAccordion items={faqs} />
        </section>
      ) : null}

      {record?.sources.length ? (
        <section className="container-site pb-section">
          <details className="group border border-hairline bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
              <span className="t-eyebrow text-amber">Sources · {record.sources.length}</span>
              <span className="font-mono text-[12px] text-graphite-500 transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <ul className="flex flex-col border-t border-hairline">
              {record.sources.map((s, i) => (
                <li key={`${s.url}-${i}`} className="grid gap-1 border-b border-hairline px-6 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-baseline">
                  <span className="flex flex-col gap-0.5">
                    <ExternalLink href={s.url}>{hostOf(s.url)}</ExternalLink>
                    <span className="t-mono-sm text-graphite-500">{s.supports}</span>
                  </span>
                  <span className="t-mono-sm text-graphite-500">checked {s.checked}</span>
                </li>
              ))}
            </ul>
          </details>
          <p className="t-mono-sm mt-3 text-graphite-500">
            Catalog as of {monthYear(DATASET_VERSION)}. Facts are as the source stated them on the checked date. No ratings, prices or statistics are drawn from them.
          </p>
        </section>
      ) : null}

      <section className="bg-linen-100">
        <div className="container-site flex flex-col gap-10 py-section" aria-labelledby="nb-events-title">
          <SectionHeading
            eyebrow="Encore Arts Calendar"
            title={<span id="nb-events-title">What is on in {marketName(market)} this month.</span>}
            aside={<RuleLink href={`/calendar?market=${market}`}>The full calendar</RuleLink>}
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

      <CtaBand
        image={n?.hero ?? marketInfo!.image}
        eyebrow={`${name} · ${marketName(market)}`}
        title="Tell us the timing."
        body="When do you need to be in, and is there a house to sell first? Those two answers change everything else."
        minHeight="min-h-[440px]"
      >
        <div className="flex flex-wrap justify-center gap-3.5">
          <ButtonLink href="/contact" variant="linen" dash>
            Start the conversation
          </ButtonLink>
          <ButtonLink href={`/listings?market=${market}`} variant="outline-light">
            Find your home in {marketName(market)}
          </ButtonLink>
        </div>
      </CtaBand>
    </>
  );
}

function Crumbs({ ancestors, market, light }: { ancestors: NeighborhoodRecord[]; market: MarketSlug; light?: boolean }) {
  const cls = light ? "t-eyebrow text-mist text-shadow-photo" : "t-mono-sm text-graphite-500";
  const link = light ? "hover:text-white" : "hover:text-navy";
  return (
    <nav aria-label="Breadcrumb" className={`${cls} flex flex-wrap items-center gap-x-3 gap-y-1`}>
      <Link href="/neighborhoods" className={link}>
        Atlas
      </Link>
      <span aria-hidden="true">/</span>
      <Link href={`/neighborhoods?market=${market}` as Route} className={link}>
        {marketName(market)}
      </Link>
      {ancestors.map((a) => (
        <span key={a.slug} className="flex items-center gap-x-3">
          <span aria-hidden="true">/</span>
          <Link href={`/neighborhoods/${a.slug}`} className={link}>
            {a.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}
