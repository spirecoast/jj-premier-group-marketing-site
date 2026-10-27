"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CATEGORY } from "@/lib/encore/categories";
import type { EncoreEvent, EncoreIndex } from "@/lib/encore/index-format";
import {
  addDays,
  byDay,
  dayNumber,
  daysInRange,
  longDay,
  monthEnd,
  monthStart,
  nextMatchDay,
  occurrences,
  onView,
  opensLater,
  shortDay,
  timeLabel,
  weekStart,
  weekday,
  weekdayShort,
  type Filter,
  type Occ,
} from "@/lib/encore/select";
import { varyStock } from "@/lib/encore/stock";
import { scrollBehavior } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "./glyphs";
import { AgendaRow, EventTile, RunCard } from "./tile";
import "./encore.css";

type ListProps = { has: (slug: string) => boolean; toggle: (slug: string) => void };

/** How far ahead the empty states and a search look. */
export const SEASON_DAYS = 365;

/** Stand-in art for a list of cards, so a stock photo never sits beside itself. */
const artFor = (items: EncoreEvent[]) => varyStock(items.map((e) => ({ category: e.c, subcategory: e.sc, seed: e.s })));

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="encore-rise flex flex-col gap-3 border border-hairline bg-white p-8 md:p-10">
      <h3 className="t-h2 text-navy">{title}</h3>
      <p className="t-body max-w-measure text-body">{body}</p>
      {action}
    </div>
  );
}

/** "Next: Thursday, November 12 →": the first later day with a match, or the plain truth that there is none. */
export function NextMatch({ index, from, filter, onDay, children }: { index: EncoreIndex; from: string; filter: Filter; onDay: (d: string) => void; children?: ReactNode }) {
  const next = nextMatchDay(index, addDays(from, 1), addDays(from, SEASON_DAYS), filter);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {next ? (
        <button type="button" className="link-rule" onClick={() => onDay(next)}>
          Next: {longDay(next)} →
        </button>
      ) : null}
      {children}
    </div>
  );
}

/** Four 56px rows while the season loads. */
export function Skeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col" aria-hidden="true">
      <div className="encore-dayhead">
        <span>{label}</span>
      </div>
      {[0, 1, 2, 3].map((k) => (
        <div key={k} className="encore-skeleton">
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <i style={{ width: "3.5rem" }} />
            <i style={{ width: `${62 - k * 6}%`, height: "1rem" }} />
          </span>
          <i style={{ width: "2.75rem", height: "2.75rem", flex: "none" }} />
        </div>
      ))}
    </div>
  );
}

/** Tonight and This weekend: what you can actually go to. */
export function Spotlight({ index, today, filter, list, onTonight, onWeekend }: { index: EncoreIndex; today: string; filter: Filter; list: ListProps; onTonight: () => void; onWeekend: () => void }) {
  const now = Date.now();
  const tonight = occurrences(index, today, today, filter, now);
  const wd = weekday(today);
  const fri = wd === 0 ? addDays(today, -2) : wd === 6 ? addDays(today, -1) : addDays(today, 5 - wd);
  const sun = addDays(fri, 2);
  const wkStart = fri < today ? today : fri;
  const weekend = occurrences(index, wkStart, sun, filter, now).filter((o) => !(tonight.length && o.day === today));
  const weekendLabel = wd === 5 || wd === 6 || wd === 0 ? "This weekend" : `This weekend · ${shortDay(fri)}–${sun.slice(5, 7) === fri.slice(5, 7) ? dayNumber(sun) : shortDay(sun)}`;
  if (!tonight.length && !weekend.length) return null;
  return (
    <div className="flex flex-col gap-10">
      {tonight.length ? <SpotRow title={wd === 0 ? "Today" : "Tonight"} count={tonight.length} occs={tonight} list={list} onMore={onTonight} /> : null}
      {weekend.length ? <SpotRow title={weekendLabel} count={weekend.length} occs={weekend} list={list} showDay onMore={onWeekend} /> : null}
    </div>
  );
}

