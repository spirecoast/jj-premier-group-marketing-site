import type { Metadata } from "next";
import { RuleLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { Steps, type Step } from "@/components/steps";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { HOME_VALUE_COPY as C } from "@/components/home-value/copy";
import { HomeValueLookup } from "@/components/home-value/home-value-lookup";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { SectionHeading } from "@/components/section-heading";
import { getSalesManifest, type County } from "@/lib/sales";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const FRAMES = {
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 30%"),
};

/** Three steps, one phone call. */
const STEPS: Step[] = [
  {
    when: "Today",
    title: "You send the address",
    body:
      "Street address and timing are enough. If you know the year of the roof or what the house two doors down sold for, put it in the message; if not, we'll find out.",
  },
  {
    when: "Soon after",
    title: "We pull the comps and drive the street",
    body:
      "We pull recent closed sales nearby, adjusted for the water, the flood zone, and which end of the street. One of us drives it. Nobody prices a house right from a satellite picture.",
  },
  {
    when: "The call",
    title: "You get the number, and the reason for it",
    body:
      "You get a range in writing with the four addresses behind it, what we'd change before the photos, and what we wouldn't spend a dollar on. No listing agreement attached. The number is yours either way.",
  },
];

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
  const through = manifest ? (Object.entries(manifest.counties) as [County, { label: string; to: string | null }][]).map(([county, c]) => ({ county, label: c.label, to: c.to })) : [];
  const testimonials = await getTestimonials();
  const seller = testimonials.find((t) => /seller/i.test(t.attribution)) ?? testimonials[0];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sell", path: "/sell" },
          { name: "What your house is worth", path: "/sell/home-value" },
        ])}
      />
      {/* The question on the masthead, and what this page does with it underneath. */}
      <Masthead route="/sell/home-value" title={C.title} titleId="home-value-title" titleClassName="max-w-[760px]" />
      <section className="container-site flex flex-col gap-7 py-section" aria-label="What this page does">
        <p className="t-lead max-w-[600px] text-body">{C.lead}</p>
        <p className="t-body max-w-measure text-body">{C.body(months)}</p>
        <p className="t-note max-w-[560px]">{C.mono}</p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          <li>
            <RuleLink href="/sell/sold">{C.links.sold}</RuleLink>
          </li>
          <li>
            <RuleLink href="#ask">{C.links.valuation}</RuleLink>
          </li>
        </ul>
      </section>

      <HomeValueLookup loaded={Boolean(manifest)} asOf={asOf} counties={counties} months={months} through={through}>
        {/* 03 · What the record can't tell you. No figures: the list is of things, not numbers. */}
        <section className="border-t border-hairline">
          <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <div className="flex flex-col gap-6">
              <SectionHeading title={C.cant.title} />
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

      {/* 05 · Three steps, one phone call. */}
      <section className="container-site flex flex-col gap-10 py-section">
        <SectionHeading title={C.steps.title} aside={<RuleLink href="/sell">{C.steps.aside}</RuleLink>} />
        <Steps items={STEPS} columns={3} />
      </section>

      {/* 06 · One seller, in their words, and the two people who will call. */}
      {seller ? (
        <section className="bg-parchment">
          <div className="container-site grid items-center gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="relative aspect-[4/5] overflow-hidden bg-linen-100 sm:aspect-[4/3] lg:aspect-[4/5]">
              <Photo image={FRAMES.duo} sizes="(min-width: 1024px) 460px, 100vw" />
            </div>
            <div className="flex flex-col gap-8">
              <SectionHeading title={C.quote.title} />
              <TestimonialSlider testimonials={[seller]} />
              <p className="t-body max-w-[520px] text-body">{C.quote.body}</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
