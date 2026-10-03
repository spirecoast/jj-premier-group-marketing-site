import type { Metadata } from "next";
import { RuleLink } from "@/components/buttons";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { SOLD_COPY as C } from "@/components/sales/copy";
import { SoldSearch } from "@/components/sales/sold-search";
import { getSalesManifest } from "@/lib/sales";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const months = (await getSalesManifest())?.windowMonths ?? 24;
  return pageMetadata({
    title: "What sold on your street",
    description: `Every qualified sale the Manatee and Sarasota County Property Appraisers recorded on your street in the last ${months} months: address, date, price and living area, from the public record, not an estimate.`,
    path: "/sell/sold",
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/**
 * /sell/sold: the county's sales record by street, then the ask. The data
 * never reaches the browser whole; the client component calls /api/sales
 * for one street at a time. With no ingested data the page says so.
 */
export default async function SoldPage() {
  const manifest = await getSalesManifest();
  const asOf = manifest?.generatedAt ? manifest.generatedAt.slice(0, 10) : null;
  const counties = manifest ? Object.values(manifest.counties).map((c) => c.label) : [];
  const months = manifest?.windowMonths ?? 24;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sell", path: "/sell" },
          { name: "What sold on your street", path: "/sell/sold" },
        ])}
      />
      <Masthead route="/sell/sold" eyebrow={C.eyebrow} title={C.title} titleId="sold-title" titleClassName="max-w-[720px]" />
      <section className="container-site flex flex-col gap-7 py-section" aria-label="What the record shows">
        <p className="t-lead max-w-[560px] text-body">{C.lead}</p>
        <p className="t-body max-w-measure text-body">{C.body(months)}</p>
        <RuleLink href="/sell/home-value">With an address, start with the public record for the house itself</RuleLink>
      </section>
      <SoldSearch loaded={Boolean(manifest)} asOf={asOf} counties={counties} months={months} />
    </>
  );
}
