import type { Metadata } from "next";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { GuideHero, GuideNext, GuideSteps, type GuideLink, type GuideStep } from "@/components/guide";
import { WorkWith } from "@/components/home/work-with";
import { JsonLd } from "@/components/json-ld";
import { SoldByUs } from "@/components/sold-by-us";
import { ButtonLink } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The seller's guide",
  description:
    "Selling a home in Lakewood Ranch, Sarasota or Bradenton in eight steps: your reasons for selling, pricing your home, preparing it to sell, marketing, reviewing your offers, accepting one, preparing for closing and closing day.",
  path: "/sell",
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Real photographs (Adobe Stock, none generated; IDs in docs/SITE.md). */
const FRAMES = {
  hero: img("library/hero-mediterranean-pool-twilight", "A house with arched loggias at twilight, its windows and pool lit", "50% 60%"),
};

/**
 * Eight steps, in the order they happen, each with a photograph. The words are
 * Joelyn and Jessica's own; a { lead } or a { bold } opening is what they asked to set in bold.
 */
const STEPS: GuideStep[] = [
  {
    title: "Understand your reasons for selling",
    body: [
      "Every home sale begins with a goal. If you’re looking to maximize your return, move into your next home, or sell within a certain timeframe, understanding your priorities is the first step.",
      "We’ll take the time to learn what’s most important to you and create a personalized strategy that fits your needs. From pricing and timing to evaluating offers, we’ll guide you through each decision with your goals in mind.",
    ],
    image: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 50%"),
  },
  {
    title: "Price your home strategically",
    body: [
      "Setting the right price from the beginning is key to attracting buyers and maximizing your home’s value.",
      "We will carefully evaluate recent sales, current market conditions, and the unique features of your property to recommend a competitive listing price. Our goal is to position your home to attract serious buyers, generate strong interest, and achieve the best possible outcome.",
    ],
    image: img("library/lakefront-houses-palms", "Houses with balconies along a lake, under palms", "50% 55%"),
  },
  {
    title: "Prepare your home to sell",
    body: [
      "First impressions matter! A clean, welcoming, and well-maintained home helps buyers envision themselves living there. Simple improvements like decluttering, removing personal items, making minor repairs, and adding a fresh coat of paint can make a big difference.",
      "Before you spend money on updates, we’ll walk through your home together and recommend improvements that will have the greatest impact.",
      { lead: "Our goal is to help your home look its best while making smart decisions about where to invest your time and money." },
    ],
    image: img("library/kitchen-white-palms", "A white kitchen with palms outside the window", "50% 50%"),
  },
  {
    title: "Marketing your home",
    body: [
      "A successful sale starts with a strong marketing strategy. We’ll showcase your home with professional photography, compelling listing details, and exposure on the MLS and popular real estate websites. We’ll also connect with fellow agents to reach buyers actively searching in your area.",
      {
        bold: "Timing and presence are key.",
        text: "We will work together to determine the best time to list your home, making sure it’s ready to make a great first impression. Our goal is to attract qualified buyers, generate interest, and position your home for a successful sale.",
      },
    ],
    image: img("library/listing-twilight-exterior-pool", "A pool and a house lit at dusk", "50% 55%"),
  },
  {
    title: "Reviewing your offers",
    body: [
      "When offers come in, we’ll carefully review each one together. We will look beyond the purchase price and consider financing, earnest money deposits, inspection terms, and closing dates.",
      "We will also verify each buyer’s financial qualifications to help ensure a successful closing. If an offer doesn’t quite meet your expectations, we’ll discuss your options and negotiate terms that best support your goals.",
      { lead: "Our priority is to help you make a confident, informed decision and secure the best possible outcome for your sale." },
    ],
    image: img("library/listing-kitchen-4pm-island", "A kitchen island in afternoon light", "50% 50%"),
  },
  {
    title: "Accept an offer",
    body: [
      "Once you have chosen the right offer, we’ll carefully review the contract together, so you feel confident moving forward. We will explain the important details, including financing, inspections, contingencies, closing dates and costs.",
      "Once the contract is signed by both parties, the buyer’s deposit is placed in escrow according to the contract, and we begin working toward a successful closing.",
    ],
    image: img("library/moment-crossing-room", "Morning sun through white curtains", "50% 50%"),
  },
  {
    title: "Preparing for closing",
    body: [
      "As we approach closing day, we’ll guide you through the final steps of the selling process. While the buyer completes inspections, the appraisal, and any necessary surveys, we will help you handle any questions, repair requests or negotiations that may arise.",
      "We will also coordinate with the title company, keep you informed of important deadlines, and help ensure everything stays on track for a smooth and successful closing.",
    ],
    image: img("library/backyard-pool-sunset", "A backyard pool and lawn at sunset, the house beyond", "50% 55%"),
  },
  {
    title: "Closing day",
    body: [
      "Congratulations! You’ve reached the final step in selling your home. On closing day, you’ll sign the necessary documents, finalize any remaining details, and transfer ownership to the buyer.",
      "The title company will handle the final paperwork and distribute your proceeds after any outstanding mortgage balance and closing costs are paid.",
      "We will be there to guide you through the final details, coordinate the transfer of keys, and make sure you’re ready for a successful closing.",
    ],
    image: img("library/moment-key-handoff", "A key in a front door, on a house-shaped key ring", "50% 40%"),
  },
];

