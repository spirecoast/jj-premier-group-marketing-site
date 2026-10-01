import type { Metadata } from "next";
import { RuleLink } from "@/components/buttons";
import { NetProceedsCalculator } from "@/components/net-proceeds/calculator";
import { SectionHeading } from "@/components/section-heading";
import { CFO_TITLE_URL, CHECKED, CONDO_STATUTE_URL, MANATEE_RECORDING_URL, NOVEMBER_DISCOUNT_PCT, SOURCES, TAX_DISCOUNT_URL } from "@/lib/net-proceeds";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Seller net proceeds",
  description:
    "What you'd walk away with: the sale price less the payoff, doc stamps at the state rate, the title policy at Florida's promulgated rate, and the tax proration to the day before closing. Every line says where its number comes from. Sarasota and Manatee counties.",
  path: "/sell/net-proceeds",
  fileImage: true, // opengraph-image.tsx beside this page
});

const ISNT = [
  {
    title: "It isn't a closing statement.",
    body: "The title company prepares that from the contract, the payoff letters and the association's ledger, and their figures govern. This sheet is for deciding whether and when, not for signing.",
  },
  {
    title: "Commissions aren't suggested here.",
    body: "Both lines stay blank until you type a number. What you pay the listing side and what you offer a buyer's broker, if anything, are negotiated and written into the listing agreement before the house goes live.",
  },
  {
    title: "Customs aren't laws.",
    body: "Who pays the owner's title policy is county habit, and the contract's paragraph 9(c) can say otherwise. The sheet follows the custom until you tell it the contract did something else.",
  },
  {
    title: "It's for Sarasota and Manatee.",
    body: "Miami-Dade has a different documentary stamp rate and a surtax, and Broward and Miami-Dade use a different title paragraph in the contract. Elsewhere in Florida the stamp rate holds but the title custom may not.",
  },
];

const ORDER = ["docStamps", "titleRates", "titleCustom", "estoppel", "estoppelStatute", "recording", "prorations"] as const;

export default function NetProceedsPage() {
  return (
    <>
      {/* Hero: the question, and what the sheet does with it. */}
      <section className="container-site flex flex-col gap-7 py-section">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">Selling · Net proceeds</p>
          <h1 className="t-display max-w-[640px] text-navy">What you&rsquo;d walk away with.</h1>
        </div>
        <p className="t-lead max-w-[600px] text-body">
          Put in the price and what&rsquo;s owed, and the sheet fills in the rest: doc stamps at the state rate, the title
          policy at Florida&rsquo;s promulgated rate, the tax proration to the day before closing. Every line says where its
          number comes from, and the ones that vary by title company are yours to edit.
        </p>
        <p className="t-mono-sm max-w-[520px] text-graphite-500">
          Sarasota and Manatee counties · sources checked {CHECKED} · an estimate, not a closing statement
        </p>
      </section>

      {/* The sheet. */}
      <section className="container-site flex flex-col gap-10 pb-section">
        <SectionHeading
          number="01"
          eyebrow="The sheet"
          title="Price, minus each line, equals the number."
          aside={<RuleLink href="/sell">How selling with us goes</RuleLink>}
          className="print:hidden"
        />
        <NetProceedsCalculator />
      </section>

      {/* What this isn't. */}
      <section className="bg-parchment print:hidden">
        <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading number="02" eyebrow="What this isn't" title="Four things to know before you lean on it." />
          <dl className="grid gap-8 sm:grid-cols-2">
            {ISNT.map((i) => (
              <div key={i.title} className="flex flex-col gap-2 border-t border-hairline pt-4">
                <dt className="t-h3 text-navy">{i.title}</dt>
                <dd className="t-body text-body">{i.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Sources. */}
      <section className="container-site flex flex-col gap-10 py-section print:hidden">
        <SectionHeading
          number="03"
          eyebrow="Where the figures come from"
          title="Here's every rate on the sheet and the page it came from."
          aside={<RuleLink href="/valuation">Start with the address</RuleLink>}
        />
        <ol className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
          {ORDER.map((key) => {
            const s = SOURCES[key];
            return (
              <li key={key} className="flex flex-col gap-2 border-t border-hairline pt-4">
                <p className="t-body text-navy">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-harbor-700">
                    {s.title}
                  </a>
                </p>
                <p className="t-mono-sm text-graphite-500">
                  {s.publisher} · checked {CHECKED}
                </p>
                <p className="t-small text-body">{s.figure}</p>
                {key === "titleRates" ? (
                  <p className="t-small text-graphite-500">
                    The rule is also named, with its first two tiers, on the{" "}
                    <a href={CFO_TITLE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      Florida CFO&rsquo;s title insurance overview
                    </a>
                    .
                  </p>
                ) : null}
                {key === "estoppelStatute" ? (
                  <p className="t-small text-graphite-500">
                    Condominiums:{" "}
                    <a href={CONDO_STATUTE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      F.S. 718.116(8)
                    </a>
                    .
                  </p>
                ) : null}
                {key === "prorations" ? (
                  <p className="t-small text-graphite-500">
                    The maximum discount is {NOVEMBER_DISCOUNT_PCT} percent, for payment in November, under{" "}
                    <a href={TAX_DISCOUNT_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      F.S. 197.162
                    </a>
                    .
                  </p>
                ) : null}
                {key === "recording" ? (
                  <p className="t-small text-graphite-500">
                    Manatee&rsquo;s schedule is the same:{" "}
                    <a href={MANATEE_RECORDING_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      Manatee County Clerk, recording fees
                    </a>
                    .
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="t-small max-w-[640px] text-graphite-500">
          Rates change. If a figure here no longer matches its source, the source wins, and we&rsquo;d like to hear about it.
        </p>
      </section>
    </>
  );
}
