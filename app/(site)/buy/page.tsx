import type { Metadata } from "next";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { GuideHero, GuideNext, GuideSteps, type GuideLink, type GuideStep } from "@/components/guide";
import { WorkWith } from "@/components/home/work-with";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { getSiteSettings, getTeam } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The buyer's guide",
  description:
    "Buying a home in Lakewood Ranch, Sarasota or Bradenton in ten steps: your home wish list, your budget, getting prequalified, choosing the right agent, finding your home, financing, making an offer, the home inspection, the appraisal and closing day.",
  path: "/buy",
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Real photographs (Adobe Stock, none generated; IDs in docs/SITE.md). */
const FRAMES = {
  hero: img("library/hero-waterfront-palms-dock", "A white house with a red tile roof behind royal palms, with a dock on the water", "50% 55%"),
};

/**
 * Ten steps, in the order they happen, each with a photograph. The words are
 * Joelyn and Jessica's own; a { lead } or a { bold } opening is what they asked to set in bold.
 */
const STEPS: GuideStep[] = [
  {
    title: "Create your home wish list",
    body: [
      "Finding your perfect home begins with knowing what matters most to you. Think about your ideal location, preferred neighborhoods, style of home and the features that will make your everyday life more enjoyable.",
      "Start by identifying your must-haves and nice-to-haves. Consider everything from the home’s layout and amenities to the surrounding community and lifestyle.",
      "It’s also important to look beyond the home itself. Factors such as HOA fees, CDD assessments, flood zones and neighborhood features can all influence your decision.",
      { lead: "Our goal is to help you narrow down your options, explore communities that fit your needs and find a home that truly feels right for you." },
    ],
    image: img("library/lakefront-houses-palms", "Houses with balconies along a lake, under palms", "50% 55%"),
  },
  {
    title: "Establish your budget",
    body: [
      "Before beginning your home search, it’s important to determine a monthly payment that fits comfortably within your lifestyle and financial goals. Remember, what you’re approved to borrow isn’t necessarily what you’ll want to spend.",
      "Beyond your mortgage payment, consider additional expenses such as property taxes, homeowners and flood insurance, HOA fees, CDD assessments, and utilities.",
      "We’ll help you understand the true cost of homeownership so you can make informed decisions and confidently choose a home that fits both your lifestyle and budget.",
    ],
    image: img("library/listing-kitchen-4pm-island", "A kitchen island in afternoon light", "50% 50%"),
  },
  {
    title: "Get prequalified",
    body: [
      "Before beginning your home search, it’s important to understand your purchasing power. Getting prequalified is a simple first step that helps you estimate how much you may be able to borrow based on your income, credit, and financial goals.",
      "Knowing your price range allows you to focus on homes that fit both your lifestyle and your budget. We recommend speaking with a few lenders to compare interest rates, loan options, and closing costs.",
      "Having a prequalification letter from a trusted lender also shows sellers that you’re a serious buyer, helping you move forward with greater confidence when you find the perfect home.",
    ],
    image: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
  },
  {
    title: "Choose the right real estate agent",
    body: [
      "Choosing the right real estate agent is an important step in your home-buying journey. You deserve someone who understands the local market, listens to your needs, and provides knowledgeable guidance from your first showing to closing day.",
      "Before touring homes, you’ll be asked to review and sign a written buyer agreement outlining the services your agent will provide and how compensation will be handled.",
      { lead: "The right agent does more than help you find a home—they provide the expertise, communication, and support to help you make confident decisions every step of the way." },
    ],
    image: img("library/interior-living-kitchen-palm", "An open living room and kitchen with a palm outside", "50% 50%"),
  },
  {
    title: "Finding your perfect home",
    body: [
      "This is where the excitement begins! We’ll carefully select homes that align with your wish list, lifestyle, and budget, arranging showings that bring you one step closer to finding the perfect fit.",
      "As we explore each property, we’ll help you look beyond the beautiful finishes and consider important details, including the neighborhood, roof condition, flood zones, and HOA guidelines. We encourage you to experience the surrounding community at different times of the day to ensure it feels right to you.",
      "If you’re searching locally or relocating from another area, we’ll be there to guide you through every showing, in person or virtually, helping you make a confident and informed decision.",
      { lead: "Our goal is simple: to help you find more than a house, a place you’ll love calling home." },
    ],
    image: img("library/palm-lined-street", "A street lined with royal palms", "50% 50%"),
  },
  {
    title: "Securing your financing",
    body: [
      "Now that you’ve found the perfect home, it’s time to take the next step toward making it yours! Your lender will guide you through the final mortgage approval process, reviewing your income, credit, and financial information to confirm your loan eligibility.",
      "This is also the time to review your financing options, explore any available homebuyer assistance programs and discuss locking in an interest rate that works for you.",
      "During this important stage, it’s best to avoid making large purchases, opening new credit accounts, or making significant employment changes, as these could affect your loan approval.",
      "We’ll stay connected with you and your lender throughout the process, helping ensure everything stays on track for a smooth and successful closing.",
    ],
    image: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 50%"),
  },
  {
    title: "Making an offer",
    body: [
      "Once you’ve found the perfect home, it’s time to make an offer! We’ll help you determine a competitive offer based on recent sales of comparable homes, current market conditions, and the property’s value.",
      "A strong offer involves more than just the purchase price. We’ll guide you through important details such as financing, earnest money deposits, inspection timelines, and closing dates to help position your offer for success.",
      "Negotiations are a normal part of the process, and the seller may respond with a counteroffer. We’ll be by your side every step of the way, advocating for your best interests. Once all parties have signed and the contract becomes effective, your earnest money deposit will be placed in escrow within the timeframe specified in your contract.",
    ],
    image: img("library/moment-contract", "A pen on the signature line of a contract", "50% 55%"),
  },
  {
    title: "The home inspection",
    body: [
      "Once your offer is accepted, it’s time to take a closer look at your future home! A professional home inspection is an important step in understanding the property’s overall condition and identifying any potential concerns before moving forward.",
      "We’ll help coordinate inspections with qualified professionals who will evaluate the home’s major systems, structure, and overall condition.",
      { lead: "Our priority is to make sure you feel informed, protected, and confident in your investment before taking the next step toward closing." },
    ],
    image: img("library/screened-pool-lanai", "A pool under a screened cage, with pavers and palms", "50% 55%"),
  },
  {
    title: "The home appraisal",
    body: [
      "As part of the financing process, your lender will arrange for an independent appraisal to determine the home’s market value. This helps to ensure the property is worth the amount being financed.",
      "If the appraised value differs from the purchase price, there are several ways to move forward. From negotiating with the seller to exploring other solutions, we’ll help you understand your choices and determine the best next step toward your new home.",
    ],
    image: img("library/listing-living-room-terrazzo", "A sunlit living room with terrazzo floors", "50% 50%"),
  },
  {
    title: "Closing day—welcome home!",
    body: [
      "Here’s what to expect next.",
      { bold: "Review your final costs:", text: "You will receive a Closing Disclosure outlining your loan terms and final expenses prior to the closing." },
      { bold: "Complete your final walk-through:", text: "We’ll walk through the home with you to make sure everything is as expected." },
      { bold: "Sign & celebrate:", text: "Once all documents are signed, funds are received, and closing is complete, it’s time to get your keys!" },
      "Congratulations! Your next chapter begins!",
      { bold: "Important:", text: "Always confirm wiring instructions directly with your title company before sending funds." },
    ],
    image: img("library/moment-key-handoff", "A key in a front door, on a house-shaped key ring", "50% 40%"),
  },
];

