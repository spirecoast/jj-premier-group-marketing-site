import Link from "next/link";
import { TrackedLink } from "@/components/tracked-link";
import { formatAddress, formatEventWhen, formatRun } from "@/lib/content/format";
import type { Event, VenueDateStatus } from "@/lib/content/types";
import { PANEL_COPY as C, STATUS, compactWhen, monthDay, overall, priceRange, upcomingDates } from "@/lib/encore/panel";
import { cn } from "@/lib/utils";
import { CheckedAgo } from "./checked-ago";

/**
 * "From the venue": the event page's side panel. What the venue's or
 * presenter's own listing says about the next dates (each with its status
 * and price when they publish one), when we last read it, and the two ways
 * out: their page and their tickets. Stands in for an embedded venue page:
 * it reads in the site's own type, fits a phone, and never loads a
 * third-party frame. Copy and rules: lib/encore/panel.ts.
 */

function StatusPill({ status }: { status: VenueDateStatus }) {
  const s = STATUS[status];
  if (!s) return null;
  return <span className={cn("venue-status", `is-${s.tone}`)}>{s.label}</span>;
}

export function VenuePanel({ event, mapsUrl, renderedAt }: { event: Event; mapsUrl: string; renderedAt: string }) {
  const live = event.live;
  const isRun = Boolean(event.runsThrough) && !event.performances?.length;
  const dates = upcomingDates(live?.dates ?? [], renderedAt);
  const shown = dates.slice(0, 6);
  const more = dates.length - shown.length;
  const head = overall(dates, event.status);
  const perDatePrice = dates.some((d) => d.priceMin != null);
  const priceText = event.priceNote && !["Sold out", "Cancelled", "Postponed"].includes(event.priceNote) ? event.priceNote : undefined;
  const price = priceText ?? priceRange(live?.priceMin, live?.priceMax);
  const free = /^free/i.test(price ?? "");
  const cancelled = event.status === "cancelled";
  const callable = !cancelled && head !== "sold-out";
  const presenter = event.presenter && event.presenter !== event.venue.name ? event.presenter : event.venue.name;
  const last = dates[dates.length - 1];

  return (
    <aside aria-labelledby="venue-panel-title" className="flex flex-col gap-6 self-start border border-hairline bg-white p-6 sm:p-7 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="venue-panel-title" className="t-eyebrow text-amber">
            {C.title}
          </h2>
          {head ? <StatusPill status={head} /> : null}
        </div>
        <p className="t-mono-sm text-graphite-500">
          {live?.checkedAt ? (
            <>
              Checked <CheckedAgo iso={live.checkedAt} renderedAt={renderedAt} /> on {presenter}&rsquo;s listing
            </>
          ) : (
            C.unchecked(presenter)
          )}
        </p>
      </header>

      <dl className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <dt className="t-mono-sm text-graphite-500">{isRun ? C.onView : dates.length > 1 ? C.nextDates : C.when}</dt>
          {isRun ? (
            <dd className="t-record text-navy">{formatRun(event) ?? C.onView}</dd>
          ) : shown.length ? (
            <dd className="flex flex-col">
              <ul className="flex flex-col">
                {shown.map((d) => {
                  const off = d.status === "cancelled" || d.status === "postponed";
                  return (
                    <li key={d.startsAt} className="venue-date">
                      <span className={cn("t-record min-w-0 text-navy", off && "text-graphite-500 line-through decoration-graphite-400")}>{compactWhen(d)}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        {perDatePrice && d.priceMin != null && !off ? <span className="t-mono-sm text-graphite-600">{priceRange(d.priceMin, d.priceMax)}</span> : null}
                        <StatusPill status={d.status} />
                        {!off ? (
                          <TrackedLink
                            href={`/api/calendar.ics?event=${event.slug}&at=${encodeURIComponent(d.startsAt)}`}
                            event="Calendar feed"
                            props={{ kind: "performance", filter: event.slug }}
                            className="t-mono-sm text-harbor-700 underline underline-offset-4 hover:text-navy"
                            aria-label={`Add ${compactWhen(d)} to your calendar`}
                          >
                            + Cal
                          </TrackedLink>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {more > 0 && last ? <span className="t-mono-sm pt-1.5 text-graphite-500">{C.more(more, monthDay.format(new Date(last.startsAt)))}</span> : null}
            </dd>
          ) : (
            <dd className="t-record text-navy">{formatEventWhen(event.startsAt, event.endsAt, event.allDay)}</dd>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <dt className="t-mono-sm text-graphite-500">{C.tickets}</dt>
          <dd className="t-record text-navy">{cancelled ? C.calledOff : head === "sold-out" ? C.soldOut : (price ?? C.seeVenue)}</dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="t-mono-sm text-graphite-500">{C.where}</dt>
          <dd className="flex flex-col gap-1">
            <Link href={`/venues/${event.venue.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
              {event.venue.name}
            </Link>
            {event.room ? <span className="t-small text-body-muted">{event.room}</span> : null}
            <span className="t-small text-body-muted">{formatAddress(event.venue.address)}</span>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link-rule mt-1 self-start">
              {C.maps}
            </a>
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        {event.ticketUrl && callable ? (
          <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-navy">
            {free ? C.signUp : C.getTickets}
            <span className="btn-dash" aria-hidden="true" />
          </a>
        ) : null}
        {live?.venuePage ? (
          <a href={live.venuePage} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            {C.venuePage(presenter)}
          </a>
        ) : null}
        {!event.ticketUrl && callable ? <p className="t-small text-body-muted">{free ? C.free : C.door}</p> : null}
      </div>

      {!cancelled ? (
        <TrackedLink href={`/api/calendar.ics?event=${event.slug}`} event="Calendar feed" props={{ kind: "event", filter: event.slug }} className="link-rule self-start">
          {dates.length > 1 ? C.addAll : C.addOne}
        </TrackedLink>
      ) : null}
      <p className="t-small border-t border-hairline pt-4 text-graphite-500">{C.footnote(presenter)}</p>
    </aside>
  );
}
