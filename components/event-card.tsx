import Link from "next/link";
import type { Event } from "@/lib/content/types";
import { formatEventShort, formatEventWhen, formatRun, formatTime, weekdayName } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { cn } from "@/lib/utils";
import { KeyArt } from "./key-art";
import { Photo } from "./photo";

function placeDay(e: Event, at?: string): string {
  const when = e.runsThrough && !e.performances?.length ? "On view" : weekdayName(at ?? e.startsAt);
  return `${marketName(e.venue.market)} · ${when}`;
}

type Props = {
  event: Event;
  variant?: "feature" | "row" | "grid";
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Row variant: add time, venue and price under the title. */
  showMeta?: boolean;
  /** The specific performance to show, when the card stands for one date of a run. */
  at?: { startsAt: string; endsAt?: string; allDay?: boolean };
};

/**
 * Event card. `feature` is the tall photograph with type over it; `row` is
 * the compact list item that slides 16px on hover; `grid` is the calendar
 * index card. About the venue, never the listing.
 */
export function EventCard({ event, variant = "grid", className, sizes, priority, showMeta, at }: Props) {
  const href = `/calendar/${event.slug}` as const;
  const startsAt = at?.startsAt ?? event.startsAt;
  const endsAt = at ? at.endsAt : event.endsAt;
  const allDay = at ? at.allDay : event.allDay;
  const run = formatRun(event);

  if (variant === "feature") {
    return (
      <Link href={href} className={cn("card group relative block min-h-[420px] overflow-hidden bg-navy lg:min-h-[560px]", className)}>
        {event.image ? (
          <Photo image={event.image} sizes={sizes ?? "(min-width: 1024px) 58vw, 100vw"} priority={priority} className="card-img" />
        ) : (
          <KeyArt category={event.category} seed={event.slug} subcategory={event.subcategory} className="card-img" ratio={1.3} />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-harbor-950/95 via-harbor-950/60 via-40% to-transparent to-64%"
          aria-hidden="true"
        />
        <div className="absolute inset-x-6 bottom-7 flex flex-col gap-3 lg:inset-x-8">
          <p className="t-mono-sm text-sky-300">{placeDay(event, startsAt)}</p>
          <h3 className="font-display text-[clamp(1.625rem,3vw,2.5rem)] font-light leading-[1.04] text-white">
            {event.title}
          </h3>
          {event.summary && event.summary !== event.title ? (
            <p className="t-small line-clamp-2 max-w-[520px] text-linen-200/90">{event.summary}</p>
          ) : null}
          <span className="card-line bg-sky-300" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link
        href={href}
        className={cn("row-link flex min-w-0 max-w-full items-center gap-4 border border-hairline bg-white p-3.5 pr-4 sm:gap-[18px]", className)}
      >
        <div className="relative h-[84px] w-[110px] shrink-0 overflow-hidden bg-linen-100 sm:h-24 sm:w-[130px]">
          {event.image ? <Photo image={event.image} sizes="130px" /> : <KeyArt category={event.category} seed={event.slug} subcategory={event.subcategory} ratio={130 / 96} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-sky-700">{placeDay(event, startsAt)}</p>
          <h3 className="t-h3 text-navy">{event.title}</h3>
          {showMeta ? (
            <p className="t-record break-words text-graphite-600">
              {allDay ? (run ?? "All day") : formatTime(startsAt)} · {event.venue.name}
              {event.priceNote ? ` · ${event.priceNote}` : ""}
            </p>
          ) : null}
        </div>
        <span className="row-arrow font-mono text-[14px] text-amber" aria-hidden="true">
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "card group flex flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor focus-visible:border-deep-harbor",
        className,
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        {event.image ? (
          <Photo image={event.image} sizes={sizes ?? "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"} className="card-img" />
        ) : (
          <KeyArt category={event.category} seed={event.slug} subcategory={event.subcategory} className="card-img" ratio={3 / 2} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{placeDay(event, startsAt)}</p>
        <h3 className="t-h3 text-navy">{event.title}</h3>
        <p className="t-record text-graphite-600">{run && !event.performances?.length ? run : formatEventWhen(startsAt, endsAt, allDay)}</p>
        <p className="t-small text-body-muted">
          {event.venue.name}
          {event.priceNote ? ` · ${event.priceNote}` : ""}
        </p>
        <span className="card-line mt-auto bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}

/** A compact line for lists inside other pages. */
export function EventLine({ event }: { event: Event }) {
  return (
    <Link href={`/calendar/${event.slug}`} className="row-link flex items-center justify-between gap-4 border-b border-hairline py-4">
      <div className="flex flex-col gap-1">
        <span className="t-h4 text-navy">{event.title}</span>
        <span className="t-record text-graphite-500">{formatEventShort(event.startsAt)} · {event.venue.name}</span>
      </div>
      <span className="row-arrow font-mono text-amber" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
