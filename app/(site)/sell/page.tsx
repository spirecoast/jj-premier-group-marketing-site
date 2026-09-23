import type { Metadata } from "next";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { Steps, type Step } from "@/components/steps";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getRecentSolds, getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Selling on the Suncoast",
  description:
    "The sold price, not the list. A number with the four comparable sales behind it, eight weeks of preparation that return their cost, and a first-weekend report on the Monday.",
  path: "/sell",
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Editorial photography for the page. Solds come from the content layer. */
const FRAMES = {
  hero: img("library/modern-home-pool-dusk", "A modern home lit at dusk, the pool still", "50% 45%"),
  contract: img("library/moment-contract", "A contract on a kitchen island", "50% 45%"),
};

/** Four steps. Harbor-led: shorter sentences, the number first. */
const STEPS: Step[] = [
  {
    when: "Day one · the walk-through",
    title: "We come to the house",
    body:
      "Both of us, and we walk it the way a buyer will. You'll get the number that day or the next, with the comparable sales behind it, and a short list of what we'd change before the photos.",
  },
  {
    when: "The weeks before · preparation",
    title: "Paint, light, the front door",
    body:
      "Those are the changes buyers notice first. A new kitchen rarely pays for itself before you sell, and we'll say so before you spend a dollar. Good photographers book up early, so we'll plan the date together.",
  },
  {
    when: "Going live",
    title: "The first weekend",
    body:
      "Photos in the afternoon light, live on a Thursday, showings from Friday. On Monday you'll hear how many came through, what they said, and whether the number is right.",
  },
  {
    when: "Contract to close",
    title: "The offers",
    body:
      "Every offer laid out side by side: price, financing, deposit, inspection period, whether the buyer has a house to sell. The highest isn't always the best, and we'll tell you which one is. Then inspection, appraisal and closing.",
  },
];

