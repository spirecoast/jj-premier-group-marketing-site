import type { Metadata } from "next";
import { EqualHousingMark } from "@/components/equal-housing";
import { LeadForm } from "@/components/lead-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/content";
import { PRICE_OPTIONS } from "@/lib/content/filters";
import { MARKETS, isMarketSlug, marketName } from "@/lib/content/markets";
import { img } from "@/lib/content/seed/helpers";
import { formatPriceShort } from "@/lib/content/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Find your home",
  description:
    "Tell Joelyn and Jessica what you are looking for in Lakewood Ranch, Sarasota or Bradenton, and they will bring you the homes worth seeing, with a straight read on each one.",
  path: "/listings",
});

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FRAMES = {
  pool: img("library/modern-home-pool-dusk", "A modern home lit at dusk, the pool still", "50% 45%"),
  kitchen: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
};

/**
 * Until an MLS feed is licensed, the search is a conversation: the place and
 * the budget from the home page prefill the note, and the team does the
 * looking. Their live listings are one link away when the URL is configured.
 */
export default async function FindHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const settings = await getSiteSettings();
  const marketRaw = one(params.market);
  const market = isMarketSlug(marketRaw) ? marketRaw : undefined;
  const maxRaw = Number(one(params.max));
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : undefined;
  const maxLabel = max ? (PRICE_OPTIONS.find((p) => Number(p.value) === max)?.label ?? formatPriceShort(max)) : undefined;
  const opening = [
    market ? `Looking in ${marketName(market)}` : "Looking on the coast",
    maxLabel ? `up to ${maxLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <section className="relative -mt-header min-h-[520px] overflow-hidden bg-navy text-white lg:min-h-[600px]" aria-labelledby="find-title">
        <Photo image={FRAMES.pool} priority sizes="100vw" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+3rem)]">
          <p className="t-eyebrow text-mist text-shadow-photo">Find your home</p>
          <h1 id="find-title" className="t-hero max-w-[900px] text-white text-shadow-photo">
            Tell us what you are looking for. We will do the looking.
          </h1>
          <p className="max-w-[560px] text-[17px] font-medium leading-[1.6] text-white text-shadow-soft">
            The place, the budget, and anything that matters to you. You will hear back from Joelyn or
            Jessica, not a form.
          </p>
        </div>
      </section>

      <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.1fr] lg:gap-20" aria-label="Your search">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="How this works"
            title="Two questions, then the homes worth seeing."
            titleClassName="max-w-[520px]"
          />
          <ol className="flex flex-col gap-6 border-l border-rule pl-6">
            {[
              ["Where and how much", "Pick the place and the budget. If you are not sure yet, say so. That is a normal place to start."],
              ["We read every listing for you", "Flood zone, HOA, the age of the roof, what the street has been doing. You get the short list, and which ones we would go and see with you."],
              ["We go and look, together", "Showings at the hour the light tells the truth. Then a plain answer on each one, including the ones we would pass on."],
            ].map(([t, b], i) => (
              <li key={t} className="flex flex-col gap-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">0{i + 1}</p>
                <h3 className="t-h3 text-navy">{t}</h3>
                <p className="t-body max-w-measure text-body">{b}</p>
              </li>
            ))}
          </ol>
          {site.listingsUrl ? (
            <a href={site.listingsUrl} rel="noopener noreferrer" target="_blank" className="link-rule self-start">
              See our current listings
            </a>
          ) : null}
          <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
            <Photo image={FRAMES.kitchen} sizes="(min-width: 1024px) 560px, 100vw" />
          </div>
        </div>
        <div className="border border-hairline bg-white p-8 md:p-10">
          <p className="t-eyebrow mb-6 text-amber">Start here</p>
          <LeadForm
            form="buy"
            fields={["name", "email", "phone", "message"]}
            submitLabel="Start my search"
            placeholderMessage={`${opening}. Two or three bedrooms, near the water if we can, and we would like to be in by spring.`}
            hidden={{ market }}
            defaultMessage={market || maxLabel ? `${opening}. ` : undefined}
          />
        </div>
      </section>

      <div className="container-site pb-section">
        <div className="flex flex-col gap-3 border-y border-hairline py-4 md:flex-row md:items-center md:justify-between md:gap-10">
          <p className="t-mono-sm max-w-[820px] text-graphite-500">
            Serving {MARKETS.map((m) => m.name).join(", ")} with {settings.brokerageName}.
          </p>
          <p className="t-mono-sm flex shrink-0 items-center gap-2 text-graphite-500">
            <span aria-hidden="true">
              <EqualHousingMark />
            </span>
            Equal Housing Opportunity
          </p>
        </div>
      </div>
    </>
  );
}
