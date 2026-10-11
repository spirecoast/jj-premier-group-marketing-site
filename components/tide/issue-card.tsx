import type { Route } from "next";
import Link from "next/link";
import type { ImageRef } from "@/lib/content/types";
import { TideCover } from "./tide-cover";

export type TideCard = {
  href: string;
  title: string;
  excerpt: string;
  data: string;
  issue?: string;
  issueLabel?: string;
  cover?: ImageRef;
  headline?: string;
};

/** One past issue on /tide: its cover, then the month and what it covered. */
export function TideIssueCard({ card, priority }: { card: TideCard; priority?: boolean }) {
  return (
    <Link
      href={card.href as Route}
      aria-label={card.headline ? `${card.title}: ${card.headline}` : card.title}
      className="card group flex w-full flex-col gap-4"
    >
      <TideCover card={card} priority={priority} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw" />
      <div className="flex flex-col gap-1">
        <h3 className="t-h3 text-navy transition-colors group-hover:text-harbor-700">{card.title}</h3>
        <p className="t-small text-body-muted">{card.data}</p>
      </div>
    </Link>
  );
}