const NEXT: GuideLink[] = [
  { href: "/sell/home-value", title: "The record for your address", image: img("library/modern-home-pool-dusk", "", "50% 45%") },
  { href: "/sell/sold", title: "What sold on your street", image: img("library/palm-lined-street", "", "50% 50%") },
  { href: "/sell/net-proceeds", title: "What you'd keep at closing", image: img("library/listing-living-room-terrazzo", "", "50% 50%") },
];

/** Asked at the kitchen island. The contract decides most of it. */
const FAQS: Faq[] = [
  {
    q: "How do you arrive at the number?",
    answer:
      "We start with recent closed sales near you, adjusted for the things that matter here: the water, the flood zone, the year of the roof, and which end of the street. Then we walk your house the way a buyer will. You get the number and the sales behind it in writing. A comparative market analysis from a REALTOR® is not an appraisal; the buyer's lender orders that later.",
    a: (
      <>
        <p>
          We pull four closed sales from the last six months, inside half a mile, adjusted for the things that matter here: the
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
      "There are three things on the closing statement: the Florida documentary stamp tax on the deed at $0.70 per $100 of the price, which the seller pays by custom on this coast; the owner's title policy, which the seller customarily pays in Manatee County and the buyer pays in Sarasota County; and commission, which is negotiable and set in the listing agreement. Add a few hundred dollars of title and recording fees and prorated taxes or HOA dues.",
    a: (
      <>
        <p>
          There are three things, all on the closing statement. The first is the state documentary stamp tax on the deed, at $0.70 per $100 of
          the price, which the seller pays by custom on this coast: $7,000 on a $1,000,000 sale. The second is the owner’s title
          policy, which the seller customarily pays in Manatee and Hillsborough counties and the buyer pays in Sarasota
          County; at Florida’s promulgated rate that’s $5,075 on $1,000,000.
        </p>
        <p className="mt-4">
          The third is commission, which is negotiable and set in the listing agreement. Since August 2024, what you offer the
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
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <GuideHero title="Seller’s guide" image={FRAMES.hero} />

      <GuideSteps steps={STEPS} label="Selling, step by step" checklist="sell" tools={{ 2: "tide-street", 8: "tide-sale-calculator" }} />

      <GuideNext title="The public record first" links={NEXT} />

      {/* The team's own recent sales, with the percent of list on each card; nothing until the agents enter them. */}
      <SoldByUs tone="parchment" />

      <WorkWith phoneDisplay={settings.primaryPhoneDisplay} phoneE164={settings.primaryPhoneE164} where="sell-work-with" />

      {/* The questions asked at the kitchen island. */}
      <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <h2 className="t-h1 text-navy">They ask about the number, the cost and the calendar.</h2>
          <p className="t-body max-w-[420px] text-body">
            One or two sentences each, because you have probably done this before. Florida contracts and county custom
            decide most of it, and we&rsquo;ll say which is which.
          </p>
        </div>
        <FaqAccordion items={FAQS} />
      </section>

      {/* Start with the address. */}
      <section
        id="valuation"
        className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20"
      >
        <div className="flex flex-col gap-6">
          <h2 className="t-h1 text-navy">Start with the address.</h2>
          <p className="t-body max-w-[440px] text-body">
            Street address and timing are enough. Joelyn or Jessica pulls the four comparable sales, drives the
            street, and calls you with the number and the reason for it. No listing agreement attached; the number is
            yours either way.
          </p>
          <p className="t-note max-w-[400px]">
            A comp-based answer from Joelyn or Jessica soon after · no algorithm guess
          </p>
        </div>
        {/* The ask itself lives on /sell/home-value, so a seller never meets the same form twice. */}
        <div className="flex flex-col items-start gap-4 lg:pt-2">
          <ButtonLink href="/sell/home-value#ask" dash>
            Get the number
          </ButtonLink>
          <p className="t-note">The address, the timing, and anything you already know about the house.</p>
        </div>
      </section>
    </>
  );
}
