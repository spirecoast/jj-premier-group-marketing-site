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
    "Buying in Lakewood Ranch, Sarasota or Bradenton in eight steps, from the first call to the keys: timing, pre-approval, the places, the showings, the offer, the inspection, escrow and closing.",
  path: "/buy",
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Real photographs (Adobe Stock, none generated; IDs in docs/SITE.md). */
const FRAMES = {
  hero: img("library/hero-waterfront-palms-dock", "A white house with a red tile roof behind royal palms, with a dock on the water", "50% 55%"),
};

/** Eight steps, in the order they happen, and a photograph after each of the first seven. */
const STEPS: GuideStep[] = [
  {
    title: "Tell us the timing",
    body:
      "When do you need to be in, and is there a house to sell first? Those two answers set the budget, the streets and which Saturday we start. If you're moving here from somewhere else, the relocation planner puts the move in order.",
    image: img("library/place-skyway-bridge", "The Sunshine Skyway Bridge over Tampa Bay", "50% 55%"),
  },
  {
    title: "Get pre-approved",
    body:
      "Before we look at anything, get a pre-approval letter from a local lender. It's the first thing a seller here reads, and it tells you the monthly payment as well as the price. We'll introduce you to lenders in Manatee and Sarasota counties.",
    image: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
  },
  {
    title: "Pick the places",
    body:
      "Lakewood Ranch, Sarasota and Bradenton sell differently, street by street. If you haven't picked a neighborhood yet, answer ten questions and Atlas narrows the map to the places that fit. Then we'll tell you the flood zone, the HOA and what each street has been selling for.",
    image: img("library/golf-course-lakes-aerial", "Fairways and lakes between houses, from above", "50% 50%"),
  },
  {
    title: "See the homes worth seeing",
    body:
      "You'll get every listing that fits, and we'll tell you which ones we'd actually go and see with you. You'll know the age of the roof before you get in the car. If you're buying from away, we walk the house on video, slowly, and open the closets.",
    image: img("library/palm-lined-street", "A street lined with royal palms", "50% 50%"),
  },
  {
    title: "Write the offer",
    body:
      "Price is one of five things a seller weighs, next to financing, deposit, the inspection period and the closing date they need. We'll call the listing agent before we write anything, then write to what the last sales on that street closed for, not the asking price.",
    image: img("library/moment-contract", "A pen on the signature line of a contract", "50% 55%"),
  },
  {
    title: "Have the house inspected",
    body:
      "Inside the inspection period, fifteen days on the Florida AS IS contract unless we write in something shorter, a licensed inspector and a termite inspector go through the house. On anything built before about 2006 we also order the four-point and wind mitigation reports your insurer will ask for. Then we sort what they find into cosmetic, ask the seller, and walk away.",
    image: img("library/screened-pool-lanai", "A pool under a screened cage, with pavers and palms", "50% 55%"),
  },
  {
    title: "Escrow, appraisal and insurance",
    body:
      "A title company holds your deposit until closing. Your lender orders the appraisal, and if it comes in low, we go back to the sales and to the listing agent. If the house is in flood zone AE or VE and you have a mortgage, your lender will require flood insurance, so we pull the flood map before you see the house.",
    image: img("library/listing-living-room-terrazzo", "A sunlit living room", "50% 50%"),
  },
  {
    title: "Close and get the keys",
    body:
      "Contract to closing takes thirty to forty-five days with a mortgage and about fourteen with cash. Plan on roughly two to five percent of the price in closing costs on top of the down payment, and you'll see the estimate before you sign anything. We'll be at the walk-through, and we'll hand you the keys.",
    image: img("library/moment-key-handoff", "A key in a front door, on a house-shaped key ring", "50% 40%"),
  },
];

const NEXT: GuideLink[] = [
  { href: "/listings", title: "Find your home", image: img("library/kitchen-white-palms", "", "50% 50%") },
  { href: "/relocate", title: "Plan the move", image: img("library/lakes-aerial-sunset", "", "50% 55%") },
  { href: "/neighborhoods/match", title: "Pick a neighborhood", image: img("library/lakefront-houses-palms", "", "50% 55%") },
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

      <GuideSteps steps={STEPS} label="Buying, step by step" />

      <GuideNext title="Where to start" links={NEXT} />

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
