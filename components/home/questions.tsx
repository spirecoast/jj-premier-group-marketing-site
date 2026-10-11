import Link from "next/link";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { faqJsonLd } from "@/lib/seo";

/**
 * The questions people ask first, the last section before the footer: plain
 * answers, each with a link to the longer version.
 */
export const HOME_FAQS: Faq[] = [
  {
    q: "Do I need to sell my current home before I buy?",
    answer:
      "Usually not. Many sellers here stay in the home for a few weeks after closing, and the standard Florida contract has a rider for it. We time the two closings so they line up.",
    a: (
      <>
        <p>
          Usually not. Many sellers here stay in the home for a few weeks after closing, and the standard Florida
          contract has a rider for it. We time the two closings so they line up.
        </p>
        <p className="mt-3">
          <Link href="/sell" className="link-rule">Read the seller&rsquo;s guide</Link>
        </p>
      </>
    ),
  },
  {
    q: "What does it cost to sell a home in Florida?",
    answer:
      "There are three main costs. The seller pays the documentary stamp tax on the deed, $0.70 per $100 of the price. The owner's title policy is paid by the seller in Manatee County and by the buyer in Sarasota County. Commission is negotiable and set in the listing agreement.",
    a: (
      <>
        <p>
          There are three main costs. The seller pays the documentary stamp tax on the deed, $0.70 per $100 of the
          price. The owner&rsquo;s title policy is paid by the seller in Manatee County and by the buyer in Sarasota
          County. Commission is negotiable and set in the listing agreement.
        </p>
        <p className="mt-3">
          <Link href="/sell/net-proceeds" className="link-rule">Estimate what you&rsquo;d keep</Link>
        </p>
      </>
    ),
  },
  {
    q: "Do I need flood insurance in Lakewood Ranch, Sarasota or Bradenton?",
    answer:
      "If the home is in FEMA flood zone AE or VE and you have a mortgage, your lender will require it. In zone X it's optional. Quotes there are usually low, so we often recommend it. We check the flood map before you see the house.",
    a: (
      <>
        <p>
          If the home is in FEMA flood zone AE or VE and you have a mortgage, your lender will require it. In zone X
          it&rsquo;s optional. Quotes there are usually low, so we often recommend it. We check the flood map before
          you see the house.
        </p>
        <p className="mt-3">
          <Link href="/buy" className="link-rule">Read the buyer&rsquo;s guide</Link>
        </p>
      </>
    ),
  },
  {
    q: "How long does it take to buy a home here?",
    answer:
      "Most buyers have their keys three to four months after the first call, when there's no house to sell first. The search takes the most time. Contract to closing takes 30 to 45 days with a mortgage and about 14 days with cash.",
    a: (
      <>
        <p>
          Most buyers have their keys three to four months after the first call, when there&rsquo;s no house to sell
          first. The search takes the most time. Contract to closing takes 30 to 45 days with a mortgage and about 14
          days with cash.
        </p>
        <p className="mt-3">
          <Link href="/buy" className="link-rule">See the ten steps</Link>
        </p>
      </>
    ),
  },
  {
    q: "Which areas does JJ Premier Group cover?",
    answer:
      "Lakewood Ranch, Sarasota and Bradenton, Florida. We're a mother and daughter team with Coldwell Banker Realty, and we work with buyers, sellers and investors.",
    a: (
      <>
        <p>
          Lakewood Ranch, Sarasota and Bradenton, Florida. We&rsquo;re a mother and daughter team with Coldwell Banker
          Realty, and we work with buyers, sellers and investors.
        </p>
        <p className="mt-3">
          <Link href="/neighborhoods" className="link-rule">Explore the neighborhoods</Link>
        </p>
      </>
    ),
  },
];

export function Questions() {
  return (
    <section className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="questions-title">
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <div className="sr flex flex-col gap-5">
        <SectionHeading size="display" title={<span id="questions-title">Common questions</span>} />
        <p className="t-body max-w-[420px] text-body">
          Have another one? <Link href="/contact" className="link-rule">Ask us</Link>.
        </p>
      </div>
      <FaqAccordion items={HOME_FAQS} className="sr [--sr-i:1]" />
    </section>
  );
}