const NEXT: GuideLink[] = [
  { href: "/listings", title: "Find your home", image: img("library/kitchen-white-palms", "", "50% 50%") },
  { href: "/relocate", title: "Plan the move", image: img("library/lakes-aerial-sunset", "", "50% 55%") },
  { href: "/neighborhoods/match", title: "Pick a neighborhood", image: img("library/golf-course-lakes-aerial", "", "50% 50%") },
];

/** Asked on the first call. Florida contracts and county custom decide most of it. */
const FAQS: Faq[] = [
  {
    q: "What is escrow, and where does my deposit go?",
    answer:
      "A neutral third party, usually the title company, holds your deposit and the paperwork until both sides have done what they promised. Under the standard Florida contract the deposit is due within three days of the effective date, and if the deal ends for a reason the contract allows, the money comes back to you from escrow.",
    a: (
      <>
        <p>
          A neutral third party, usually the title company, holds your deposit and the paperwork until both sides have
          done what they promised. It isn’t the seller’s account and it isn’t ours. Under the standard Florida
          contract the deposit is due within three days of the effective date, and if the deal ends for a reason the
          contract allows, the money comes back to you from escrow.
        </p>
        <p className="mt-4">
          You’ll hear the word used three ways: the account, the period between contract and closing, and the
          company holding it. All three are normal, and we’ll say which one we mean.
        </p>
      </>
    ),
  },
  {
    q: "What gets inspected, and what happens if something is wrong?",
    answer:
      "Inside the inspection period, fifteen days on the Florida AS IS contract unless we write in something shorter, a licensed inspector and a termite inspector go through the house, and on older homes we also order the four-point and wind mitigation reports your insurer will ask for. Then we sort the findings into cosmetic, ask the seller, and walk away. On an AS IS contract you can cancel inside the period and keep your deposit.",
    a: (
      <>
        <p>
          Inside the inspection period, which the Florida AS IS contract leaves at fifteen days unless we write in
          something shorter, a licensed inspector spends three to four hours in the house and a termite inspector spends
          one. On anything built before about 2006 we also order the four-point and the wind mitigation report, because
          your insurer will ask for both, and a good wind mitigation report can lower the premium.
        </p>
        <p className="mt-4">
          Then we sit down with the report and sort it into three piles: cosmetic, ask the seller, and walk away. On an
          AS IS contract you can cancel for any reason inside the period and keep your deposit. Most of the time the
          answer is a credit at closing rather than a repair, and we’ll tell you what is normal for this coast.
        </p>
      </>
    ),
  },
  {
    q: "Do I need flood insurance?",
    answer:
      "If the house is in a FEMA special flood hazard area, zones AE and VE on this coast, and you have a mortgage, your lender will require it. In zone X it is optional, though we often recommend it because the quotes tend to come in low. A policy bought outside a closing takes thirty days to begin, and Florida sellers must disclose past flood claims in writing.",
    a: (
      <>
        <p>
          If the house sits in a FEMA special flood hazard area, zones AE and VE on this coast, and you have a mortgage,
          your lender will require it. In zone X it is optional, and on the canal streets of West Bradenton we still
          recommend it because the quotes tend to come in low.
        </p>
        <p className="mt-4">
          Two things to know. An NFIP policy bought for a closing starts at closing, but one bought at any other time
          takes thirty days to begin. And since October 1, 2024, Florida sellers must disclose in writing whether they
          have filed a flood claim or received federal flood assistance on the house. We pull the flood map before you
          see the house, not after.
        </p>
      </>
    ),
  },
  {
    q: "What do closing costs come to, and who pays what?",
    answer:
      "Plan on roughly two to five percent of the price on top of the down payment: lender fees, the documentary stamp tax on the note, the intangible tax on the mortgage, prepaid taxes and insurance, and title. Who pays the owner's title policy depends on the county, and everything is negotiable in the contract. You see the estimate before you sign anything.",
    a: (
      <>
        <p>
          Plan on roughly two to five percent of the price on top of the down payment. The big items are lender fees, the documentary stamp tax
          on your note at $0.35 per $100, the intangible tax at $2 per $1,000 of the mortgage, prepaid taxes and
          insurance, and title.
        </p>
        <p className="mt-4">
          Who pays for the owner’s title policy changes at the county line: in Sarasota County the buyer customarily
          pays, in Manatee and Hillsborough the seller does, and Lakewood Ranch sits on that line. The inspection and
          the appraisal are paid out of pocket before closing; budget about $450 and $600 on a mid-priced house, more
          on a large one. Everything is negotiable in the contract, and you see the estimate before you sign anything.
        </p>
      </>
    ),
  },
  {
    q: "How long does it take, and when is the best time of year?",
    answer:
      "Three to four months from the first call to keys is typical when there is no house to sell first. Contract to close is the fixed part: thirty to forty-five days financed and about fourteen for cash. Listings arrive in February and thin out by August, and hurricane season, June through November, can pause a closing when a storm is named.",
    a: (
      <>
        <p>
          From the first call to keys, three to four months is typical when there’s no house to sell first. The search
          is the variable; contract to close is the fixed part, thirty to forty-five days financed and about fourteen
          for cash. Season listings arrive in February and thin out by August, and a house that’s priced to the comps
          still moves quickly in any month.
        </p>
        <p className="mt-4">
          Hurricane season runs June 1 to November 30. When a storm is named, insurance binding stops, which can pause
          a closing for a few days. We put that on the calendar in June rather than explaining it in September.
        </p>
      </>
    ),
  },
  {
    q: "How do we write an offer that wins without overpaying?",
    answer:
      "Price is one of five things a seller weighs, next to financing, deposit, inspection period and the closing date they need. We talk to the listing agent before we write anything, then we write to what the last sales on that street closed for, not the asking price.",
    a: (
      <>
        <p>
          The number is one of five columns. Financing type, the size of the deposit, the inspection period, whether
          you have a house to sell, and the closing date the seller actually needs all move a seller more than the last
          ten thousand dollars. Before we write anything we call the listing agent and ask what would make their
          seller’s week; the answer is usually a date.
        </p>
        <p className="mt-4">
          Then we look at what the last three sales on that street closed for, the sold price and not the list, and we
          write to that. Same coast, different streets, and the comps are the difference.
        </p>
      </>
    ),
  },
];

