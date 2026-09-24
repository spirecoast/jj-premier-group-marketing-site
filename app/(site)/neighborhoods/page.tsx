import type { Metadata, Route } from "next";
import Link from "next/link";
import { Explorer } from "@/components/explorer/explorer";
import { JsonLd } from "@/components/json-ld";
import { MARKETS } from "@/lib/content/markets";
import { DATASET_VERSION, getAllRecords } from "@/lib/neighborhoods/data";
import { monthYear } from "@/lib/neighborhoods/format";
import { parseState } from "@/lib/neighborhoods/url";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Neighborhood explorer · every place in Lakewood Ranch, Sarasota and Bradenton",
  description:
    "An interactive map of more than two thousand areas, communities and enclaves across Lakewood Ranch, Sarasota and Bradenton: who governs each one, its ZIPs, zoned schools, evacuation zone, builders and HOA, from county and district sources.",
  path: "/neighborhoods",
  fileImage: true, // opengraph-image.tsx beside this page
});

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The explorer, with a crawlable index of the areas underneath it so every
 * place has a path in from search engines even though the map is client-side.
 */
export default async function NeighborhoodsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const initial = parseState(params);
  const all = await getAllRecords();
  const areas = all.filter((r) => r.level === "area").sort((a, b) => a.name.localeCompare(b.name));
  const counts = { total: all.length, points: all.filter((r) => r.lat !== null).length };
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Neighborhoods", path: "/neighborhoods" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "JJ Premier Group neighborhood catalog",
          description: `${counts.total.toLocaleString()} areas, communities and enclaves in Lakewood Ranch, Sarasota and Bradenton, with jurisdiction, ZIPs, zoned schools, evacuation zones, builders and associations from county, district and builder sources.`,
          url: absoluteUrl("/neighborhoods"),
          dateModified: DATASET_VERSION,
          spatialCoverage: "Manatee and Sarasota counties, Florida",
        }}
      />

      <Explorer initial={initial} datasetVersion={DATASET_VERSION} asOf={asOf} />

      <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="areas-title">
        <div className="flex flex-col gap-3">
          <p className="t-eyebrow text-amber">The areas</p>
          <h2 id="areas-title" className="t-h1 max-w-[760px] text-navy">
            {areas.length} areas, {counts.total.toLocaleString()} places, every one from a county or district source.
          </h2>
          <p className="t-body max-w-measure text-body">
            Each area opens to the communities inside it, and each community to its page: jurisdiction, ZIPs, zoned schools, evacuation zone, who builds
            there and who runs the association. The map above is the fast way in; this list is the one you can read.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {MARKETS.map((m) => {
            const mine = areas.filter((a) => a.market === m.slug);
            return (
              <div key={m.slug} className="flex flex-col gap-3">
                <h3 className="t-h3 border-b border-hairline pb-2 text-navy">
                  <Link href={`/neighborhoods?market=${m.slug}` as Route} className="hover:text-harbor-700">
                    {m.name}
                  </Link>
                  <span className="t-mono-sm ml-2 text-graphite-500">{mine.length}</span>
                </h3>
                <ul className="columns-1 gap-x-6 sm:columns-2 md:columns-1 lg:columns-2">
                  {mine.map((a) => (
                    <li key={a.slug} className="break-inside-avoid">
                      <Link href={`/neighborhoods/${a.slug}`} className="t-small -my-1 inline-block py-1 text-body transition-colors hover:text-navy">
                        {a.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="t-mono-sm text-graphite-500">
          Catalog as of {asOf}. Facts carry their sources on each page. Nothing here is a rating, a price, or a description of who lives where.
        </p>
      </section>

      <section className="bg-parchment">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Not on the map</p>
            <h2 className="t-h1 text-navy">Ask us about the street.</h2>
            <p className="t-body max-w-measure text-body">
              We cover more streets than we have pages for. Tell us the one you’re looking at and we’ll tell you what we know about the water table.
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
