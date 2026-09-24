"use client";

import Link from "next/link";
import { CATEGORY } from "@/lib/encore/categories";
import type { EncoreEvent, EncoreIndex } from "@/lib/encore/index-format";
import {
  addDays,
  byDay,
  clock,
  dayNumber,
  daysInRange,
  longDay,
  monthEnd,
  monthStart,
  occurrences,
  onView,
  opensLater,
  shortDay,
  weekStart,
  weekday,
  weekdayShort,
  type Filter,
  type Occ,
} from "@/lib/encore/select";
import { cn } from "@/lib/utils";
import { AgendaRow, EventTile, RunCard } from "./tile";

type ListProps = { has: (slug: string) => boolean; toggle: (slug: string) => void };

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border border-hairline bg-white p-8 md:p-10">
      <p className="t-eyebrow text-amber">Nothing here</p>
      <h3 className="t-h2 text-navy">{title}</h3>
      <p className="t-body max-w-measure text-body">{body}</p>
      {action}
    </div>
  );
}

/** Tonight and This weekend: what you can actually go to. */
export function Spotlight({ index, today, filter, list, onDay }: { index: EncoreIndex; today: string; filter: Filter; list: ListProps; onDay: (d: string) => void }) {
  const now = Date.now();
  const tonight = occurrences(index, today, today, filter, now);
  const wd = weekday(today);
  const fri = wd === 0 ? addDays(today, -2) : wd === 6 ? addDays(today, -1) : addDays(today, 5 - wd);
  const sun = addDays(fri, 2);
  const wkStart = fri < today ? today : fri;
  const weekend = occurrences(index, wkStart, sun, filter, now).filter((o) => !(tonight.length && o.day === today));
  const weekendLabel = wd === 5 || wd === 6 || wd === 0 ? "This weekend" : `This weekend · ${shortDay(fri)}–${dayNumber(sun)}`;
  if (!tonight.length && !weekend.length) return null;
  return (
    <div className="flex flex-col gap-10">
      {tonight.length ? (
        <SpotRow title={wd === 0 ? "Today" : "Tonight"} count={tonight.length} occs={tonight} list={list} onMore={() => onDay(today)} />
      ) : null}
      {weekend.length ? <SpotRow title={weekendLabel} count={weekend.length} occs={weekend} list={list} showDay onMore={() => onDay(wkStart)} /> : null}
    </div>
  );
}

function SpotRow({ title, count, occs, list, showDay, onMore }: { title: string; count: number; occs: Occ[]; list: ListProps; showDay?: boolean; onMore: () => void }) {
  const shown = occs.slice(0, 12);
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-h2 text-navy">
          {title} <span className="t-mono-sm ml-2 text-graphite-500">{count}</span>
        </h2>
        {count > shown.length ? (
          <button type="button" className="link-rule" onClick={onMore}>
            All {count}
          </button>
        ) : null}
      </div>
      <div className="encore-rail">
        {shown.map((o) => (
          <EventTile key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} showDay={showDay} />
        ))}
      </div>
    </section>
  );
}

