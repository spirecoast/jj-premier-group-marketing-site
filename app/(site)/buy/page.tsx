import type { Metadata } from "next";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { LeadForm } from "@/components/lead-form";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getActiveListingCount, getFeaturedListings, getTeam } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Buying on the Suncoast",
  description:
    "Two questions before we look at anything: when do you need to be in, and is there a house to sell first? Escrow, inspections, flood insurance and closing costs, explained the way a friend would.",
  path: "/buy",
});

/* Editorial photography for the page. Listings come from the content layer. */
const FRAMES = {
  hero: img("library/listing-kitchen-4pm-island", "A kitchen island at four in the afternoon"),
  keys: img("library/moment-key-handoff", "Keys handed across a table at a closing", "50% 40%"),
};

/** Four steps, and the day each one happens. Linen-led: every term defined. */
const STEPS = [
  {
    n: "01",
    when: "Day 1 · one call",
    title: "Two questions",
    body:
      "When do you need to be in, and is there a house to sell first? Those two answers set the price band, the streets, and which Saturday we start. Then the pre-approval, because a letter from a local lender is the first thing a Sarasota seller reads. Forty minutes, usually on a weeknight.",
  },
  {
    n: "02",
    when: "Week 1 · the list",
    title: "The three we would see",
    body:
      "You get every listing in Lakewood Ranch, Sarasota and Bradenton that fits, and we tell you which three we would actually go and see. Flood zone, HOA, the year of the roof, and what the last three sold for, before you get in the car. Go see it at six; the light tells the truth.",
  },
  {
    n: "03",
    when: "The offer · when the house is right",
    title: "The offer table",
    body:
      "Jessica runs it. Price is one of five columns, next to financing, deposit, inspection period, and the closing date the seller actually needs. We call the listing agent before we write anything, and we write to the sold prices on that street, not the list prices.",
  },
  {
    n: "04",
    when: "Contract to keys · 30–45 days",
    title: "Escrow to the walk-through",
    body:
      "Escrow opens, which means a neutral title company holds your deposit until closing. Inspection inside the first ten days, appraisal inside three weeks, insurance bound, and a closing date we picked together on day one. Cash closes in about fourteen. We are at the walk-through, and we hand you the keys.",
  },
];

/** Asked on the first call. Florida contracts and county custom decide most of it. */
const FAQS: Faq[] = [
  {
    q: "What is escrow, and where does my deposit go?",
    a: (
      <>
        <p>
          A neutral third party, usually the title company, holds your deposit and the paperwork until both sides have
          done what they promised. It is not the seller’s account and it is not ours. Under the standard Florida
          contract the deposit is due within three days of the effective date, and if the deal ends for a reason the
          contract allows, the money comes back to you from escrow.
        </p>
        <p className="mt-4">
          You will hear the word used three ways: the account, the period between contract and closing, and the
          company holding it. All three are normal, and we will say which one we mean.
        </p>
      </>
    ),
  },
  {
    q: "What gets inspected, and what happens if something is wrong?",
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
          answer is a credit at closing rather than a repair, and we will tell you what is normal for this coast.
        </p>
      </>
    ),
  },
  {
    q: "Do I need flood insurance?",
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
    a: (
      <>
        <p>
          From the first call to keys, three to four months is typical when there is no house to sell first. The search
          is the variable; contract to close is the fixed part, thirty to forty-five days financed and about fourteen
          for cash. Season listings arrive in February and thin out by August, and a house that is priced to the comps
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
  const [featured, count, team] = await Promise.all([getFeaturedListings(3), getActiveListingCount(), getTeam()]);
  const caption = "The kitchen, late afternoon";

  return (
    <>
      {/* Hero on Paper: the eyebrow, the headline, and a kitchen at four. */}
      <section className="container-site grid items-center gap-12 py-section lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-amber">Buying</p>
            <h1 className="t-display max-w-[640px] text-navy">
              Two questions before
              <br className="hidden sm:block" /> we look at anything.
            </h1>
          </div>
          <p className="t-lead max-w-[560px] text-body">
            When do you need to be in, and is there a house to sell first? Those two answers change everything else:
            the price band, the streets, and which Saturday we start.
          </p>
          <p className="t-body max-w-measure text-body">
            Nothing on this page assumes you have done this before. We say what escrow is, what it costs, and what
            happens on Tuesday. If this is your fourth house, go straight to the listings. Your first one is the one we
            explain twice.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <ButtonLink href="#contact" dash>
              Tell us the timing
            </ButtonLink>
            <ButtonLink href="/listings" variant="outline" dash>
              Find your home
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-linen-100 lg:aspect-[4/5]">
          <Photo image={FRAMES.hero} priority sizes="(min-width: 1024px) 560px, 100vw" />
          <p className="absolute bottom-4 left-4 t-mono-sm text-white text-shadow-soft">{caption}</p>
        </div>
      </section>

      {/* Four steps, and the day each one happens. */}
      <section className="container-site flex flex-col gap-10 pb-section" aria-labelledby="buy-steps-title">
        <SectionHeading
          eyebrow="How it goes"
          title={<span id="buy-steps-title">Four steps, and the day each one happens.</span>}
          aside={
            <p className="t-small max-w-[300px] text-body-muted lg:text-right">
              Thirty to forty-five days from contract to keys on a financed purchase, fourteen for cash. That is the
              calendar we plan around.
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

      {/* Three we would go and see this week. */}
      {featured.length ? (
        <section className="container-site flex flex-col gap-10 pb-section">
          <SectionHeading
            eyebrow="On the market"
            title="Three we would go and see this week."
            aside={<RuleLink href="/listings">All {count} listings</RuleLink>}
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
      ) : null}

      {/* The questions people are embarrassed to ask. */}
      <section className="container-site grid gap-10 pb-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <SectionHeading eyebrow="Asked on the first call" title="The questions nobody is born knowing." />
          <p className="t-body max-w-[420px] text-body">
            Florida contracts and county custom decide most of this, and we will say which is which. If your question
            is not here, it goes in the box at the bottom of the page.
          </p>
          <div className="relative hidden aspect-[4/3] overflow-hidden bg-linen-100 lg:block">
            <Photo image={FRAMES.keys} sizes="(min-width: 1024px) 420px, 100vw" />
          </div>
        </div>
        <FaqAccordion items={FAQS} />
      </section>

      {/* Tell us the timing. */}
      <section
        id="contact"
        className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20"
      >
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow="Tell us the timing" title="Two questions, and we take it from there." />
          <p className="t-body max-w-[440px] text-body">
            When do you need to be in, and is there a house to sell first? Put whatever you know in the box. One of us
            will call or write back, and the first conversation has no pitch in it.
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
            fields={["name", "email", "phone", "timing", "message"]}
            submitLabel="Tell us the timing"
            placeholderMessage="Where you are looking, what you need, and whether there is a house to sell first."
          />
        </div>
      </section>
    </>
  );
}
