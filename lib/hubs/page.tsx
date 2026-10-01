import type { Metadata, Route } from "next";
import Link from "next/link";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getTeam, getVenues } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { getMarket } from "@/lib/content/markets";
import type { MarketSlug, Post } from "@/lib/content/types";
import { CATEGORY } from "@/lib/encore/categories";
import { clock, shortDay, through, weekdayShort } from "@/lib/encore/select";
import { encoreHref } from "@/lib/encore/url";
import { HUBS } from "@/lib/hubs/copy";
import { hubAtlas, hubGuides, hubWeek, type HubEncoreItem } from "@/lib/hubs/data";
import { DATASET_VERSION } from "@/lib/neighborhoods/data";
import { TYPE_LABEL, hostOf, monthYear } from "@/lib/neighborhoods/format";
import { explorerHref } from "@/lib/neighborhoods/url";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * The market hub, shared by the three explicit routes (app/(site)/lakewood-ranch,
 * /sarasota, /bradenton), each of which binds its slug and re-exports from here.
 */
export function hubMetadata(market: MarketSlug): Metadata {
  const copy = HUBS[market];
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    path: `/${market}`,
    fileImage: true, // opengraph-image.tsx beside each route
  });
}

const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

function GuideCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor">
      <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        <Photo image={post.cover} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="card-img" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{[post.edition, ...post.categories].filter(Boolean).join(" · ")}</p>
        <h3 className="t-h3 text-navy">{post.title}</h3>
        <p className="t-small text-body-muted">{post.excerpt}</p>
        <p className="t-record mt-auto pt-2 text-graphite-500">{formatDateLong(noon(post.publishedAt))}</p>
        <span className="card-line bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}

