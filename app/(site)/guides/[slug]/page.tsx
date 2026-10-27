import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Blocks, GuidePhoto } from "@/components/guides/blocks";
import { GuideContents } from "@/components/guides/contents";
import { GuideCover } from "@/components/guides/cover";
import { GuideNext, OnOnePage } from "@/components/guides/one-page";
import { GuideSectionHeader } from "@/components/guides/section-header";
import { GuideSources } from "@/components/guides/sources";
import { getSiteSettings, getTeamMember } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { TrackedLink } from "@/components/tracked-link";
import { getGuide, getGuideSlugs, guidePdfHref, guideReadingMinutes, guideWordCount } from "@/lib/guides";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, personJsonLd, publisherRef } from "@/lib/seo";
import { site } from "@/lib/site";
import "@/components/guides/guides.css";

type Params = Promise<{ slug: string }>;
const noon = (d: string) => `${d}T12:00:00`;
const ONE_PAGE_ID = "on-one-page";

/** The guides are a fixed list: any other slug is a real 404, not a page that says so. */
export const dynamicParams = false;

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
          publisher: publisherRef(),
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
        <GuideCover guide={guide} minutes={minutes} updated={updated} author={author ? { name: author.name, headshot: author.headshot } : undefined} />

        {/* The sections, with the contents beside them */}
        <div className="container-site grid grid-cols-1 gap-10 pt-14 pb-section md:pt-20 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[260px_minmax(0,1fr)] print:block print:pb-0">
          <div className="print-hide lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <GuideContents items={contents} onePageId={ONE_PAGE_ID} />
          </div>
          <div className="flex min-w-0 max-w-[860px] flex-col gap-16 md:gap-20 print:max-w-none print:gap-10">
            {guide.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="guide-section flex scroll-mt-header flex-col gap-8" aria-labelledby={`${s.id}-title`}>
                <div id={`${s.id}-title`}>
                  <GuideSectionHeader number={i + 1} of={of} title={s.title} lead={s.lead} />
                </div>
                {s.photo ? <GuidePhoto photo={s.photo} /> : null}
                <Blocks blocks={s.blocks} firstFigure={firstFigure[i]} />
              </section>
            ))}
            <OnOnePage guide={guide} id={ONE_PAGE_ID} />
            <GuideNext guide={guide} />
            <section className="print-hide flex flex-col gap-5 border-y border-hairline py-10 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="guide-pdf-title">
              <div className="flex flex-col gap-2">
                <h2 id="guide-pdf-title" className="t-h2 text-navy">
                  Take this guide with you
                </h2>
                <p className="t-body max-w-[520px] text-body">The whole guide as a PDF, set for print: every section, the worksheet and the sources.</p>
              </div>
              <TrackedLink
                href={guidePdfHref(guide.slug)}
                download={`JJ Premier Group - ${guide.title}.pdf`}
                event="Download"
                props={{ what: "guide-pdf", guide: guide.slug }}
                className="btn btn-navy shrink-0"
              >
                Download the PDF
                <span className="btn-dash" aria-hidden="true" />
              </TrackedLink>
            </section>
            <GuideSources guide={guide} />
            <p className="t-note max-w-measure">
              This guide is general information about places and rules, written for {site.region}. It is not legal, insurance or tax advice, and nothing in it is a figure for any particular house.
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
