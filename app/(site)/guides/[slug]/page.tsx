import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Blocks } from "@/components/guides/blocks";
import { GuideContents } from "@/components/guides/contents";
import { GuideCover } from "@/components/guides/cover";
import { GuideNext, OnOnePage } from "@/components/guides/one-page";
import { GuideSectionHeader } from "@/components/guides/section-header";
import { GuideSources } from "@/components/guides/sources";
import { getSiteSettings, getTeamMember } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { getGuide, getGuideSlugs, guideReadingMinutes, guideWordCount } from "@/lib/guides";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;
const noon = (d: string) => `${d}T12:00:00`;
const ONE_PAGE_ID = "on-one-page";

export async function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: guide.title,
    description: guide.promise,
    path: `/guides/${guide.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const [author, settings] = await Promise.all([getTeamMember(guide.author.slug), getSiteSettings()]);
  const minutes = guideReadingMinutes(guide);
  const updated = formatDateLong(noon(guide.updatedAt));
  const of = guide.sections.length;
  const contents = guide.sections.map((s, i) => ({ id: s.id, number: String(i + 1).padStart(2, "0"), title: s.title }));

  // Figures are numbered through the whole guide.
  let figureCount = 0;
  const firstFigure = guide.sections.map((s) => {
    const first = figureCount + 1;
    figureCount += s.blocks.filter((b) => b.kind === "figure").length;
    return first;
  });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.promise,
          image: absoluteUrl(guide.cover.src),
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          wordCount: guideWordCount(guide),
          author: author ? personJsonLd(author, settings) : { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, url: site.url },
          mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
          isAccessibleForFree: true,
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ])}
      />

      <article id="guide-article">
        <GuideCover guide={guide} minutes={minutes} updated={updated} />

        {/* How to use · Inside this guide · the three questions */}
        <div className="container-site grid grid-cols-1 gap-12 py-14 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-24 print:grid-cols-1 print:gap-6 print:py-6">
          <div className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb" className="t-mono-sm print-hide flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
              <Link href="/guides" className="-my-2 inline-block py-2 transition-colors hover:text-navy">
                Guides
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-navy" aria-current="page">
                {guide.title}
              </span>
            </nav>
            <span className="block h-px w-10 bg-amber" aria-hidden="true" />
            <h2 className="t-h3 text-navy">How to use this guide</h2>
            <div className="flex flex-col gap-4">
              {guide.howToUse.map((t, i) => (
                <p key={i} className="guide-text max-w-measure">
                  {t}
                </p>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {/* On phones the folded contents beside the sections stands in for this list. */}
            <div className="hidden flex-col gap-3 lg:flex">
              <p className="t-eyebrow text-amber">Inside this guide</p>
              <ol className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
                {contents.map((c) => (
                  <li key={c.id} className="border-b border-hairline">
                    <a href={`#${c.id}`} className="grid grid-cols-[32px_1fr] items-baseline gap-2 py-2.5 text-[14px] leading-snug text-body transition-colors hover:text-navy">
                      <span className="font-mono text-[11px] text-amber">{c.number}</span>
                      {c.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-3 border border-hairline bg-white p-5">
              <p className="t-eyebrow text-amber">As you go, keep coming back to three questions</p>
              <ol className="flex flex-col gap-3">
                {guide.questions.map((q, i) => (
                  <li key={q} className="grid grid-cols-[40px_1fr] items-baseline gap-3">
                    <span className="font-display text-[34px] font-extralight leading-none text-navy" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="t-h4 text-navy">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* The sections, with the contents beside them */}
        <div className="container-site grid grid-cols-1 gap-10 pb-section lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[260px_minmax(0,1fr)] print:block print:pb-0">
          <aside className="print-hide lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <GuideContents items={contents} onePageId={ONE_PAGE_ID} />
          </aside>
          <div className="flex min-w-0 max-w-[860px] flex-col gap-16 md:gap-20 print:max-w-none print:gap-10">
            {guide.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="guide-section flex scroll-mt-header flex-col gap-8" aria-labelledby={`${s.id}-title`}>
                <div id={`${s.id}-title`}>
                  <GuideSectionHeader number={i + 1} of={of} title={s.title} lead={s.lead} />
                </div>
                <Blocks blocks={s.blocks} firstFigure={firstFigure[i]} />
              </section>
            ))}
            <OnOnePage guide={guide} id={ONE_PAGE_ID} />
            <GuideNext guide={guide} />
            <GuideSources guide={guide} />
            <p className="t-mono-sm max-w-measure text-graphite-500">
              This guide is general information about places and rules, written for {site.region}. It is not legal, insurance or tax advice, and nothing in it is a figure for any particular house.
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
