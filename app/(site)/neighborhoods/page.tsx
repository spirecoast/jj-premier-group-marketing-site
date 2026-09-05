import type { Metadata, Route } from "next";
import Link from "next/link";
import { FilterChips, type Chip } from "@/components/filter-chips";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getNeighborhoods } from "@/lib/content";
import { MARKETS, getMarket, isMarketSlug, marketName } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Neighborhoods · Lakewood Ranch, Sarasota, Bradenton, Tampa",
  description:
    "The villages of Lakewood Ranch, the keys and the streets west of the Trail in Sarasota, the canal grids of Bradenton, and Hyde Park and Bayshore in Tampa: geography, HOA mechanics, flood zones and distances.",
  path: "/neighborhoods",
});

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NeighborhoodsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.market) ? params.market[0] : params.market;
  const market = isMarketSlug(raw) ? (raw as MarketSlug) : undefined;
  const neighborhoods = await getNeighborhoods(market);
  const active = market ? getMarket(market) : undefined;

  const chips: Chip[] = [
    { label: "All four markets", href: "/neighborhoods", active: !market },
    ...MARKETS.map((m) => ({ label: m.name, href: `/neighborhoods?market=${m.slug}`, active: market === m.slug })),
  ];

  return (
    <>
      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="nb-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="Neighborhoods"
          title={<span id="nb-title">The coast, from the Skyway to Venice.</span>}
          titleClassName="max-w-[760px]"
          aside={
            <p className="t-small max-w-[320px] text-body-muted md:text-right">
              The place, never the people: what was built when, who maintains what, where the water goes, and how long the drive is.
            </p>
          }
        />
        <FilterChips label="Market" chips={chips} />
        {active ? <p className="t-body max-w-measure text-body">{active.blurb}</p> : null}

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((n) => (
            <li key={n.slug} className="flex">
              <Link
                href={`/neighborhoods/${n.slug}`}
                className="card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor focus-visible:border-deep-harbor"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
                  <Photo image={n.hero} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="card-img" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{marketName(n.market)}</p>
                  <h2 className="t-h2 text-navy">{n.name}</h2>
                  {n.tagline ? <p className="t-small text-body-muted">{n.tagline}</p> : null}
                  {n.stat ? (
                    <p className="t-record mt-1 text-graphite-600" title={n.stat.source}>
                      {n.stat.value} · {n.stat.label}
                    </p>
                  ) : null}
                  <span className="card-line mt-auto bg-sky-300" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {neighborhoods[0]?.stat?.source ? (
          <p className="t-mono-sm text-graphite-500">{neighborhoods[0].stat.source}</p>
        ) : null}
      </section>

      <section className="bg-parchment">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Not on the list</p>
            <h2 className="t-h1 text-navy">Ask us about the street.</h2>
            <p className="t-body max-w-measure text-body">
              We cover more streets than we have pages for. Tell us the one you are looking at and we will tell you what we know about the water table.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Link href={"/contact" as Route} className="btn btn-navy">
              Tell us the timing
              <span className="btn-dash" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
