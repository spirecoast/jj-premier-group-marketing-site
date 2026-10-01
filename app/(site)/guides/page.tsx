import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { GuideCard } from "@/components/guides/guide-card";
import { LetterForm } from "@/components/letter-form";
import { SectionHeading } from "@/components/section-heading";
import { img } from "@/lib/content/seed/helpers";
import { GUIDES } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Guides",
  description: "Long-form guides to buying and selling on the Suncoast: the rules, the documents and the deadlines, drawn out and sourced. Free, with no sign-up.",
  path: "/guides",
});

const BAND = img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%");

export default function GuidesIndex() {
  return (
    <>
      <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="guides-index-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="Guides"
          title={<span id="guides-index-title">The things people ask us before they buy or sell, drawn out.</span>}
          titleClassName="max-w-[860px]"
          aside={
            <p className="t-body max-w-[380px] text-body">
              Each guide is sourced line by line, with figures you can read as tables and a one-page worksheet at the end. The shorter pieces and the monthly letter are on{" "}
              <Link href="/blog" className="underline decoration-harbor-300 underline-offset-2 hover:text-navy">
                {site.reportName}
              </Link>
              .
            </p>
          }
        />
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g, i) => (
            <li key={g.slug} className="flex">
              <GuideCard guide={g} priority={i === 0} />
            </li>
          ))}
        </ul>
      </section>

      <CtaBand image={BAND} eyebrow={`${site.reportName}, by email`} title="Once a month, one page, written for you." body="Unsubscribe any time. We never share the list." minHeight="min-h-[480px]">
        <LetterForm tone="dark" />
      </CtaBand>
    </>
  );
}