function WeekRow({ item }: { item: HubEncoreItem }) {
  const e = item.kind === "perf" ? item.o.e : item.e;
  const when = item.kind === "perf" ? `${weekdayShort(item.o.day)} ${shortDay(item.o.day)} · ${item.o.time ? clock(item.o.time) : "All day"}` : `On view · ${through(e) ?? "Open now"}`;
  return (
    <li className="border-b border-hairline" style={{ ["--cat" as string]: CATEGORY[e.c].color }}>
      <Link href={`/calendar/${e.s}`} className="row-link flex flex-col gap-1.5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
        <span className="t-mono-sm shrink-0 text-navy tabular-nums sm:w-[12rem]">{when}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-h4 text-navy">{e.t}</span>
          <span className="t-mono-sm text-graphite-500">
            {e.vn} · {CATEGORY[e.c].label}
            {e.so ? " · Sold out" : e.pr ? ` · ${e.pr}` : ""}
          </span>
        </span>
        <span className="row-arrow hidden font-mono text-amber sm:block" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "text-harbor-700 underline underline-offset-4 hover:text-navy";
  return href.startsWith("/") ? (
    <Link href={href as Route} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  );
}

/**
 * A market hub: the one page to read first before moving to, buying in or
 * selling in the place. Seven numbered sections in the site's grammar, every
 * count from the Atlas catalog, every fact from a page already on the site
 * or a source listed at the foot. Places, never people.
 */
export async function HubPage({ market }: { market: MarketSlug }) {
  const m = getMarket(market)!;
  const copy = HUBS[market];
  const [atlas, venues, guides, team] = await Promise.all([hubAtlas(market), getVenues(market), hubGuides(market), getTeam()]);
  const week = hubWeek(market);
  const faqs: Faq[] = copy.faqs.map((f) => ({ q: f.q, answer: f.answer, a: <p>{f.answer}</p> }));
  const path = `/${market}`;
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;
  const calendarHref = encoreHref({ market });
  const explorerLink = explorerHref({ filters: { market } });
  const lead = team[0];
  const countySplit =
    atlas.counties.length > 1 ? `${atlas.counties.map((c, i) => `${c.areas}${i === 0 ? " areas" : ""} in ${c.name} County`).join(" and ")}.` : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: m.name, path },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Place",
          "@id": absoluteUrl(path),
          name: `${m.name}, Florida`,
          url: absoluteUrl(path),
          description: copy.orientation.join(" "),
          image: absoluteUrl(m.image.src),
          containedInPlace: { "@type": "AdministrativeArea", name: `${m.county}, Florida` },
          ...(atlas.centroid ? { geo: { "@type": "GeoCoordinates", latitude: atlas.centroid.lat, longitude: atlas.centroid.lng } } : {}),
        }}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      {/* 01 · The place */}
      <section className="relative -mt-header min-h-[560px] overflow-hidden bg-navy text-white lg:min-h-[680px]" aria-labelledby="hub-title">
        <Photo image={m.image} priority sizes="100vw" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+3rem)]">
          <nav aria-label="Breadcrumb" className="t-eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-mist text-shadow-photo">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>{m.name}</span>
          </nav>
          <p className="t-eyebrow text-mist text-shadow-photo">01 · {m.county}, Florida</p>
          <h1 id="hub-title" className="t-hero max-w-[900px] text-white text-shadow-photo">
            {m.name}
          </h1>
          <p className="t-lead max-w-[640px] text-white text-shadow-soft">
            {copy.orientation[0]} {copy.orientation[1]}
          </p>
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            {lead ? (
              <ButtonLink href={`tel:${lead.phoneE164}`} variant="linen" dash>
                Call {lead.name.split(" ")[0]} · {lead.phone}
              </ButtonLink>
            ) : null}
            <ButtonLink href="#timing" variant="outline-light">
              Tell us the timing
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 02 · The places */}
      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="places-title">
        <SectionHeading
          number="02"
          eyebrow={`The places · ${site.atlasName}`}
          size="display"
          title={
            <span id="places-title">
              {atlas.areas.length} areas and {atlas.total.toLocaleString()} places in {m.name}, every one from a county or district source.
            </span>
          }
          titleClassName="max-w-[900px]"
          aside={<RuleLink href={explorerLink}>Explore {m.name} on the map</RuleLink>}
        />
        <p className="t-body max-w-measure text-body">
          {countySplit ? `${countySplit} ` : null}
          {atlas.researched.toLocaleString()} of the {atlas.total.toLocaleString()} places here are researched in full; the rest are county-registry names, which the map shows when you ask for all of them. Each area opens to the communities inside it, and each community to its page: jurisdiction, ZIPs, evacuation zone, who builds there and who runs the association.
        </p>
        <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {atlas.areas.map((a) => (
            <li key={a.slug} className="flex items-baseline justify-between gap-3 border-b border-hairline py-2.5">
              <span className="flex min-w-0 flex-col gap-0.5">
                <Link href={`/neighborhoods/${a.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
                  {a.name}
                </Link>
                <span className="t-mono-sm text-graphite-500">
                  {a.type ? TYPE_LABEL[a.type] : "Area"}
                  {atlas.counties.length > 1 && a.county ? ` · ${a.county} County` : ""}
                </span>
              </span>
              {a.inside ? (
                <span className="t-mono-sm shrink-0 text-graphite-500">
                  {a.inside} {a.inside === 1 ? "place" : "places"}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <dl className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 bg-white p-5">
            <dt className="t-mono-sm text-graphite-500">Community development districts</dt>
            <dd className="t-body text-body">
              {atlas.cdd ? `${atlas.cdd.toLocaleString()} ${atlas.cdd === 1 ? "place" : "places"} here carry a CDD on record, named and linked on its page.` : "None on record here."}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5 bg-white p-5">
            <dt className="t-mono-sm text-graphite-500">Evacuation zones checked</dt>
            <dd className="t-body text-body">
              {atlas.evacuation.checked
                ? `${atlas.evacuation.checked.toLocaleString()} places checked at an address point; ${atlas.evacuation.outside.toLocaleString()} of them sit outside every zone.`
                : "None checked yet."}
            </dd>
          </div>
        </dl>
        <p className="t-mono-sm text-graphite-500">
          Catalog as of {asOf}. Counts are places on the Atlas, not homes or sales. Nothing here is a rating, a price, or a description of who lives where.
        </p>
      </section>

      {/* 03 · What’s on */}
      <section className="bg-linen-100">
        <div className="container-site grid gap-12 py-section lg:grid-cols-[1.4fr_1fr] lg:gap-20" aria-labelledby="week-title">
          <div className="flex flex-col gap-8">
            <SectionHeading
              number="03"
              eyebrow={`What’s on · ${site.calendarName}`}
              title={
                <span id="week-title">
                  The next seven days in {m.name}.
                </span>
              }
              aside={<RuleLink href={calendarHref}>The {m.name} calendar</RuleLink>}
            />
            {week.items.length ? (
              <ul className="flex flex-col border-t border-hairline">
                {week.items.map((item) => (
                  <WeekRow key={item.kind === "perf" ? `${item.o.e.s}-${item.o.start}` : item.e.s} item={item} />
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
            <p className="t-mono-sm text-graphite-500">
              {week.performances
                ? `${week.performances} ${week.performances === 1 ? "performance" : "performances"} in ${m.name} from ${shortDay(week.today)} to ${shortDay(week.to)}, one row per production. `
                : ""}
              Times and tickets come from the venue; confirm before you go.
            </p>
          </div>
          <div className="flex flex-col gap-4 self-start border border-hairline bg-white p-7">
            <h3 className="t-eyebrow text-amber">
              The venues · {venues.length}
            </h3>
            {venues.length ? (
              <ul className="columns-1 gap-x-6 sm:columns-2 lg:columns-1">
                {venues.map((v) => (
                  <li key={v.slug} className="break-inside-avoid">
                    <Link href={`/venues/${v.slug}`} className="t-small -my-1 inline-block py-1 text-body transition-colors hover:text-navy">
                      {v.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-small text-body-muted">No venues listed here yet.</p>
            )}
            <Link href={calendarHref} className="link-rule self-start">
              Everything on in {m.name}
            </Link>
          </div>
        </div>
      </section>

      {/* 04 · Buying here, selling here */}
      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="buysell-title">
        <SectionHeading
          number="04"
          eyebrow="How it works here"
          size="display"
          title={<span id="buysell-title">Here’s how buying and selling work here.</span>}
        />
        <div className="grid gap-px border border-hairline bg-hairline lg:grid-cols-2">
          <div className="flex flex-col gap-5 bg-white p-7 lg:p-9">
            <h3 className="t-eyebrow text-amber">Buying here</h3>
            {copy.buying.map((para) => (
              <p key={para.slice(0, 40)} className="t-body max-w-measure text-body">
                {para}
              </p>
            ))}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              <RuleLink href="/buy">How buying with us goes</RuleLink>
              <RuleLink href={`/listings?market=${market}`}>Find your home in {m.name}</RuleLink>
            </div>
          </div>
          <div className="flex flex-col gap-5 bg-white p-7 lg:p-9">
            <h3 className="t-eyebrow text-amber">Selling here</h3>
            {copy.selling.map((para) => (
              <p key={para.slice(0, 40)} className="t-body max-w-measure text-body">
                {para}
              </p>
            ))}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              <RuleLink href="/sell">How selling with us goes</RuleLink>
              <RuleLink href="/valuation">What is my home worth</RuleLink>
            </div>
          </div>
        </div>
        <p className="t-mono-sm text-graphite-500">
          Nothing above is a figure. The county customs and the Florida rules are as the pages linked at the foot state them; confirm the particulars of a house with the title company, the association and your insurer.
        </p>
      </section>

      {/* 05 · Guides */}
      {guides.length ? (
        <section className="bg-linen-100">
          <div className="container-site flex flex-col gap-10 py-section" aria-labelledby="guides-title">
            <SectionHeading
              number="05"
              eyebrow={`Guides · ${site.reportLong}`}
              title={<span id="guides-title">What to read before you drive out to {m.name}.</span>}
              aside={<RuleLink href="/blog">Every guide and letter</RuleLink>}
            />
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {guides.map((p) => (
                <li key={p.slug} className="flex">
                  <GuideCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 06 · Questions people ask first */}
      <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="hub-faq-title">
        <div className="flex flex-col gap-5 lg:sticky lg:top-header lg:self-start">
          <SectionHeading number="06" eyebrow="Questions people ask first" title={<span id="hub-faq-title">Before you drive out to {m.name}.</span>} />
          <p className="t-body max-w-[420px] text-body">The short answers. If yours isn&rsquo;t here, ask us; we&rsquo;d rather answer it on the phone than have you guess.</p>
        </div>
        <FaqAccordion items={faqs} />
      </section>

      {/* Sources */}
      <section className="container-site pb-section">
        <details className="group border border-hairline bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="t-eyebrow text-amber">Sources · {copy.sources.length}</span>
            <span className="font-mono text-[12px] text-graphite-500 transition-transform group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <ul className="flex flex-col border-t border-hairline">
            {copy.sources.map((s) => (
              <li key={s.href} className="grid gap-1 border-b border-hairline px-6 py-3 last:border-b-0">
                <SourceLink href={s.href}>{s.href.startsWith("/") ? s.label : `${s.label} · ${hostOf(s.href)}`}</SourceLink>
                <span className="t-mono-sm text-graphite-500">{s.supports}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* 07 · The ask */}
      <section id="timing" className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="timing-title">
        <div className="flex flex-col gap-6">
          <SectionHeading number="07" eyebrow="Tell us the timing" title={<span id="timing-title">Two questions, and we take it from there.</span>} />
          <p className="t-body max-w-[440px] text-body">
            When do you need to be in {m.name}, and is there a house to sell first? Put whatever you know in the box. One of us will call or write back, and we&rsquo;ll start with those two questions.
          </p>
          <ul className="flex flex-col gap-3 border-t border-hairline pt-6">
            {team.map((t) => (
              <li key={t.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="t-h4 text-navy">{t.name}</span>
                <a href={`tel:${t.phoneE164}`} className="t-record text-navy transition-colors hover:text-harbor-700">
                  {t.phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="t-small text-body-muted">
            Selling first?{" "}
            <Link href="/sell" className="text-harbor-700 underline underline-offset-4 hover:text-navy">
              How selling with us goes
            </Link>
            .
          </p>
        </div>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <LeadForm
            form="buy"
            fields={["name", "email", "phone", "timing", "sellFirst", "message"]}
            submitLabel="Tell us the timing"
            hidden={{ market }}
            placeholderMessage={`Tell us where in ${m.name} you’re looking, what you need, and whether there’s a house to sell first.`}
          />
        </div>
      </section>
    </>
  );
}
