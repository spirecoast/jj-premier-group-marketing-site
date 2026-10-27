import Link from "next/link";
import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import type { Guide } from "@/lib/guides/types";
import { guideHref, guideReadingMinutes } from "@/lib/guides";
import "./guide-card.css";

/**
 * A guide as a cover: its photograph fills the card, and the title sits on a
 * pane of frosted glass across the foot, the same glass as the guide's own
 * cover. Every pane is the same height whatever the title's length, so a row
 * of covers lines up. Under the title: the author's photograph and name, the
 * length, and JJ Premier Group. Type is sized to the card's width.
 */
export function GuideCard({ guide, author, priority }: { guide: Guide; author?: { name: string; headshot: ImageRef }; priority?: boolean }) {
  const minutes = guideReadingMinutes(guide);
  const first = (author?.name ?? guide.author.name).split(" ")[0];
  return (
    <Link href={guideHref(guide.slug)} className="card group flex w-full flex-col gap-4">
      <div className="@container relative aspect-[4/5] overflow-hidden bg-navy">
        <Photo image={guide.cover} priority={priority} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw" className="card-img" />
        <div className="absolute inset-0 bg-linear-to-b from-harbor-950/15 via-transparent to-harbor-950/55" aria-hidden="true" />
        <div className="guide-tile-glass absolute inset-x-[3.5cqw] bottom-[3.5cqw] flex h-[46cqw] flex-col justify-between px-[5.5cqw] pb-[4.2cqw] pt-[5cqw] text-white transition-transform duration-(--dur-card) group-hover:-translate-y-[1cqw]">
          <div className="flex flex-col gap-[3.2cqw]">
            <span className="block h-px w-[14%] bg-sky-300 transition-[width] duration-(--dur-card) group-hover:w-[34%]" aria-hidden="true" />
            <p className="line-clamp-3 text-balance font-display text-[6.6cqw] font-light leading-[1.08]">{guide.title}</p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/20 pt-[2.8cqw] text-white/80">
            <span className="flex min-w-0 items-center gap-[2.2cqw]">
              {author ? (
                <span className="relative size-[7.5cqw] shrink-0 overflow-hidden rounded-full ring-1 ring-white/70">
                  <Photo image={{ ...author.headshot, position: "50% 22%" }} sizes="48px" />
                </span>
              ) : null}
              <span className="truncate text-[3cqw]">
                By {first} · {minutes} min read
              </span>
            </span>
            <span className="shrink-0 font-wordmark text-[2.5cqw] font-semibold uppercase tracking-[0.3em]">JJ Premier Group</span>
          </div>
        </div>
      </div>
      <p className="t-small max-w-[44ch] text-body-muted">{guide.promise}</p>
    </Link>
  );
}
