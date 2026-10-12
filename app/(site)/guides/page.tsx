import type { Metadata } from "next";
import { CtaBand } from "@/components/cta-band";
import { GuideCard } from "@/components/guides/guide-card";
import { LetterForm } from "@/components/letter-form";
import { getTeam } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { GUIDES } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Guides",
  description: "Guides for life on the Gulf Coast: the things that work differently here, from storm season to the tax bill, each explained simply for Lakewood Ranch, Sarasota and Bradenton. Free, with no sign-up.",
  path: "/guides",
});

const BAND = img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%");

export default async function GuidesIndex() {
  const team = await getTeam();
  const bySlug = new Map(team.map((m) => [m.slug, { name: m.name, headshot: m.headshot }]));
  return (
    <>
      <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="guides-index-title">
        <div className="flex max-w-[820px] flex-col gap-5">
          <h1 id="guides-index-title" className="t-display text-balance text-navy">
            Guides for life on the Gulf Coast
          </h1>
          <p className="t-lead max-w-[600px] text-body">It’s a beautiful place to live. A few things work differently here, and each guide walks you through one of them.</p>
        </div>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g, i) => (
            <li key={g.slug} className="flex">
              <GuideCard guide={g} author={bySlug.get(g.author.slug)} priority={i === 0} />
            </li>
          ))}
        </ul>
      </section>

      <CtaBand image={BAND} title="Get the monthly market report by email." body="Once a month. Stop any time. We never share the list." minHeight="min-h-[480px]">
        <LetterForm tone="dark" />
      </CtaBand>
    </>
  );
}