/** Asked at the kitchen island. The contract decides most of it. */
const FAQS: Faq[] = [
  {
    q: "How do you arrive at the number?",
    answer:
      "Recent closed sales near you, adjusted for the things that matter here: the water, the flood zone, the year of the roof, and which end of the street. Then we walk your house the way a buyer will. You get the number and the sales behind it in writing. A comparative market analysis from a REALTOR is not an appraisal; the buyer's lender orders that later.",
    a: (
      <>
        <p>
          Four closed sales from the last six months, inside half a mile, adjusted for the things that matter here: the
          water, the flood zone, the year of the roof, and which end of the street. Then we walk your house the way a
          buyer will. You get the number and the four addresses behind it, in writing.
        </p>
        <p className="mt-4">
          We won’t quote a number we know is too high to win the signature. If ours is lower than someone else’s,
          ask them for their four. A comparative market analysis from a licensed REALTOR® is not an appraisal;
          your buyer’s lender orders that later, and pricing to the comps is how it comes in at contract.
        </p>
      </>
    ),
  },
  {
    q: "What should I do to the house before it goes on the market?",
    answer:
      "Interior paint, updated light fixtures and a repainted front door are the cheapest changes buyers notice first. A new kitchen rarely returns its cost before you sell. Preparation takes about eight weeks and good photographers book early, so if you want to be live in March, start in October.",
    a: (
      <>
        <p>
          Interior paint, updated light fixtures, and a repainted front door are the three cheapest changes buyers
          notice first. A new kitchen rarely returns its cost before you sell, and we’ll say so before you spend it. The list we leave after the walk-through is usually a page long and costs less than a month of
          carrying the house.
        </p>
        <p className="mt-4">
          Prep takes eight weeks and the good photographers book six ahead. If you want to be live in March, we start
          in October.
        </p>
      </>
    ),
  },
  {
    q: "What does it cost to sell?",
    answer:
      "Three things on the closing statement: the Florida documentary stamp tax on the deed at $0.70 per $100 of the price, which the seller pays by custom on this coast; the owner's title policy, which the seller customarily pays in Manatee County and the buyer pays in Sarasota County; and commission, which is negotiable and set in the listing agreement. Add a few hundred dollars of title and recording fees and prorated taxes or HOA dues.",
    a: (
      <>
        <p>
          Three things, all on the closing statement. The state documentary stamp tax on the deed, at $0.70 per $100 of
          the price, which the seller pays by custom on this coast: $7,000 on a $1,000,000 sale. The owner’s title
          policy, which the seller customarily pays in Manatee and Hillsborough counties and the buyer pays in Sarasota
          County; at Florida’s promulgated rate that’s $5,075 on $1,000,000.
        </p>
        <p className="mt-4">
          And commission, which is negotiable and set in the listing agreement. Since August 2024, what you offer the
          buyer’s agent, if anything, is a separate line and a separate decision, and we walk you through both before
          you sign. Add a few hundred dollars of title and recording fees, and prorated taxes or HOA dues to the day
          of closing.
        </p>
      </>
    ),
  },
  {
    q: "When is the best time to list?",
    answer:
      "Buyers who close in this market arrive in February and are mostly gone by May, so the strongest listings go live in late January or February. A house that is ready and priced to the comps sells in summer too. The first weekend matters more than the month, so nothing goes live until the house is ready.",
    a: (
      <>
        <p>
          The buyers who close in this market arrive in February and are mostly gone by May, so our best listings go
          live on a Thursday in late January or February, photographed in the January light. Summer is not dead; a
          house that’s ready and priced to the comps sells in July too.
        </p>
        <p className="mt-4">
          What matters more than the month is the first weekend, which is why nothing goes live until the house is
          ready. Hurricane season runs June 1 to November 30, and a named storm stops insurance binding, which can
          pause a closing; we pick the closing date with that in mind.
        </p>
      </>
    ),
  },
  {
    q: "What happens after we accept an offer?",
    answer:
      "The buyer has an inspection period, usually seven to fifteen days, then the appraisal, then the lender's clear to close. Financed deals close in thirty to forty-five days, cash in about fourteen. Expect a request for a credit after the inspection, and expect us to say what is normal here and what is not.",
    a: (
      <>
        <p>
          The buyer has an inspection period, usually seven to fifteen days, then the appraisal, then the lender’s
          clear to close. Financed deals close in thirty to forty-five days; cash in about fourteen. Expect a request
          for a credit after the inspection, and expect us to tell you what is normal for this coast and what is not.
        </p>
        <p className="mt-4">
          You’ll hear from us on the same three days every week until closing: Monday with the showing report,
          Wednesday with the file, Friday with the calendar. If nothing changed, the message says so.
        </p>
      </>
    ),
  },
  {
    q: "Do I need to sell before I buy?",
    answer:
      "Usually it is a bridge of a few weeks, not a choice. A contract on your house with post-closing occupancy of up to sixty days is common here, and the standard Florida contract has a rider for it. We run both files from one desk so the closing dates line up on purpose.",
    a: (
      <>
        <p>
          Usually the answer is a bridge of a few weeks, not a choice. A contract on your house with post-closing
          occupancy of up to sixty days is common here, and the standard Florida contract has a rider for it. If you’re buying on the Ranch and selling in Bradenton, we run both files from one desk, so the two closing dates
          line up on purpose.
        </p>
        <p className="mt-4">Tell us the timing first. The order follows from it.</p>
      </>
    ),
  },
];

