import type { Route } from "next";
import Link from "next/link";
import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";

const FALLBACK = img("library/gulf-beach-aerial", "The Gulf shore from above");

export type TideCard = {
  href: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  data: string;
  issueLabel?: string;
  cover?: ImageRef;
  headline?: string;
};

/**
 * The issue's cover, small: its photograph under the harbor wash, "Tide" and
 * the month at the top, the headline at the foot. Nothing else on it, so it
 * reads like the front of a letter rather than a card of labels.
 */
function CoverThumb({ card, priority, sizes, className }: { card: TideCard; priority?: boolean; sizes: string; className: string }) {
  return (
    <div className={`tide-thumb relative overflow-hidden bg-navy text-white ${className}`}>
      <Photo image={card.cover ?? FALLBACK} priority={priority} sizes={sizes} className="card-img" />
      <div className="tide-thumb-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between gap-6 p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-white/25 pb-3">
          <span className="font-display text-[1.75rem] leading-none tracking-[-0.01em]">Tide</span>
          {card.issueLabel ? <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-linen-100">{card.issueLabel}</span> : null}
        </div>
        {card.headline ? <p className="t-h3 max-w-[30ch] text-balance text-white">{card.headline}</p> : null}
      </div>
    </div>
  );
}

/** One issue in the archive (/blog) and on /tide: its cover, then a line on what it covers. */
export function TideIssueCard({ card, priority, wide }: { card: TideCard; priority?: boolean; wide?: boolean }) {
  return (
    <Link
      href={card.href as Route}
      aria-label={card.headline ? `${card.title}: ${card.headline}` : card.title}
      className={
        wide
          ? "card group grid w-full border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor md:grid-cols-[1.2fr_1fr]"
          : "card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor"
      }
    >
      <CoverThumb
        card={card}
        priority={priority}
        sizes={wide ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        className={wide ? "aspect-[4/3] md:aspect-auto md:min-h-[360px]" : "aspect-[4/5]"}
      />
      <div className={wide ? "flex flex-1 flex-col justify-center gap-3 p-6 md:p-10" : "flex flex-1 flex-col gap-2 p-5"}>
        {wide ? <h3 className="t-h1 text-navy">{card.title}</h3> : null}
        <p className="t-small text-body-muted">{card.excerpt}</p>
        <p className="t-record mt-auto pt-2 text-graphite-500">{card.data}</p>
        <span className="card-line bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}
