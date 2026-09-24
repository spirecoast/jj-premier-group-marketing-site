import Link from "next/link";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { faqJsonLd } from "@/lib/seo";

/**
 * 05 · The questions people ask first. Short, direct answers written the way
 * they would be said out loud, with the longer version one link away.
 */
export const HOME_FAQS: Faq[] = [
  {
    q: "Do I need to sell my current home before I buy?",
    answer:
      "Usually not. A contract with post-closing occupancy of a few weeks is common on the Suncoast, and the standard Florida contract has a rider for it. We line up both closings on purpose.",
    a: (
      <>
        <p>
          Usually not. A contract with post-closing occupancy of a few weeks is common here, and the standard Florida contract has a rider for it. We line up both closings on purpose.
        </p>
        <p className="mt-3">
          <Link href="/sell" className="link-rule">How selling with us goes</Link>
        </p>
      </>
    ),
  },
  {
    q: "What does it cost to sell a home in Florida?",
    answer:
      "The documentary stamp tax on the deed at $0.70 per $100 of the price, which the seller pays by custom on this coast; the owner's title policy, which depends on the county; and commission, which is negotiable and set in the listing agreement.",
    a: (
      <>
        <p>
          Three things: the documentary stamp tax on the deed, at $0.70 per $100 of the price, which the seller pays by custom here; the owner&rsquo;s title policy, which depends on the county; and commission, which is negotiable and set in the listing agreement.
        </p>
        <p className="mt-3">
          <Link href="/sell" className="link-rule">The full answer, with the closing statement</Link>
        </p>
      </>
    ),
  },
  {
    q: "Do I need flood insurance in Lakewood Ranch, Sarasota or Bradenton?",
    answer:
      "If the home is in a FEMA special flood hazard area, zones AE or VE, and you have a mortgage, your lender will require it. In zone X it is optional, though quotes tend to be low and we often recommend it. We pull the flood map before you see the house.",
    a: (
      <>
        <p>
          If the home is in a FEMA special flood hazard area, zones AE or VE, and you have a mortgage, your lender will require it. In zone X it&rsquo;s optional, though the quotes tend to be low and we often recommend it. We pull the flood map before you see the house.
        </p>
        <p className="mt-3">
          <Link href="/buy" className="link-rule">Everything else we get asked about buying</Link>
        </p>
      </>
    ),
  },
  {
    q: "How long does it take to buy a home here?",
    answer:
      "Three to four months from the first call to keys is typical when there is no house to sell first. Contract to close is the fixed part: thirty to forty-five days financed and about fourteen for cash.",
    a: (
      <>
        <p>
          Three to four months from the first call to the keys is typical when there&rsquo;s no house to sell first. The search is the variable. Contract to close is the fixed part: thirty to forty-five days financed, about fourteen for cash.
        </p>
        <p className="mt-3">
          <Link href="/buy" className="link-rule">The four steps, from the first call to the keys</Link>
        </p>
      </>
    ),
  },
  {
    q: "Which areas does JJ Premier Group cover?",
    answer:
      "Lakewood Ranch, Sarasota and Bradenton, Florida, as a mother and daughter team with Coldwell Banker Realty. Buyers, sellers and investors.",
    a: (
      <>
        <p>
          Lakewood Ranch, Sarasota and Bradenton, as a mother and daughter team with Coldwell Banker Realty. Buyers, sellers and investors, first home or fifth.
        </p>
        <p className="mt-3">
          <Link href="/neighborhoods" className="link-rule">The neighborhoods we know</Link>
        </p>
      </>
    ),
  },
];

export function Questions() {
  return (
    <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="questions-title">
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <div className="flex flex-col gap-5 lg:sticky lg:top-header lg:self-start">
        <SectionHeading number="06" eyebrow="Questions people ask first" size="display" title={<span id="questions-title">Short answers, then the long ones if you want them.</span>} />
        <p className="t-body max-w-[420px] text-body">
          If yours isn&rsquo;t here, ask us. We&rsquo;d rather answer it on the phone than have you guess.
        </p>
      </div>
      <FaqAccordion items={HOME_FAQS} />
    </section>
  );
}
