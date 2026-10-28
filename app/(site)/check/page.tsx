import type { Metadata, Route } from "next";
import Link from "next/link";
import { AddressCheck } from "@/components/check/address-check";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";
import { CHECK_COPY as C } from "@/lib/check/copy";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: C.title, description: C.description, path: "/check", fileImage: true });
}

/**
 * Atlas Check: one address in, its evacuation zone, FEMA flood zone and the
 * roll's facts out, each with its public source and the day it was read.
 * Static: the lookup runs in the browser against /api/check, and a link that
 * carries an address runs it on arrival (the address never goes back into
 * the address bar).
 */
export default function CheckPage() {
  const how = C.how.body.join("\n\n");
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Atlas", path: "/neighborhoods" },
          { name: "Check", path: "/check" },
        ])}
      />
      <Masthead route="/check" titleId="check-title">
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">{C.lead}</p>
      </Masthead>

      <section className="bg-parchment py-8 sm:py-section" aria-label={C.form.label}>
        <div className="container-site">
          <UrlPending keys={["address"]} />
          <IslandBoundary name="the address check" className="px-0 py-0">
            <AddressCheck />
          </IslandBoundary>
        </div>
      </section>

      <section className="container-site flex flex-col gap-6 py-section">
        <FaqAccordion
          className="max-w-measure"
          items={[
            {
              q: C.how.title,
              answer: how,
              a: (
                <div className="flex flex-col gap-3">
                  {C.how.body.map((para) => (
                    <p key={para.slice(0, 24)}>{para}</p>
                  ))}
                </div>
              ),
            },
          ]}
        />
        <Link href={"/neighborhoods" as Route} className="link-rule self-start">
          Back to the map
        </Link>
      </section>
    </>
  );
}
