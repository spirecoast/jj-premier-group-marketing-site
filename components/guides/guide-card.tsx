import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Guide } from "@/lib/guides/types";
import { guideHref, guideReadingMinutes } from "@/lib/guides";

/**
 * A guide as a cover, a sister to Tide's: the photograph across the top, a
 * linen panel with the number and the title in the serif, and the team and
 * the brokerage on the bottom line at the same size. Type is sized to the
 * card's width.
 */
export function GuideCard({ guide, number, priority }: { guide: Guide; number?: number; priority?: boolean }) {
  const minutes = guideReadingMinutes(guide);
  return (
    <Link href={guideHref(guide.slug)} className="card group flex w-full flex-col gap-4">
      <div className="@container relative aspect-[4/5] overflow-hidden bg-linen-100 shadow-[0_24px_48px_-28px_rgb(20_37_48/0.45)]">
        <div className="absolute inset-x-0 top-0 h-[60%] overflow-hidden bg-navy">
          <Photo image={guide.cover} priority={priority} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw" className="card-img" />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex h-[40%] flex-col justify-between bg-linen-100 px-[6.5cqw] pb-[5cqw] pt-[5cqw]">
          <div className="flex flex-col gap-[2.2cqw]">
            <div className="flex items-baseline justify-between font-mono text-[2.5cqw] uppercase tracking-[0.18em] text-sky-700">
              <span>Guide{number ? ` No. ${String(number).padStart(2, "0")}` : ""}</span>
              <span>{minutes} min read</span>
            </div>
            <p className="line-clamp-3 text-balance font-display text-[6.4cqw] font-light leading-[1.08] text-navy">{guide.title}</p>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-navy/20 pt-[2.5cqw] font-mono text-[2.3cqw] uppercase tracking-[0.16em] text-graphite-600">
            <span>JJ Premier Group</span>
            <span>Coldwell Banker Realty</span>
          </div>
        </div>
        <span className="absolute left-0 top-[60%] h-[3px] w-[22%] -translate-y-1/2 bg-sky-300 transition-[width] duration-700 group-hover:w-full" aria-hidden="true" />
      </div>
      <p className="t-small max-w-[44ch] text-body-muted">{guide.promise}</p>
    </Link>
  );
}