/** A rail of tiles with Prev and Next from lg; the right edge fades while there is more. */
function SpotRow({ title, count, occs, list, showDay, onMore }: { title: string; count: number; occs: Occ[]; list: ListProps; showDay?: boolean; onMore: () => void }) {
  const shown = occs.slice(0, 12);
  const art = artFor(shown.map((o) => o.e));
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const read = () => setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, [shown.length]);
  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild?.getBoundingClientRect().width ?? 300;
    el.scrollBy({ left: dir * (card + 12), behavior: scrollBehavior() });
  };
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="t-h2 text-navy">
          {title} <span className="t-mono-sm ml-2 text-graphite-500">{count}</span>
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {shown.length > 1 ? (
            <span className="hidden items-center gap-2 lg:flex">
              <button type="button" className="btn-quiet is-square" aria-label={`Earlier in ${title}`} onClick={() => step(-1)} disabled={edge.start}>
                <ChevronLeft />
              </button>
              <button type="button" className="btn-quiet is-square" aria-label={`Later in ${title}`} onClick={() => step(1)} disabled={edge.end}>
                <ChevronRight />
              </button>
            </span>
          ) : null}
          <button type="button" className="link-rule" onClick={onMore}>
            All {count}
          </button>
        </div>
      </div>
      <div ref={rail} className="encore-rail" data-more={edge.end ? "false" : "true"}>
        {shown.map((o, i) => (
          <EventTile key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} showDay={showDay} art={art[i]} i={i} />
        ))}
      </div>
    </section>
  );
}