export default async function BuyPage() {
  const [team, settings] = await Promise.all([getTeam(), getSiteSettings()]);

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <GuideHero title="Buyer’s guide" image={FRAMES.hero} />

      {/* The first screen offers a choice: the listings, the move, the neighborhoods. The ten steps follow for anyone who scrolls. */}
      <GuideNext title="Where to start" links={NEXT} />

      <GuideSteps steps={STEPS} label="Buying, step by step" checklist="buy" tools={{ 1: "atlas-match", 2: "tide-sale-calculator", 7: "tide-street", 10: "atlas-move" }} />

      <WorkWith phoneDisplay={settings.primaryPhoneDisplay} phoneE164={settings.primaryPhoneE164} where="buy-work-with" />

      {/* The questions people are embarrassed to ask. */}
      <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <h2 className="t-h1 text-navy">The questions nobody is born knowing.</h2>
          <p className="t-body max-w-[420px] text-body">
            Florida contracts and county custom decide most of this, and we&rsquo;ll say which is which. If your question
            isn&rsquo;t here, it goes in the box at the bottom of the page.
          </p>
        </div>
        <FaqAccordion items={FAQS} />
      </section>

      {/* Tell us the timing. */}
      <section
        id="contact"
        className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20"
      >
        <div className="flex flex-col gap-6">
          <h2 className="t-h1 text-navy">Two questions, and we take it from there.</h2>
          <p className="t-body max-w-[440px] text-body">
            When do you need to be in, and is there a house to sell first? Put whatever you know in the box. One of us
            will call or write back, and we&rsquo;ll start with those two questions.
          </p>
          <ul className="flex flex-col gap-3 border-t border-hairline pt-6">
            {team.map((m) => (
              <li key={m.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="t-h4 text-navy">{m.name}</span>
                <a href={`tel:${m.phoneE164}`} className="t-record text-navy transition-colors hover:text-harbor-700">
                  {m.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <LeadForm
            form="buy"
            fields={["name", "email", "phone", "timing", "sellFirst", "message"]}
            submitLabel="Tell us the timing"
            placeholderMessage="Tell us where you’re looking, what you need, and whether there’s a house to sell first."
          />
        </div>
      </section>
    </>
  );
}
