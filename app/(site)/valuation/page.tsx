import type { Metadata } from "next";
import { RuleLink } from "@/components/buttons";
import { LeadForm } from "@/components/lead-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "What is my home worth",
  description:
    "A real number, from two people who have stood in the house. Send the address and the timing; Joelyn or Jessica pulls the four comparable sales, walks the street, and calls with the number and the reason for it.",
  path: "/valuation",
});

const FRAMES = {
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 30%"),
};

/** Three steps, one phone call. */
const STEPS = [
  {
    n: "01",
    when: "Today",
    title: "You send the address",
    body:
      "Street address and timing are enough. If you know the year of the roof or what the house two doors down sold for, put it in the message; if not, we will find out.",
  },
  {
    n: "02",
    when: "Within a day",
    title: "We pull the comps and drive the street",
    body:
      "Four closed sales from the last six months, inside half a mile, adjusted for the water, the flood zone, and which end of the street. One of us drives it. Nobody has priced a house correctly from a satellite.",
  },
  {
    n: "03",
    when: "The call",
    title: "You get the number, and the reason for it",
    body:
      "A range in writing with the four addresses behind it, what we would change before the photographs, and what we would not spend a dollar on. No listing agreement attached. The number is yours either way.",
  },
];

export default async function ValuationPage() {
  const testimonials = await getTestimonials();
  const seller = testimonials.find((t) => /seller/i.test(t.attribution)) ?? testimonials[0];

  return (
    <>
      {/* One question, one form. */}
      <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
        <div className="flex flex-col gap-7 lg:sticky lg:top-header lg:self-start">
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-amber">What is my home worth</p>
            <h1 className="t-display max-w-[600px] text-navy">A real number, from two people who have stood in the house.</h1>
          </div>
          <p className="t-lead max-w-[520px] text-body">
            Send the address and the timing, and Joelyn or Jessica will pull the four comparable sales, drive the
            street, and call you with the number and the reason for it.
          </p>
          <p className="t-mono-sm max-w-[420px] text-graphite-500">
            A comp-based answer from Joelyn or Jessica within a day · no algorithm guess
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm form="valuation" fields={["name", "email", "phone", "address", "timing"]} submitLabel="Get the number" />
          </div>
          <p className="t-small max-w-[560px] text-graphite-500">
            This is a comparative market analysis from a licensed broker associate, not an appraisal. If you sell, your
            buyer’s lender orders the appraisal; pricing to the comps is how it comes in at contract.
          </p>
        </div>
      </section>

      {/* Three steps. */}
      <section className="container-site flex flex-col gap-10 pb-section">
        <SectionHeading
          eyebrow="How it goes"
          title="Three steps, one phone call."
          aside={<RuleLink href="/sell">How selling with us goes</RuleLink>}
        />
        <ol className="grid gap-px border border-hairline bg-hairline md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-4 bg-white p-6 lg:p-7">
              <span className="t-stat text-navy" aria-hidden="true">
                {s.n}
              </span>
              <p className="t-record uppercase text-sky-700">{s.when}</p>
              <h3 className="t-h3 text-navy">{s.title}</h3>
              <p className="t-body text-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* One seller, in their words, and the two people who will call. */}
      {seller ? (
        <section className="bg-parchment">
          <div className="container-site grid items-center gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="relative aspect-[4/5] overflow-hidden bg-linen-100 sm:aspect-[4/3] lg:aspect-[4/5]">
              <Photo image={FRAMES.duo} sizes="(min-width: 1024px) 460px, 100vw" />
            </div>
            <div className="flex flex-col gap-8">
              <SectionHeading eyebrow="After the walk-through" title="What one seller said about the number." />
              <TestimonialSlider testimonials={[seller]} />
              <p className="t-body max-w-[520px] text-body">
                The number is the easy part. The page that comes with it, what we would change and what we would leave
                alone, is the part clients keep. The whole thing takes ninety minutes at your kitchen island and a day
                at ours.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
