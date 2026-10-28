import { RuleLink } from "@/components/buttons";
import { WatchButton } from "@/components/watch/watch-button";
import { formatSaleAddress, getSalesManifest, salesForPlace, type County } from "@/lib/sales";
import { PLACE_SALES_COPY as C } from "./copy";
import { fmtDate, int, titleCase, usd } from "./format";

const COUNTY_NAME: Record<County, string> = { manatee: "Manatee", sarasota: "Sarasota" };

/**
 * "What sold in {place}" on an Atlas place page: the qualified sales the
 * county files under the place's own subdivisions (lib/sales/places.ts),
 * or, when it files none under that name, every sale in the place's ZIPs,
 * labelled as the ZIP area. Count, median resale, median price per square
 * foot, the newest few, the ZIP area for scale, the source line with each
 * county's through-date, a link into Tide Street and "Watch this place".
 * Renders nothing without sales data or a match. County figures, never the
 * Atlas dataset's (docs/SITE.md, Atlas display rules).
 */
export async function PlaceSales({ slug, name }: { slug: string; name: string }) {
  const [sales, manifest] = await Promise.all([salesForPlace(slug), getSalesManifest().catch(() => null)]);
  if (!sales || !manifest || (!sales.joined && !sales.zipArea)) return null;
  const months = manifest.windowMonths;
  const own = sales.joined;
  const figures = own ? own.summary : sales.zipArea!.summary;
  const zips = sales.place.zips.join(", ");
  const names = own ? C.names(own.names.slice(0, 3).map((n) => n.name), Math.max(0, own.names.length - 3)) : "";
  const counties = sales.counties.map((c) => manifest.counties[c]).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const through = sales.counties
    .map((c) => (manifest.counties[c]?.to ? `${COUNTY_NAME[c]} records through ${fmtDate(manifest.counties[c]!.to!)}` : null))
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="place-sales-title" data-place-sales={own ? "own" : "zip"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <h2 id="place-sales-title" className="t-h3 text-navy">
          {own ? C.titleOwn(name) : C.titleZip}
        </h2>
        <RuleLink href={`/sell/sold?${new URLSearchParams({ place: slug })}`}>{C.tideStreet}</RuleLink>
      </div>
      <p className="t-body max-w-measure text-body">{own ? C.introOwn(months, names) : C.introZip(months, zips)}</p>
      <dl className="grid gap-px border border-hairline bg-hairline sm:grid-cols-3">
        <Stat label={C.sales(months)} value={int.format(figures.count)} note={C.salesNote(figures.homes, figures.lots)} />
        <Stat label={C.median} value={figures.medianResalePrice ? usd.format(figures.medianResalePrice) : "—"} note={figures.medianResalePrice ? C.medianNote(figures.homes) : C.medianNone} />
        <Stat label={C.perSqft} value={figures.medianPricePerSqft ? usd.format(figures.medianPricePerSqft) : "—"} note={figures.medianPricePerSqft ? C.perSqftNote(figures.sqftSampleSize) : C.perSqftNone} />
      </dl>
      {own && own.newest.length ? (
        <div className="flex flex-col gap-3">
          <h3 className="t-label text-linen-700">{C.latest}</h3>
          <ul className="flex flex-col border-t border-hairline">
            {own.newest.map((r) => (
              <li key={`${r.parcelId}-${r.saleDate}`} className="grid gap-1 border-b border-hairline py-3 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
                <span className="t-body text-navy">{titleCase(formatSaleAddress(r))}</span>
                <span className="t-record text-graphite-600 tabular-nums">
                  {fmtDate(r.saleDate)} · {usd.format(r.salePrice)}
                  {r.livingArea ? ` · ${int.format(r.livingArea)} sq ft` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {own && sales.zipArea ? <p className="t-small max-w-measure text-body">{C.zipLine(zips, int.format(sales.zipArea.total), sales.zipArea.summary.medianResalePrice ? usd.format(sales.zipArea.summary.medianResalePrice) : null)}</p> : null}
        <p className="t-note">{C.source(counties.map((c) => c.label).join(" and "), through)}</p>
      </div>
      <WatchButton target={{ kind: "place", slug, name }} source="atlas" />
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-5">
      <dt className="t-mono-sm text-graphite-500">{label}</dt>
      <dd className="font-mono text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-none font-medium tracking-[-0.01em] text-navy tabular-nums">{value}</dd>
      <dd className="t-note">{note}</dd>
    </div>
  );
}