export default async function SellPage() {
  const [solds, testimonials] = await Promise.all([getRecentSolds(3), getTestimonials()]);
  const sellersFirst = [
    ...testimonials.filter((t) => /seller/i.test(t.attribution)),
    ...testimonials.filter((t) => !/seller/i.test(t.attribution)),
  ];
  const best = [...solds].sort((a, b) => (b.percentOfList ?? 0) - (a.percentOfList ?? 0))[0];

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      {/* Hero on Paper: the eyebrow, the headline, and a twilight exterior. */}
      <section className="container-site grid items-center gap-12 py-section lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-amber">Selling</p>
            <h1 className="t-display max-w-[640px] text-navy">The sold price, not the list.</h1>
          </div>
          <p className="t-lead max-w-[560px] text-body">
            Here is what we’d do: a number with the four comparable sales behind it, eight weeks of preparation
            that buyers can see in the photographs, and a report on the Monday after the first weekend.
          </p>
          <p className="t-body max-w-measure text-body">
            Some agents will quote a number they know is too high to win the signature, then spend six weeks talking
            you down. If our number is lower than someone else’s, ask them for the four comparable sales that support
            theirs.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <ButtonLink href="#valuation" dash>
              Start with the address
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" dash>
              Talk it through first
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-linen-100 lg:aspect-[4/5]">
          <Photo image={FRAMES.hero} priority sizes="(min-width: 1024px) 560px, 100vw" />
        </div>
      </section>

      {/* Four steps. */}
      <section className="container-site flex flex-col gap-10 pb-section">
        <SectionHeading
          eyebrow="How it goes"
          title="Four steps, from the walk-through to the closing table."
        />
        <Steps items={STEPS} />
      </section>

      {/* What the street actually did. */}
      {solds.length ? (
        <section className="container-site flex flex-col gap-10 pb-section">
          <SectionHeading
            eyebrow="Recently sold"
            title="What the street actually did."
            aside={<RuleLink href="/listings?status=sold">All solds</RuleLink>}
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {solds.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-hairline pt-5 md:flex-row md:items-baseline md:justify-between">
            {best?.percentOfList ? (
              <p className="t-body max-w-measure text-body">
                <span className="t-record text-navy">{best.percentOfList}% of list</span> on{" "}
                {best.address.street}, {best.daysOnMarket ?? "—"} days. Priced to the comps, that street cleared asking.
              </p>
            ) : null}
            <p className="t-mono-sm text-graphite-500">Sold prices · Stellar MLS closed sides · 2026</p>
          </div>
        </section>
      ) : null}

      {/* Start with the address. */}
      <section
        id="valuation"
        className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20"
      >
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow="What is my home worth" title="Start with the address." />
          <p className="t-body max-w-[440px] text-body">
            Street address and timing are enough. Joelyn or Jessica pulls the four comparable sales, drives the
            street, and calls you with the number and the reason for it. No listing agreement attached; the number is
            yours either way.
          </p>
          <p className="t-mono-sm max-w-[400px] text-graphite-500">
            A comp-based answer from Joelyn or Jessica soon after · no algorithm guess
          </p>
          <div className="relative hidden aspect-[4/3] overflow-hidden bg-linen-100 lg:block">
            <Photo image={FRAMES.contract} sizes="(min-width: 1024px) 420px, 100vw" />
          </div>
        </div>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <LeadForm
            form="sell"
            fields={["name", "email", "phone", "address", "timing", "message"]}
            submitLabel="Get the number"
            placeholderMessage="The year of the roof, anything you already know needs doing, and whether there’s a house to buy next."
          />
        </div>
      </section>

      {/* Sellers, in their words. */}
      {sellersFirst.length ? (
        <section className="bg-parchment">
          <div className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <SectionHeading eyebrow="Sellers, in their words" title="What they say after the closing." />
            <TestimonialSlider testimonials={sellersFirst} />
          </div>
        </section>
      ) : null}

      {/* The questions asked at the kitchen island. */}
      <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <SectionHeading eyebrow="Asked at the kitchen island" title="The number, the cost, and the calendar." />
          <p className="t-body max-w-[420px] text-body">
            One or two sentences each, because you have probably done this before. Florida contracts and county custom
            decide most of it, and we’ll say which is which.
          </p>
        </div>
        <FaqAccordion items={FAQS} />
      </section>
    </>
  );
}
