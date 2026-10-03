import { Photo } from "@/components/photo";
import type { Guide } from "@/lib/guides/types";

/**
 * The cover, set the way the Virtus guides set theirs: the guide's cover
 * photograph full-bleed under a deep harbor wash that darkens toward the
 * text, the mono "Guide · 8 sections · 12 min read" line, the title in the
 * display face, the one-sentence promise and the byline. The photos are
 * 2400px wide, so they stay sharp at full width (docs/SITE.md has their
 * provenance). The same photo feeds the guide's card and share image.
 */
export function GuideCover({ guide, minutes, updated }: { guide: Guide; minutes: number; updated: string }) {
  const sections = guide.sections.length;
  return (
    <header className="guide-cover guide-cover-ground relative -mt-header overflow-hidden text-white">
      <Photo image={guide.cover} priority sizes="100vw" className="guide-cover-photo" />
      <div className="guide-cover-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-site relative flex min-h-[520px] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+4rem)] lg:min-h-[600px]">
        <p className="t-eyebrow text-mist">
          Guide · {sections} sections · {minutes} min read
        </p>
        <span className="block h-px w-14 bg-sky-300" aria-hidden="true" />
        <h1 className="t-display max-w-[820px] text-balance text-white">{guide.title}</h1>
        <p className="t-lead max-w-[620px] text-linen-100">{guide.promise}</p>
        <p className="t-record text-linen-200">
          By {guide.author.name} · Updated {updated}
        </p>
      </div>
    </header>
  );
}
