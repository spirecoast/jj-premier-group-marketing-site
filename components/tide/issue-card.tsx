import type { Route } from "next";
import Link from "next/link";
import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";

const COVER = img("library/gulf-beach-aerial", "The Gulf shore from above");

export type TideCard = { href: string; eyebrow: string; title: string; excerpt: string; data: string };

/** One issue in the archive (/blog) and on /tide: the issue month as the title, the data month under it. */
export function TideIssueCard({ card, priority, wide }: { card: TideCard; priority?: boolean; wide?: boolean }) {
  return (
    <Link
      href={card.href as Route}
      className={
        wide
          ? "card group grid w-full border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor md:grid-cols-[1.2fr_1fr]"
          : "card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor"
      }
    >
      <div className={wide ? "relative aspect-[3/2] overflow-hidden bg-linen-100 md:aspect-auto md:min-h-[320px]" : "relative aspect-[3/2] overflow-hidden bg-linen-100"}>
        <Photo image={COVER} priority={priority} sizes={wide ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"} className="card-img" />
      </div>
      <div className={wide ? "flex flex-1 flex-col justify-center gap-3 p-6 md:p-10" : "flex flex-1 flex-col gap-2 p-5"}>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{card.eyebrow}</p>
        <h3 className={wide ? "t-h1 text-navy" : "t-h3 text-navy"}>{card.title}</h3>
        <p className="t-small text-body-muted">{card.excerpt}</p>
        <p className="t-record mt-auto pt-2 text-graphite-500">{card.data}</p>
        <span className="card-line bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}
