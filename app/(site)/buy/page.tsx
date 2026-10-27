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
    "Buying a home in Lakewood Ranch, Sarasota or Bradenton in ten steps: your wish list, your budget, prequalifying, choosing an agent, the search, financing, the offer, the inspection, the appraisal and closing.",
  path: "/buy",
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Real photographs (Adobe Stock, none generated; IDs in docs/SITE.md). */
const FRAMES = {
  hero: img("library/hero-waterfront-palms-dock", "A white house with a red tile roof behind royal palms, with a dock on the water", "50% 55%"),
};

/** Ten steps, in the order they happen, each with a photograph. */
const STEPS: GuideStep[] = [
  {
    title: "Make your wish list",
    body:
      "Start with where and what: the towns you'd consider, the kind of house, and the things you won't give up. Then split the list into must-haves and nice-to-haves. Here the street matters as much as the house, because the HOA, the CDD and the flood zone come with the address. Atlas Match narrows every neighborhood to the ones that fit your list.",
    image: img("library/lakefront-houses-palms", "Houses with balconies along a lake, under palms", "50% 55%"),
  },
  {
    title: "Work out your budget",
    body:
      "Start from the monthly payment you're comfortable with, not the top price a lender will approve. On this coast the mortgage is only part of it: add property taxes, homeowners and flood insurance, HOA dues, any CDD assessment, and trash and water. We'll get real insurance quotes on the streets you like before you fall for a house.",
    image: img("library/listing-kitchen-4pm-island", "A kitchen island in afternoon light", "50% 50%"),
  },
  {
    title: "Get prequalified",
    body:
      "A prequalification is a lender's quick read of your income, debts and credit. It shows roughly what you could borrow, which isn't always what you'd want to pay each month. Talk to two or three lenders to compare rates and fees. A letter from a lender who works here tells a listing agent your offer is real.",
    image: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
  },
  {
    title: "Choose your agent",
    body:
      "Since August 2024 you sign a written agreement with a buyer's agent before you tour homes together. It says what the agent will do for you and how they're paid, so read it before you sign. In Florida, agents work as transaction brokers unless you agree otherwise in writing. Choose someone who knows the streets as well as the contract.",
    image: img("library/interior-living-kitchen-palm", "An open living room and kitchen with a palm outside", "50% 50%"),
  },
  {
    title: "Find the right home",
    body:
      "We'll set up showings that fit your list and your budget, and the search sharpens with every house you see. Drive the street at rush hour and again after dark, and check the flood map, the roof's age and the HOA rules before you fall for the kitchen. Buying from out of town? We'll walk each house with you on a live video call and open the closets.",
    image: img("library/palm-lined-street", "A street lined with royal palms", "50% 50%"),
  },
  {
    title: "Finalize your financing",
    body:
      "Once you've found the house, go back to your lender for full approval. They'll verify your income, assets and credit, and you can lock your rate once you're under contract. Ask which loan fits: conventional, FHA or VA, and whether you qualify for one of Florida Housing's first-time buyer programs. Don't open new credit or change jobs until you've closed.",
    image: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 50%"),
  },
  {
    title: "Make an offer",
    body:
      "We'll price the offer from what similar homes nearby have closed for, not the asking price. A seller weighs more than the price: the financing, the deposit, the inspection period and the closing date. Expect a counteroffer or two. Once both sides sign, the contract is in effect and your deposit goes to escrow, usually within three days.",
    image: img("library/moment-contract", "A pen on the signature line of a contract", "50% 55%"),
  },
  {
    title: "Have the home inspected",
    body:
      "On the standard Florida AS IS contract you have fifteen days to inspect unless we agree on something shorter. A licensed inspector and a termite inspector go through the house, and on older homes we order the four-point and wind mitigation reports your insurer will ask for. If something serious turns up, you can renegotiate, or cancel inside that window and get your deposit back.",
    image: img("library/screened-pool-lanai", "A pool under a screened cage, with pavers and palms", "50% 55%"),
  },
  {
    title: "Get the appraisal",
    body:
      "Your lender sends an independent appraiser to confirm the home is worth what you're paying. If it comes in low, the lender will only lend against the lower value. You can ask the seller to come down, cover the difference yourself, or ask the lender to reconsider using sales we provide. If your contract has an appraisal contingency, you can also walk away.",
    image: img("library/listing-living-room-terrazzo", "A sunlit living room with terrazzo floors", "50% 50%"),
  },
  {
    title: "Close and get the keys",
    body:
      "The title company and your lender prepare the papers, and your Closing Disclosure shows the final numbers at least three business days before you sign. Plan on two to five percent of the price in closing costs on top of the down payment. Before you wire money, call the title company at a number you already know to confirm the instructions. We'll do the final walk-through with you and hand over the keys.",
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

      <GuideSteps steps={STEPS} label="Buying, step by step" />

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
