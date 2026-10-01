import type { Metadata } from "next";
import { RuleLink } from "@/components/buttons";
import { HOME_VALUE_COPY as C } from "@/components/home-value/copy";
import { HomeValueLookup } from "@/components/home-value/home-value-lookup";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { getSalesManifest } from "@/lib/sales";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const months = (await getSalesManifest())?.windowMonths ?? 24;
  return pageMetadata({
    title: "What your house is worth",
    description: `No algorithm guess. The county's public record for your address: the last ${months} months of qualified sales on your street, the last sale the roll has for the house, what the record can't see, and then a written range from two people who have stood in it.`,
    path: "/sell/home-value",
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/**
 * /sell/home-value: the honest home value. Never a point value or a range
 * from a formula: the page shows the county's record for the street and
 * the address the seller types, says what the record can't see, and asks
 * for the walk-through. The data never reaches the browser whole; the
 * client component calls /api/sales for one address at a time.
 */
export default async function HomeValuePage() {
  const manifest = await getSalesManifest();
  const asOf = manifest?.generatedAt ? manifest.generatedAt.slice(0, 10) : null;
  const counties = manifest ? Object.values(manifest.counties).map((c) => c.label) : [];
  const months = manifest?.windowMonths ?? 24;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sell", path: "/sell" },
          { name: "What your house is worth", path: "/sell/home-value" },
        ])}
      />
      {/* The question, and what this page does with it. */}
      <section className="container-site flex flex-col gap-7 py-section">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">{C.eyebrow}</p>
          <h1 className="t-display max-w-[760px] text-navy">{C.title}</h1>
        </div>
        <p className="t-lead max-w-[600px] text-body">{C.lead}</p>
        <p className="t-body max-w-measure text-body">{C.body(months)}</p>
        <p className="t-mono-sm max-w-[560px] text-graphite-500">{C.mono}</p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          <li>
            <RuleLink href="/sell/sold">{C.links.sold}</RuleLink>
          </li>
          <li>
            <RuleLink href="/valuation">{C.links.valuation}</RuleLink>
          </li>
        </ul>
      </section>

      <HomeValueLookup loaded={Boolean(manifest)} asOf={asOf} counties={counties} months={months}>
        {/* 03 · What the record can't tell you. No figures: the list is of things, not numbers. */}
        <section className="border-t border-hairline">
          <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <div className="flex flex-col gap-6">
              <SectionHeading eyebrow={C.cant.eyebrow} title={C.cant.title} />
              <p className="t-body max-w-[440px] text-body">{C.cant.intro}</p>
            </div>
            <div className="flex flex-col gap-8">
              <dl className="grid gap-8 sm:grid-cols-2">
                {C.cant.items.map((i) => (
                  <div key={i.title} className="flex flex-col gap-2 border-t border-hairline pt-4">
                    <dt className="t-h3 text-navy">{i.title}</dt>
                    <dd className="t-body text-body">{i.body}</dd>
                  </div>
                ))}
              </dl>
              <p className="t-lead max-w-measure text-navy">{C.cant.outro}</p>
            </div>
          </div>
        </section>
      </HomeValueLookup>
    </>
  );
}
