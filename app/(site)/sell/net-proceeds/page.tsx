import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { NetProceedsCalculator } from "@/components/net-proceeds/calculator";
import { CFO_TITLE_URL, CHECKED, CONDO_STATUTE_URL, MANATEE_RECORDING_URL, NOVEMBER_DISCOUNT_PCT, SOURCES, TAX_DISCOUNT_URL } from "@/lib/net-proceeds";
import { pageMetadata } from "@/lib/seo";
import { ExternalLink } from "@/components/ui/external-link";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";
import { NET_PROCEEDS_DRAFT, NET_PROCEEDS_KEYS } from "@/lib/net-proceeds-url";

export const metadata: Metadata = pageMetadata({
  title: "Tide Sale Calculator: what you'd keep",
  description:
    "An estimate of what you'd keep after selling in Sarasota or Manatee County: the price less the payoff, commission, deed stamps, title policy and prorations.",
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

const ORDER = ["docStamps", "titleRates", "titleCustom", "estoppel", "estoppelStatute", "recording", "prorations", "firpta"] as const;

export default function NetProceedsPage() {
  return (
    <>
      {/* A link that carries a sheet (or a sheet kept on this device) is applied after hydration; this hides the default sheet until then. */}
      <UrlPending keys={NET_PROCEEDS_KEYS} draftKey={NET_PROCEEDS_DRAFT} />
      <Masthead route="/sell/net-proceeds" titleId="net-proceeds-title" className="print:hidden">
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">
          A quick estimate of what you&rsquo;d walk away with. Enter the price and what you owe.
        </p>
      </Masthead>

      <section className="container-site flex flex-col gap-10 py-section">
        <IslandBoundary name="the calculator" className="px-0 py-0">
          <NetProceedsCalculator />
        </IslandBoundary>
      </section>

      {/* What this isn't. */}
      <section className="bg-parchment print:hidden">
        <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <h2 className="t-h1 text-navy">Good to know</h2>
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
        <h2 className="t-h1 text-navy">Where each number comes from</h2>
        <ol className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
          {ORDER.map((key) => {
            const s = SOURCES[key];
            return (
              <li key={key} className="flex flex-col gap-2 border-t border-hairline pt-4">
                <p className="t-body text-navy">
                  <ExternalLink href={s.url} className="underline underline-offset-4 hover:text-harbor-700">
                    {s.title}
                  </ExternalLink>
                </p>
                <p className="t-mono-sm text-graphite-500">
                  {s.publisher} · checked {CHECKED}
                </p>
                <p className="t-small text-body">{s.figure}</p>
                {key === "titleRates" ? (
                  <p className="t-small text-graphite-500">
                    The rule is also named, with its first two tiers, on the{" "}
                    <ExternalLink href={CFO_TITLE_URL} className="underline underline-offset-4">
                      Florida CFO&rsquo;s title insurance overview
                    </ExternalLink>
                    .
                  </p>
                ) : null}
                {key === "estoppelStatute" ? (
                  <p className="t-small text-graphite-500">
                    Condominiums:{" "}
                    <ExternalLink href={CONDO_STATUTE_URL} className="underline underline-offset-4">
                      F.S. 718.116(8)
                    </ExternalLink>
                    .
                  </p>
                ) : null}
                {key === "prorations" ? (
                  <p className="t-small text-graphite-500">
                    The maximum discount is {NOVEMBER_DISCOUNT_PCT} percent, for payment in November, under{" "}
                    <ExternalLink href={TAX_DISCOUNT_URL} className="underline underline-offset-4">
                      F.S. 197.162
                    </ExternalLink>
                    .
                  </p>
                ) : null}
                {key === "recording" ? (
                  <p className="t-small text-graphite-500">
                    Manatee&rsquo;s schedule is the same:{" "}
                    <ExternalLink href={MANATEE_RECORDING_URL} className="underline underline-offset-4">
                      Manatee County Clerk, recording fees
                    </ExternalLink>
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