/** Day by day, with sticky day headers. */
export function Agenda({
  index,
  from,
  to,
  today,
  filter,
  list,
  onDay,
  loading,
  emptyTitle,
  emptyBody,
  onClear,
  nowMs,
}: {
  index: EncoreIndex;
  from: string;
  to: string;
  today: string;
  filter: Filter;
  list: ListProps;
  onDay: (d: string) => void;
  /** The full season hasn't arrived and this window needs it. */
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  onClear?: () => void;
  /** Hide what has already finished (tonight's rail and the tonight shortcut); 0 keeps everything. */
  nowMs?: number;
}) {
  const occs = occurrences(index, from, to, filter, nowMs ?? (from <= today ? Date.now() : 0));
  const groups = byDay(occs);
  if (!groups.length) {
    if (loading) return <Skeleton label={longDay(from)} />;
    return (
      <Empty
        title={emptyTitle ?? "A quiet stretch on this filter."}
        body={emptyBody ?? "Try the next day with something on, widen the filter, or search for a venue by name."}
        action={
          <NextMatch index={index} from={to} filter={filter} onDay={onDay}>
            {onClear && (filter.category || filter.market || filter.venue) ? (
              <button type="button" className="btn-quiet" onClick={onClear}>
                Clear filters
              </button>
            ) : null}
          </NextMatch>
        }
      />
    );
  }
  let i = 0;
  return (
    <div className="flex flex-col gap-10">
      {groups.map(([day, items]) => (
        <section key={day} id={`d-${day}`} aria-labelledby={`dh-${day}`} className="flex scroll-mt-[calc(var(--header-h)+var(--band-h,0px)+0.5rem)] flex-col">
          <h2 id={`dh-${day}`} className="encore-dayhead">
            <span>
              {day === today ? "Today · " : ""}
              {longDay(day)}
            </span>
            <span className="t-mono-sm text-graphite-500">{items.length}</span>
          </h2>
          <ul className="flex flex-col">
            {items.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} i={i++} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * A search: every match in the season, grouped by day, with the runs that
 * match after. The heading counts shows, not dates, and names the first.
 */
export function SearchResults({ index, today, filter, list, loading, onDay, venueSelect }: { index: EncoreIndex; today: string; filter: Filter; list: ListProps; loading: boolean; onDay: (d: string) => void; venueSelect: ReactNode }) {
  const to = addDays(today, SEASON_DAYS);
  const occs = occurrences(index, today, to, filter, Date.now());
  const runs = [...onView(index, today, filter), ...opensLater(index, today, filter)];
  const shows = new Set(occs.map((o) => o.e.s));
  const groups = byDay(occs);
  if (!occs.length && !runs.length) {
    if (loading) return <Skeleton label="Searching the season" />;
    return <Empty title="Nothing by that name this season." body="Check the spelling, or pick a venue and browse what it has on." action={venueSelect} />;
  }
  const first = groups[0]?.[0];
  const last = groups[groups.length - 1]?.[0];
  const art = artFor(runs);
  let i = 0;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="t-h2 text-navy">
          {shows.size + runs.length} {shows.size + runs.length === 1 ? "show" : "shows"} this season
        </h2>
        <p className="t-body max-w-measure text-body">
          {occs.length ? `${occs.length} ${occs.length === 1 ? "date" : "dates"}, the first on ${longDay(first!)}. ` : ""}
          {runs.length ? `${runs.length} ${runs.length === 1 ? "exhibition or run" : "exhibitions and runs"}. ` : ""}
          {occs.length > 8 ? "The strip above scrolls the list." : ""}
        </p>
      </div>
      {groups.map(([day, items]) => (
        <section key={day} id={`d-${day}`} aria-labelledby={`dh-${day}`} className="flex scroll-mt-[calc(var(--header-h)+var(--band-h,0px)+0.5rem)] flex-col">
          <h2 id={`dh-${day}`} className="encore-dayhead">
            <span>
              {day === today ? "Today · " : ""}
              {longDay(day)}
            </span>
            <span className="t-mono-sm text-graphite-500">{items.length}</span>
          </h2>
          <ul className="flex flex-col">
            {items.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} i={i++} />
            ))}
          </ul>
        </section>
      ))}
      {runs.length ? (
        <section className="flex flex-col gap-5" aria-label="On view">
          <h2 className="encore-dayhead">
            <span>On view</span>
            <span className="t-mono-sm text-graphite-500">{runs.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runs.map((e, k) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} art={art[k]} i={k} />
            ))}
          </div>
        </section>
      ) : null}
      {last && last !== first ? <p className="t-mono-sm text-graphite-500">Dates through {shortDay(last)}</p> : null}
      {!loading ? null : <p className="t-note">Still loading the rest of the season.</p>}
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
  void list;
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
                    <span className="t-mono-sm text-graphite-500">{timeLabel(o)}</span>
                    <span className="encore-week-title">{o.e.t}</span>
                    <span className="t-note truncate">{o.e.vn}</span>
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
          <span>
            {anchor === today ? "Today · " : ""}
            {longDay(anchor)}
          </span>
          <span className="t-mono-sm text-graphite-500">{selectedItems.length}</span>
        </h2>
        {selectedItems.length ? (
          <ul className="flex flex-col">
            {selectedItems.map((o, i) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} i={i} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-4 py-6">
            <p className="t-body text-body-muted">Nothing on this day for this filter.</p>
            <NextMatch index={index} from={anchor} filter={filter} onDay={onDay} />
          </div>
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
  const art = artFor([...open, ...later]);
  return (
    <div className="flex flex-col gap-12">
      {open.length ? (
        <section className="flex flex-col gap-5" aria-label="On view now">
          <h2 className="encore-dayhead">
            <span>On view now</span>
            <span className="t-mono-sm text-graphite-500">{open.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((e, i) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} art={art[i]} i={i} />
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
            {later.map((e, i) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} art={art[open.length + i]} i={i} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** A saved or shared list: every upcoming date of each show, in order. */
export function ListView({ index, slugs, today, list, shared, loading, onSaveAll }: { index: EncoreIndex; slugs: string[]; today: string; list: ListProps; shared: boolean; loading?: boolean; onSaveAll?: () => void }) {
  const set = new Set(slugs);
  const events = index.events.filter((e) => set.has(e.s));
  const occs = occurrences(index, today, addDays(today, SEASON_DAYS), {}, Date.now()).filter((o) => set.has(o.e.s));
  const runs = events.filter((e) => e.x);
  const missing = slugs.length - events.length;
  if (!events.length) {
    if (loading && slugs.length) return <Skeleton label={shared ? "A shared list" : "My list"} />;
    return <Empty title={shared ? "This list has nothing coming up." : "Nothing saved yet."} body={shared ? "The shows on it have passed, or the link is incomplete." : "Tap the bookmark on any show and it's saved here. The list stays on this device until you share it."} />;
  }
  const groups = byDay(occs);
  const art = artFor(runs);
  let i = 0;
  return (
    <div className="flex flex-col gap-8">
      {shared && onSaveAll ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-hairline bg-white px-5 py-4">
          <p className="t-body text-body">
            A list someone shared: {events.length} {events.length === 1 ? "show" : "shows"}.
          </p>
          <button type="button" className="btn btn-navy" onClick={onSaveAll}>
            Save them all to my list
            <span className="btn-dash" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {groups.map(([day, items]) => (
        <section key={day} className="flex flex-col">
          <h2 className="encore-dayhead">
            <span>
              {day === today ? "Today · " : ""}
              {longDay(day)}
            </span>
            <span className="t-mono-sm text-graphite-500">{items.length}</span>
          </h2>
          <ul className="flex flex-col">
            {items.map((o) => (
              <AgendaRow key={`${o.e.s}-${o.start}`} o={o} saved={list.has(o.e.s)} onSave={() => list.toggle(o.e.s)} i={i++} />
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
            {runs.map((e, k) => (
              <RunCard key={e.s} e={e} today={today} saved={list.has(e.s)} onSave={() => list.toggle(e.s)} art={art[k]} i={k} />
            ))}
          </div>
        </section>
      ) : null}
      {missing > 0 && !loading ? <p className="t-note">{missing} saved {missing === 1 ? "show has" : "shows have"} passed.</p> : null}
    </div>
  );
}

export type { EncoreEvent };
