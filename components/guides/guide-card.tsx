import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Guide } from "@/lib/guides/types";
import { guideHref, guideReadingMinutes } from "@/lib/guides";

/**
 * A guide as a cover: its photograph fills the card, and the title sits on a
 * pane of frosted glass across the foot, the same glass as the guide's own
 * cover, with the number, the length and JJ Premier Group under it. Type is
 * sized to the card's width.
 */
export function GuideCard({ guide, number, priority }: { guide: Guide; number?: number; priority?: boolean }) {
  const minutes = guideReadingMinutes(guide);
  return (
    <Link href={guideHref(guide.slug)} className="card group flex w-full flex-col gap-4">
      <div className="@container relative aspect-[4/5] overflow-hidden bg-navy shadow-[0_24px_48px_-28px_rgb(20_37_48/0.45)]">
        <Photo image={guide.cover} priority={priority} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw" className="card-img" />
        <div className="absolute inset-0 bg-linear-to-b from-harbor-950/25 via-transparent to-harbor-950/55" aria-hidden="true" />
        {number ? (
          <span className="absolute right-[6cqw] top-[5cqw] font-display text-[13cqw] font-extralight leading-none text-white/85 text-shadow-photo" aria-hidden="true">
            {String(number).padStart(2, "0")}
          </span>
        ) : null}
        <div className="guide-tile-glass absolute inset-x-[3.5cqw] bottom-[3.5cqw] flex flex-col gap-[3.4cqw] px-[5.5cqw] pb-[4.5cqw] pt-[5cqw] text-white transition-transform duration-500 group-hover:-translate-y-[1cqw]">
          <span className="block h-px w-[14%] bg-sky-300 transition-[width] duration-700 group-hover:w-[34%]" aria-hidden="true" />
          <p className="line-clamp-3 text-balance font-display text-[6.6cqw] font-light leading-[1.08]">{guide.title}</p>
          <div className="flex items-baseline justify-between gap-3 border-t border-white/20 pt-[2.6cqw] text-white/75">
            <span className="text-[2.9cqw] tracking-[0.02em]">{minutes} min read</span>
            <span className="font-wordmark text-[2.5cqw] font-semibold uppercase tracking-[0.32em]">JJ Premier Group</span>
          </div>
        </div>
      </div>
      <p className="t-small max-w-[44ch] text-body-muted">{guide.promise}</p>
    </Link>
  );
}
