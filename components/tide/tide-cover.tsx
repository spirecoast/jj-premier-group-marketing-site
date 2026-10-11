import { TideWordmark } from "@/components/brand/marks";
import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export { TideWordmark };

const FALLBACK = img("library/gulf-beach-aerial", "The Gulf shore from above");

export type TideCoverCard = {
  issue?: string;
  issueLabel?: string;
  headline?: string;
  /** The cover line and the sentence under it (lib/tide/issues.ts); without them the headline goes on the cover. */
  coverTitle?: string;
  coverKicker?: string;
  cover?: ImageRef;
};

/**
 * An issue's cover, as designed in Figma (page "03 Tide cover"): the
 * photograph under a navy wash; the team and the month on the top line; the
 * Tide wordmark with "Monthly Market Report" under it; and at the foot the
 * cover line as large as it'll go, the sentence that backs it, and the three
 * places. Type is sized to the cover's width, so the same cover works as a
 * thumbnail and as the feature; the kicker shows once the cover is wide
 * enough to read it.
 */
export function TideCover({ card, priority, sizes, className }: { card: TideCoverCard; priority?: boolean; sizes: string; className?: string }) {
  const line = card.coverTitle ?? card.headline;
  const big = Boolean(card.coverTitle);
  return (
    <div className={cn("@container relative aspect-[4/5] overflow-hidden bg-harbor-950 text-white", className)}>
      <Photo image={card.cover ?? FALLBACK} priority={priority} sizes={sizes} className="card-img" />
      <div className="tide-card-wash absolute inset-0" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between px-[7cqw] pb-[6cqw] pt-[6.2cqw]">
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-4 font-sans text-[max(8.5px,1.9cqw)] font-medium uppercase tracking-[0.22em] text-linen-100">
            <span>JJ Premier Group</span>
            {card.issueLabel ? <span>{card.issueLabel}</span> : null}
          </div>
          <span className="mt-[3cqw] block h-px bg-white/35" aria-hidden="true" />
          <TideWordmark id={`tw-${card.issue ?? "x"}`} className="mt-[0.5cqw] w-full text-white" decorative />
          <p className="-mt-[0.5cqw] font-display text-[4.4cqw] font-light italic leading-none text-linen-200">Monthly Market Report</p>
        </div>
        <div className="flex flex-col">
          {line ? (
            <>
              <span className="mb-[3.4cqw] block h-[max(2px,0.38cqw)] w-[8cqw] bg-tide" aria-hidden="true" />
              <p
                className={cn(
                  "text-balance font-display font-light text-white text-shadow-photo",
                  big ? "text-[12.6cqw] leading-[0.96] tracking-[-0.02em]" : "max-w-[24ch] text-[7.4cqw] leading-[1.06]",
                )}
              >
                {line}
              </p>
            </>
          ) : null}
          {card.coverKicker ? (
            <p className="mt-[2.8cqw] hidden max-w-[78cqw] font-sans text-[2.7cqw] leading-[1.42] text-linen-100/95 @[26rem]:block">{card.coverKicker}</p>
          ) : null}
          <span className="mt-[4cqw] block h-px bg-white/35" aria-hidden="true" />
          <p className="mt-[2.6cqw] font-sans text-[max(8px,1.75cqw)] font-medium uppercase tracking-[0.2em] text-linen-100/90">
            Lakewood Ranch · Sarasota · Bradenton
          </p>
        </div>
      </div>
    </div>
  );
}
