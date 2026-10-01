import { Photo } from "@/components/photo";
import type { Guide } from "@/lib/guides/types";

/**
 * The cover: a photo band under navy shade, the mono "Guide · 7 sections ·
 * 26 min read" line, the title in the display face, the one-sentence
 * promise, the byline and the date.
 */
export function GuideCover({ guide, minutes, updated }: { guide: Guide; minutes: number; updated: string }) {
  const sections = guide.sections.length;
  return (
    <header className="guide-cover relative -mt-header min-h-[560px] overflow-hidden bg-navy text-white lg:min-h-[640px]">
      <Photo image={guide.cover} priority sizes="100vw" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+4rem)]">
        <p className="t-eyebrow text-mist text-shadow-photo">
          Guide · {sections} sections · {minutes} min read
        </p>
        <span className="block h-px w-14 bg-sky-300" aria-hidden="true" />
        <h1 className="t-display max-w-[820px] text-balance text-white text-shadow-photo">{guide.title}</h1>
        <p className="t-lead max-w-[640px] text-linen-100 text-shadow-soft">{guide.promise}</p>
        <p className="t-record text-linen-200 text-shadow-soft">
          By {guide.author.name} · Updated {updated}
        </p>
      </div>
    </header>
  );
}
