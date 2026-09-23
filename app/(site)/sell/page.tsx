import type { Metadata } from "next";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { LeadForm } from "@/components/lead-form";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getRecentSolds, getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Selling on the Suncoast",
  description:
    "The sold price, not the list. A number with the four comparable sales behind it, eight weeks of preparation that return their cost, and a first-weekend report on the Monday.",
  path: "/sell",
});

/* Editorial photography for the page. Solds come from the content layer. */
const FRAMES = {
  hero: img("library/listing-twilight-exterior-pool", "A pool terrace at twilight, the house lit from inside", "50% 55%"),
  contract: img("library/moment-contract", "A contract on a kitchen island", "50% 45%"),
};

/** Four steps. Harbor-led: shorter sentences, the number first. */
const STEPS = [
  {
    n: "01",
    when: "Day 1 · ninety minutes",
    title: "The walk-through",
    body:
      "We come to the house, both of us, and walk it the way a buyer will. You get the number that day or the next, with the four comparable sales that support it, and a one-page list of what we would change before the photographs.",
  },
  {
    n: "02",
    when: "Weeks 1–8 · preparation",
    title: "Paint, light, the front door",
    body:
      "Those three are the changes buyers notice first. A new kitchen rarely pays for itself before you sell, and we will say so before you spend it. The good photographers book six weeks ahead, so if you want March, we start in October.",
  },
  {
    n: "03",
    when: "Week 9 · live on a Thursday",
    title: "The first weekend",
    body:
      "Photographs at four in the afternoon, live on Thursday, showings from Friday, and a report on Monday: how many came through, what they said, and whether the number is right.",
  },
  {
    n: "04",
    when: "Contract to close · 30–45 days",
    title: "The offer table",
    body:
      "Every offer in one table: price, financing, deposit, inspection period, whether the buyer has a house to sell. The highest is not always the best, and we will say which one is. Then inspection, appraisal, and a closing date that was on the calendar before we listed.",
  },
];

/** Asked at the kitchen island. The contract decides most of it. */
const FAQS: Faq[] = [
  {
    q: "How do you arrive at the number?",
    a: (
      <>
        <p>
          Four closed sales from the last six months, inside half a mile, adjusted for the things that matter here: the
          water, the flood zone, the year of the roof, and which end of the street. Then we walk your house the way a
          buyer will. You get the number and the four addresses behind it, in writing, within a day.
        </p>
        <p className="mt-4">
          We will not quote a number we know is too high to win the signature. If ours is lower than someone else’s,
          ask them for their four. A comparative market analysis from a licensed REALTOR® is not an appraisal;
          your buyer’s lender orders that later, and pricing to the comps is how it comes in at contract.
        </p>
      </>
    ),
  },
  {
    q: "What should I do to the house before it goes on the market?",
    a: (
      <>
        <p>
          Interior paint, updated light fixtures, and a repainted front door are the three cheapest changes buyers
          notice first. A new kitchen rarely returns its cost before you sell, and we will say so before you spend it. The list we leave after the walk-through is usually a page long and costs less than a month of
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
    a: (
      <>
        <p>
          Three things, all on the closing statement. The state documentary stamp tax on the deed, at $0.70 per $100 of
          the price, which the seller pays by custom on this coast: $7,000 on a $1,000,000 sale. The owner’s title
          policy, which the seller customarily pays in Manatee and Hillsborough counties and the buyer pays in Sarasota
          County; at Florida’s promulgated rate that is $5,075 on $1,000,000.
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
    a: (
      <>
        <p>
          The buyers who close in this market arrive in February and are mostly gone by May, so our best listings go
          live on a Thursday in late January or February, photographed in the January light. Summer is not dead; a
          house that is ready and priced to the comps sells in July too.
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
    a: (
      <>
        <p>
          The buyer has an inspection period, usually seven to fifteen days, then the appraisal, then the lender’s
          clear to close. Financed deals close in thirty to forty-five days; cash in about fourteen. Expect a request
          for a credit after the inspection, and expect us to tell you what is normal for this coast and what is not.
        </p>
        <p className="mt-4">
          You will hear from us on the same three days every week until closing: Monday with the showing report,
          Wednesday with the file, Friday with the calendar. If nothing changed, the message says so.
        </p>
      </>
    ),
  },
  {
    q: "Do I need to sell before I buy?",
    a: (
      <>
        <p>
          Usually the answer is a bridge of a few weeks, not a choice. A contract on your house with post-closing
          occupancy of up to sixty days is common here, and the standard Florida contract has a rider for it. If you
          are buying on the Ranch and selling in Bradenton, we run both files from one desk, so the two closing dates
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
      {/* Hero on Paper: the eyebrow, the headline, and a twilight exterior. */}
      <section className="container-site grid items-center gap-12 py-section lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-amber">Selling</p>
            <h1 className="t-display max-w-[640px] text-navy">The sold price, not the list.</h1>
          </div>
          <p className="t-lead max-w-[560px] text-body">
            Here is what we would do: a number with the four comparable sales behind it, eight weeks of preparation
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
          <p className="absolute bottom-4 left-4 t-mono-sm text-white text-shadow-soft">Twilight · the frame that gets opened first</p>
        </div>
      </section>

      {/* Four steps. */}
      <section className="container-site flex flex-col gap-10 pb-section">
        <SectionHeading
          eyebrow="How it goes"
          title="Four steps, from the walk-through to the closing table."
          aside={
            <p className="t-small max-w-[300px] text-body-muted lg:text-right">
              Nine weeks from the first walk-through to live, then thirty to forty-five days from contract to close.
              Cash is quicker.
            </p>
          }
        />
        <ol className="grid gap-px border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-4">
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
            A comp-based answer from Joelyn or Jessica within a day · no algorithm guess
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
            placeholderMessage="The year of the roof, anything you already know needs doing, and whether there is a house to buy next."
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
            decide most of it, and we will say which is which.
          </p>
        </div>
        <FaqAccordion items={FAQS} />
      </section>
    </>
  );
}
