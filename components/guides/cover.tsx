import { Photo } from "@/components/photo";
import { TrackedLink } from "@/components/tracked-link";
import { guidePdfHref } from "@/lib/guides";
import type { Guide } from "@/lib/guides/types";

/**
 * The cover: the guide's photograph full-bleed under a deep harbor wash that
 * darkens toward the text, the title in the display face, the one-sentence
 * promise, the byline with the length, and the PDF. The photos are
 * 2400px wide, so they stay sharp at full width (docs/SITE.md has their
 * provenance). The same photo feeds the guide's card and share image.
 */
export function GuideCover({ guide, minutes, updated }: { guide: Guide; minutes: number; updated: string }) {
  const sections = guide.sections.length;
  return (
    <header data-header-overlay className="guide-cover guide-cover-ground relative -mt-header overflow-hidden text-white">
      <Photo image={guide.cover} priority sizes="100vw" className="guide-cover-photo" />
      <div className="guide-cover-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-site relative flex min-h-[520px] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+4rem)] lg:min-h-[600px]">
        <span className="block h-px w-14 bg-sky-300" aria-hidden="true" />
        <h1 className="rise d1 t-display max-w-[820px] text-balance text-white">{guide.title}</h1>
        <p className="rise d2 t-lead max-w-[620px] text-linen-100">{guide.promise}</p>
        <div className="rise d3 mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
          <TrackedLink
            href={guidePdfHref(guide.slug)}
            download={`JJ Premier Group - ${guide.title}.pdf`}
            event="Download"
            props={{ what: "guide-pdf", guide: guide.slug }}
            className="btn btn-linen"
          >
            Download the PDF
            <span className="btn-dash" aria-hidden="true" />
          </TrackedLink>
          <p className="text-[14px] text-linen-200">
            By {guide.author.name} · Updated {updated} · {sections} sections · {minutes} min read
          </p>
        </div>
      </div>
    </header>
  );
}
