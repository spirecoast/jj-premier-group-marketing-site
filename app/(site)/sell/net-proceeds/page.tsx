import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { NetProceedsCalculator } from "@/components/net-proceeds/calculator";
import { pageMetadata } from "@/lib/seo";
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
    </>
  );
}