/** Day by day, with sticky day headers. */
export function Agenda({ index, from, to, today, filter, list, onNext }: { index: EncoreIndex; from: string; to: string; today: string; filter: Filter; list: ListProps; onNext: () => void }) {
  const occs = occurrences(index, from, to, filter, from <= today ? Date.now() : 0);
  const groups = byDay(occs);
  if (!groups.length) {
    return <Empty title="A quiet stretch on this filter." body="Try the next week, widen the filter, or search for a venue by name." action={<button type="button" className="link-rule self-start" onClick={onNext}>Next week →</button>} />;
  }
  return (
    <div className="flex flex-col gap-10">
      {groups.map(([day, items]) => (
        <section key={day} aria-labelledby={`d-${day}`} className="flex flex-col">
          <h2 id={`d-${day}`} className="encore-dayhead">
            <span>{day === today ? "Today · " : ""}{longDay(day)}</span>
            <span className="t-mono-sm text-graphite-500">{items.length}</span>
          </h2>
          <ul className="flex flex-col">
            {items.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Seven columns on desktop; on a phone the columns stack into the agenda. */
export function WeekView({ index, anchor, today, filter, list, onDay }: { index: EncoreIndex; anchor: string; today: string; filter: Filter; list: ListProps; onDay: (d: string) => void }) {
  const start = weekStart(anchor);
  const days = daysInRange(start, addDays(start, 6));
  const occs = occurrences(index, start, addDays(start, 6), filter);
  const groups = new Map(byDay(occs));
  const CAP = 9;
  return (
    <div className="encore-week">
      {days.map((d) => {
        const items = groups.get(d) ?? [];
        const past = d < today;
        return (
          <section key={d} className={cn("encore-week-col", d === today && "is-today", past && "is-past")} aria-label={longDay(d)}>
            <button type="button" className="encore-week-head" onClick={() => onDay(d)}>
              <span className="t-mono-sm">{weekdayShort(d)}</span>
              <span className="encore-week-num">{dayNumber(d)}</span>
              <span className="t-mono-sm text-graphite-500">{items.length || ""}</span>
            </button>
            <ul className="flex flex-col">
              {items.slice(0, CAP).map((o) => (
                <li key={`${o.e.s}-${o.start}`}>
                  <Link href={`/calendar/${o.e.s}`} className="encore-week-item" style={{ ["--cat" as string]: CATEGORY[o.e.c].color }}>
                    <span className="t-mono-sm text-graphite-500">{o.time ? clock(o.time) : "All day"}</span>
                    <span className="encore-week-title">{o.e.t}</span>
                    <span className="t-mono-sm truncate text-graphite-500">{o.e.vn}</span>
                  </Link>
                </li>
              ))}
              {items.length > CAP ? (
                <li>
                  <button type="button" className="t-mono-sm px-3 py-2 text-harbor-700 underline underline-offset-4 hover:text-navy" onClick={() => onDay(d)}>
                    + {items.length - CAP} more
                  </button>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** A month at a glance: titles on desktop, category dots on a phone, a tap opens the day. */
export function MonthView({ index, anchor, today, filter, list, onDay }: { index: EncoreIndex; anchor: string; today: string; filter: Filter; list: ListProps; onDay: (d: string) => void }) {
  const first = monthStart(anchor);
  const last = monthEnd(anchor);
  const lead = (weekday(first) + 6) % 7; // Monday first
  const days = daysInRange(first, last);
  const groups = new Map(byDay(occurrences(index, first, last, filter)));
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const selectedItems = groups.get(anchor) ?? [];
  return (
    <div className="flex flex-col gap-8">
      <div className="encore-month">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <div key={w} className="encore-month-wd">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} className="encore-month-cell is-blank" />;
          const items = groups.get(d) ?? [];
          const cats = [...new Set(items.map((o) => o.e.c))];
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDay(d)}
              aria-label={`${longDay(d)}, ${items.length} events`}
              aria-current={d === anchor ? "date" : undefined}
              className={cn("encore-month-cell", d === today && "is-today", d === anchor && "is-selected", d < today && "is-past")}
            >
              <span className="encore-month-num">{dayNumber(d)}</span>
              <span className="encore-month-titles">
                {items.slice(0, 3).map((o) => (
                  <span key={`${o.e.s}-${o.start}`} className="encore-month-title" style={{ ["--cat" as string]: CATEGORY[o.e.c].color }}>
                    {o.e.t}
                  </span>
                ))}
                {items.length > 3 ? <span className="t-mono-sm text-graphite-500">+{items.length - 3}</span> : null}
              </span>
              <span className="encore-month-dots" aria-hidden="true">
                {cats.slice(0, 5).map((c) => (
                  <i key={c} style={{ background: CATEGORY[c].color }} />
                ))}
                {items.length ? <em>{items.length}</em> : null}
              </span>
            </button>
          );
        })}
      </div>
      <section aria-labelledby="month-day" className="flex flex-col">
        <h2 id="month-day" className="encore-dayhead">
          <span>{anchor === today ? "Today · " : ""}{longDay(anchor)}</span>
          <span className="t-mono-sm text-graphite-500">{selectedItems.length}</span>
        </h2>
        {selectedItems.length ? (
          <ul className="flex flex-col">
            {selectedItems.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} />
            ))}
          </ul>
        ) : (
          <p className="t-body py-6 text-body-muted">Nothing on this day for this filter. Pick another day above.</p>
        )}
      </section>
    </div>
  );
}

/** Exhibitions and runs: on view now, then opening soon. */
export function OnViewGrid({ index, today, filter, list }: { index: EncoreIndex; today: string; filter: Filter; list: ListProps }) {
  const open = onView(index, today, filter);
  const later = opensLater(index, today, filter);
  if (!open.length && !later.length) return <Empty title="Nothing on view for this filter." body="Galleries and museums list their exhibitions here. Widen the filter or clear the search." />;
  return (
    <div className="flex flex-col gap-12">
      {open.length ? (
        <section className="flex flex-col gap-5" aria-label="On view now">
          <h2 className="encore-dayhead">
            <span>On view now</span>
            <span className="t-mono-sm text-graphite-500">{open.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((e) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} />
            ))}
          </div>
        </section>
      ) : null}
      {later.length ? (
        <section className="flex flex-col gap-5" aria-label="Opening later">
          <h2 className="encore-dayhead">
            <span>Opening later</span>
            <span className="t-mono-sm text-graphite-500">{later.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {later.map((e) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** A saved or shared list: every upcoming date of each show, in order. */
export function ListView({ index, slugs, today, list, shared, onSaveAll }: { index: EncoreIndex; slugs: string[]; today: string; list: ListProps; shared: boolean; onSaveAll?: () => void }) {
  const set = new Set(slugs);
  const events = index.events.filter((e) => set.has(e.s));
  const occs = occurrences(index, today, addDays(today, 365), {}, Date.now()).filter((o) => set.has(o.e.s));
  const runs = events.filter((e) => e.x);
  const missing = slugs.length - events.length;
  if (!events.length) {
    return <Empty title={shared ? "This list has nothing coming up." : "Nothing saved yet."} body={shared ? "The shows on it have passed, or the link is incomplete." : "Tap Save on any show and it lands here. The list stays on this device until you share it."} />;
  }
  const groups = byDay(occs);
  return (
    <div className="flex flex-col gap-8">
      {shared && onSaveAll ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-hairline bg-white px-5 py-4">
          <p className="t-body text-body">
            A list someone shared: {events.length} {events.length === 1 ? "show" : "shows"}.
          </p>
          <button type="button" className="btn btn-navy !min-h-10 !px-4 !text-[11px]" onClick={onSaveAll}>
            Save them all to my list
            <span className="btn-dash" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {groups.map(([day, items]) => (
        <section key={day} className="flex flex-col">
          <h2 className="encore-dayhead">
            <span>{day === today ? "Today · " : ""}{longDay(day)}</span>
            <span className="t-mono-sm text-graphite-500">{items.length}</span>
          </h2>
          <ul className="flex flex-col">
            {items.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} />
            ))}
          </ul>
        </section>
      ))}
      {runs.length ? (
        <section className="flex flex-col gap-5">
          <h2 className="encore-dayhead">
            <span>On view</span>
            <span className="t-mono-sm text-graphite-500">{runs.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runs.map((e) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} />
            ))}
          </div>
        </section>
      ) : null}
      {missing > 0 ? <p className="t-mono-sm text-graphite-500">{missing} saved {missing === 1 ? "show has" : "shows have"} passed.</p> : null}
    </div>
  );
}

export type { EncoreEvent };
