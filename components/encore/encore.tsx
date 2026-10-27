"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ShareButton } from "@/components/share-button";
import { track } from "@/lib/analytics";
import { marketName } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { CATEGORY } from "@/lib/encore/categories";
import { localDay } from "@/lib/encore/day";
import { useToday } from "@/lib/use-today";
import { FIRST_PAINT_DAYS, SEASON_URL, type EncoreIndex } from "@/lib/encore/index-format";
import { addDays, countsByCategory, countsByDay, dayNumber, monthEnd, monthLabel, monthStart, occurrences, onView, opensLater, shortDay, weekStart, weekendOf, weekday, type Filter } from "@/lib/encore/select";
import { ENCORE_KEYS, encoreHref, parseEncoreState, VIEWS, type EncoreState, type EncoreView, type EncoreWhen } from "@/lib/encore/url";
import { loadJson } from "@/lib/use-json-resource";
import { scrollBehavior } from "@/lib/scroll";
import { hasAny, replaceQuery, sessionMemory, useUrlInitial } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { DayStrip } from "./day-strip";
import { FilterSheet, VenueSelect } from "./filter-sheet";
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Cross, Magnifier } from "./glyphs";
import { useMyList } from "./use-my-list";
import { Agenda, ListView, MonthView, OnViewGrid, SEASON_DAYS, SearchResults, Spotlight, WeekView } from "./views";
import "./encore.css";

const STRIP_DAYS = 120;
const siteDay = (d: Date) => localDay(d.getTime());
const VIEW_LABEL: Record<EncoreView, string> = { days: "Days", week: "Week", month: "Month", onview: "On view" };

/**
 * Encore. One state (view, day, filters, search, a shortcut) that the URL,
 * the strip and the body all reflect. The first paint uses the slice the
 * server sent (three weeks, no summaries); the whole season is fetched the
 * moment a move needs it (a search, a far day, the month view, a list) and
 * otherwise in idle time after the first touch, so the first tap never
 * waits on a re-render of 600 events.
 */
export function Encore({
  initial,
  today: todayAtOpen,
  initialIndex,
  sliceRange,
}: {
  initial: EncoreState;
  today: string;
  initialIndex: EncoreIndex;
  /** The days the server's slice covers; a move outside them fetches the full season. */
  sliceRange: [string, string];
}) {
  /* The site's day, kept current: a tab left open past midnight stops calling yesterday "Tonight". */
  const today = useToday(todayAtOpen, siteDay);
  const [index, setIndex] = useState<EncoreIndex>(initialIndex);
  const [full, setFull] = useState(false);
  const [view, setView] = useState<EncoreView>(initial.view);
  const [date, setDate] = useState(initial.date || today);
  /* At midnight the day on screen follows, when it was today; a day the visitor picked stays. */
  const dayShown = useRef(today);
  useEffect(() => {
    const was = dayShown.current;
    dayShown.current = today;
    if (was !== today) setDate((d) => (d === was ? today : d));
  }, [today]);
  const [category, setCategory] = useState(initial.category);
  const [market, setMarket] = useState(initial.market);
  const [venue, setVenue] = useState(initial.venue);
  const [q, setQ] = useState(initial.q);
  const [when, setWhen] = useState<EncoreWhen | undefined>(initial.when);
  const [mode, setMode] = useState<"browse" | "mine" | "shared">(initial.list.length ? "shared" : "browse");
  const [sheet, setSheet] = useState(false);
  const [seasonError, setSeasonError] = useState(false);
  const sliceTo = sliceRange[1];
  const [stripTo, setStripTo] = useState(addDays(today, FIRST_PAINT_DAYS - 1));
  const my = useMyList();
  const rootRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ---- The whole season, once, when something needs it ------------------- */
  const fetching = useRef<"idle" | "loading" | "done">("idle");
  const ensureFull = useCallback(() => {
    if (fetching.current !== "idle") return;
    fetching.current = "loading";
    setSeasonError(false);
    // One fetch per visit, shared with the Planner (lib/use-json-resource.ts).
    loadJson<EncoreIndex>(SEASON_URL)
      .then((data) => {
        fetching.current = "done";
        startTransition(() => {
          setIndex(data);
          setFull(true);
        });
      })
      .catch(() => {
        fetching.current = "idle";
        setSeasonError(true);
      });
  }, []);
  const searching = mode === "browse" && q.trim().length > 0;
  const needsFull = searching || mode !== "browse" || view === "month" || today < sliceRange[0] || date > sliceTo || (view === "week" && addDays(weekStart(date), 6) > sliceTo) || stripTo > sliceTo;
  useEffect(() => {
    if (needsFull) ensureFull();
  }, [needsFull, ensureFull]);
  // Otherwise: after the first touch, in idle time.
  useEffect(() => {
    let idle: number | undefined;
    const arm = () => {
      off();
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) idle = w.requestIdleCallback(ensureFull, { timeout: 4000 });
      else idle = window.setTimeout(ensureFull, 1500);
    };
    const off = () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("scroll", arm);
    };
    window.addEventListener("pointerdown", arm, { passive: true, once: true });
    window.addEventListener("keydown", arm, { passive: true, once: true });
    window.addEventListener("scroll", arm, { passive: true, once: true });
    return () => {
      off();
      if (idle !== undefined) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, [ensureFull]);

  /* ---- Derived -------------------------------------------------------------- */
  const filter: Filter = useMemo(() => ({ category, market, venue, q }), [category, market, venue, q]);
  const anchor = date;
  const [from, to] = useMemo((): [string, string] => {
    if (when === "tonight") return [today, today];
    if (when === "weekend") return weekendOf(today);
    if (view === "week") {
      const s = weekStart(anchor);
      return [s, addDays(s, 6)];
    }
    if (view === "month") return [monthStart(anchor), monthEnd(anchor)];
    return [anchor, addDays(anchor, 6)];
  }, [view, anchor, when, today]);

  const dayCounts = useMemo(() => countsByDay(index, today, stripTo, filter), [index, today, stripTo, filter]);
  const maxCount = useMemo(() => Math.max(1, ...dayCounts.values()), [dayCounts]);
  const catCounts = useMemo(() => countsByCategory(index, from, to, { ...filter, q: searching ? q : undefined }), [index, from, to, filter, searching, q]);
  const venueOptions = useMemo(() => [...index.venues].sort((a, b) => a.n.localeCompare(b.n)), [index.venues]);
  const venueName = venue ? (index.venues.find((v) => v.s === venue)?.n ?? venue) : undefined;
  const total = useMemo(() => {
    if (view === "onview") return onView(index, today, filter).length + opensLater(index, today, filter).length;
    return occurrences(index, from, to, filter, from <= today ? Date.now() : 0).length;
  }, [index, view, from, to, filter, today]);

  /* ---- The URL follows the state ------------------------------------------- */
  // The address follows the committed choices (view, day, filters, a shortcut, a shared list), once per change.
  // Not on arrival, so the landing URL (and its utm_* tags) stays as it came. The search words stay
  // in this tab (lib/url-state.ts) and reach a link only through Share.
  const firstUrl = useRef(true);
  useEffect(() => {
    if (firstUrl.current) {
      firstUrl.current = false;
      return;
    }
    replaceQuery(encoreHref({ view, date: date === today ? "" : date, category, market, venue, when, list: mode === "shared" ? initial.list : [] }));
  }, [view, date, category, market, venue, when, mode, initial.list, today]);
  useEffect(() => {
    const t = setTimeout(() => sessionMemory.write(MEMORY, { q }), 300);
    return () => clearTimeout(t);
  }, [q, view, date, category, market, venue, when, mode]);

  // The day heads stick under the band; the band's height is read, not assumed.
  useEffect(() => {
    const band = bandRef.current;
    const root = rootRef.current;
    if (!band || !root) return;
    const set = () => root.style.setProperty("--band-h", `${Math.round(band.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(band);
    return () => ro.disconnect();
  }, []);

  // A shared "tonight" or "weekend" link opens on the list, not the masthead.
  useEffect(() => {
    if (initial.when) document.getElementById("tonight")?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Moves ---------------------------------------------------------------- */
  const pickDay = useCallback(
    (d: string) => {
      startTransition(() => {
        setDate(d);
        setMode("browse");
        setWhen(undefined);
        if (view === "onview") setView("days");
        if (d > stripTo) setStripTo(addDays(today, STRIP_DAYS));
      });
      track("Explore", { action: "calendar-day" });
    },
    [view, stripTo, today],
  );
  // In a search the strip scrubs the list: a day scrolls to the first group on or after it.
  const scrollToDay = useCallback((d: string) => {
    const heads = [...document.querySelectorAll<HTMLElement>('section[id^="d-"]')];
    const target = heads.find((h) => h.id.slice(2) >= d);
    target?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
  }, []);
  const onStripPick = useCallback(
    (d: string) => {
      if (searching) {
        setDate(d);
        if (d > stripTo) setStripTo(addDays(today, STRIP_DAYS));
        requestAnimationFrame(() => scrollToDay(d));
      } else pickDay(d);
    },
    [searching, pickDay, scrollToDay, stripTo, today],
  );
  // The strip grows four weeks at a time as it is scrolled, up to the season's 120 days.
  const extendStrip = useCallback(() => {
    setStripTo((t) => {
      const max = addDays(today, STRIP_DAYS);
      const next = addDays(t, 28);
      return t >= max ? t : next > max ? max : next;
    });
  }, [today]);
  const chooseView = (v: EncoreView) => {
    startTransition(() => {
      setView(v);
      setMode("browse");
      setWhen(undefined);
    });
  };
  const step = (dir: 1 | -1) => {
    startTransition(() => {
      if (view === "month") {
        const [y, m] = anchor.split("-").map(Number) as [number, number];
        const nm = new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10);
        setDate(nm < today ? (nm.slice(0, 7) === today.slice(0, 7) ? today : nm) : nm);
      } else {
        const next = addDays(anchor, 7 * dir);
        setDate(next < today ? today : next);
      }
      setMode("browse");
      setWhen(undefined);
    });
  };
  const choose = {
    market: (m?: MarketSlug) => startTransition(() => setMarket(m)),
    venue: (v?: string) => startTransition(() => setVenue(v)),
    category: (c?: EventCategory) => startTransition(() => setCategory(c)),
    clear: () =>
      startTransition(() => {
        setMarket(undefined);
        setVenue(undefined);
        setCategory(undefined);
      }),
  };
  const shortcut = (w: EncoreWhen) => {
    startTransition(() => {
      setWhen(w);
      setView("days");
      setDate(today);
      setMode("browse");
    });
    track("Explore", { action: "calendar-day" });
  };
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = VIEWS.indexOf(view);
    const next = e.key === "ArrowRight" ? VIEWS[(i + 1) % VIEWS.length] : e.key === "ArrowLeft" ? VIEWS[(i - 1 + VIEWS.length) % VIEWS.length] : e.key === "Home" ? VIEWS[0] : e.key === "End" ? VIEWS[VIEWS.length - 1] : undefined;
    if (!next) return;
    e.preventDefault();
    chooseView(next);
    requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
  };

  /* ---- Words ---------------------------------------------------------------- */
  const [wkStart, wkEnd] = weekendOf(today);
  const rangeLabel =
    when === "tonight"
      ? weekday(today) === 0
        ? "Today"
        : "Tonight"
      : when === "weekend"
        ? `This weekend · ${shortDay(wkStart)}–${wkEnd.slice(5, 7) === wkStart.slice(5, 7) ? dayNumber(wkEnd) : shortDay(wkEnd)}`
        : view === "month"
          ? monthLabel(anchor)
          : view === "onview"
            ? "Exhibitions and runs"
            : `${shortDay(from)} – ${shortDay(to)}${to.slice(0, 4) !== today.slice(0, 4) ? `, ${to.slice(0, 4)}` : ""}`;
  const activeFilters = [category, market, venue].filter(Boolean).length;
  const listApi = { has: my.has, toggle: my.toggle };
  const shareState: Partial<EncoreState> = { view, date: date === today ? "" : date, category, market, venue, q, when };
  const feed = `/api/calendar.ics${feedQuery(filter)}`;
  const onFeed = () => track("Calendar feed", { kind: "feed", filter: activeFilters ? feedQuery(filter).slice(1) : "all" });
  const chipLabel = `${market ? marketName(market) : "Everywhere"} · ${venueName ?? "Any venue"}`;
  const showStrip = mode === "browse" && (view === "days" || view === "week");
  const windowLoading = !full && needsFull;
  const panelLabel = mode === "mine" ? "My list" : mode === "shared" ? "A shared list" : searching ? `Search: ${q}` : rangeLabel;

  const venueSelect = (
    <VenueSelect
      id="encore-venue-empty"
      venues={venueOptions}
      value={venue}
      className="w-full max-w-[360px]"
      onChange={(v) => {
        startTransition(() => {
          setVenue(v);
          setQ("");
        });
      }}
    />
  );

  const nav = (
    <div className="encore-nav">
      <button type="button" className="btn-quiet is-square" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={() => step(-1)} disabled={when !== undefined || (view === "month" ? anchor.slice(0, 7) <= today.slice(0, 7) : from <= today)}>
        <ChevronLeft />
      </button>
      <button type="button" className="btn-quiet" onClick={() => pickDay(today)} disabled={anchor === today && !when}>
        Today
      </button>
      <span className="encore-range px-1" aria-live="polite">
        {rangeLabel}
      </span>
      <button type="button" className="btn-quiet is-square" aria-label={view === "month" ? "Next month" : "Next week"} onClick={() => step(1)} disabled={when !== undefined}>
        <ChevronRight />
      </button>
    </div>
  );
  const showNav = mode === "browse" && !searching && view !== "onview";

  return (
    <div className="encore flex flex-col" ref={rootRef} data-url-island="">
      {/* Share and Subscribe as text, from lg. The phone carries them as glyphs beside the search. */}
      <div className="container-site order-0 hidden items-center justify-end gap-x-6 pb-4 pt-8 lg:flex">
        <ShareButton title="Encore Arts Calendar" url={encoreHref(shareState)} what="calendar-view" label="Share this view" />
        <a href={feed} className="link-rule" onClick={onFeed}>
          Subscribe{activeFilters ? " to this filter" : ""}
        </a>
      </div>

      {/* The search row: search, the filter chip (and the category it holds), My list. On a phone it sits under the sticky band, with the week's nav. */}
      <div className="container-site order-2 flex flex-col gap-3 pb-2 pt-4 lg:order-1 lg:pb-3 lg:pt-0">
        <div className="encore-toolbar">
          <div className="encore-search">
            <label htmlFor="encore-q" className="sr-only">
              Search shows, venues and presenters
            </label>
            <input
              id="encore-q"
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                startTransition(() => {
                  setMode("browse");
                  setWhen(undefined);
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" && q) {
                  e.preventDefault();
                  setQ("");
                }
              }}
              placeholder="A show, a venue, a presenter"
              autoComplete="off"
              enterKeyHint="search"
              className="encore-input"
            />
            {q ? (
              <button type="button" className="encore-clear" onClick={() => setQ("")} aria-label="Clear search">
                <Cross />
              </button>
            ) : (
              <span className="encore-clear" aria-hidden="true">
                <Magnifier />
              </span>
            )}
          </div>
          <span className="flex items-center gap-2 lg:hidden">
            <ShareButton title="Encore Arts Calendar" url={encoreHref(shareState)} what="calendar-view" label="Share this view" variant="quiet" />
            <a href={feed} className="btn-quiet is-square" aria-label={`Subscribe${activeFilters ? " to this filter" : ""} in your calendar app`} title="Subscribe" onClick={onFeed}>
              <CalendarPlus />
            </a>
          </span>
          <div className="encore-chips">
            <button ref={chipRef} type="button" className="chip" aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
              {chipLabel}
              <ChevronDown className="chip-chevron" />
            </button>
            {category ? (
              <button type="button" className="chip" aria-pressed="true" aria-label={`${CATEGORY[category].label}: remove this filter`} onClick={() => choose.category(undefined)}>
                <i className="chip-dot" style={{ background: CATEGORY[category].color }} aria-hidden="true" />
                {CATEGORY[category].label}
              </button>
            ) : null}
            <button
              type="button"
              className="chip"
              aria-pressed={mode === "mine"}
              onClick={() =>
                startTransition(() => {
                  setMode(mode === "mine" ? "browse" : "mine");
                  setWhen(undefined);
                })
              }
            >
              My list{my.list.length ? ` · ${my.list.length}` : ""}
            </button>
          </div>
        </div>
        {showNav ? <div className="lg:hidden">{nav}</div> : null}
      </div>

      {/* The sticky band: the view switcher (with the range from lg), then the day strip. */}
      <div ref={bandRef} className="encore-band order-1 lg:order-2">
        <div className="container-site encore-rows">
          <div className="encore-toolbar">
            <div className="encore-tabs" role="tablist" aria-label="View" onKeyDown={onTabKey}>
              {VIEWS.map((v) => {
                const on = mode === "browse" && !searching && view === v;
                return (
                  <button key={v} id={`tab-${v}`} type="button" role="tab" aria-selected={on} aria-controls="encore-panel" tabIndex={on || (view === v && !VIEWS.some((x) => mode === "browse" && !searching && view === x)) ? 0 : -1} className="chip" onClick={() => chooseView(v)}>
                    {VIEW_LABEL[v]}
                  </button>
                );
              })}
            </div>
            {showNav ? <div className="hidden lg:contents">{nav}</div> : <span className="encore-range encore-nav hidden lg:flex">{panelLabel}</span>}
          </div>
          {showStrip ? <DayStrip from={today} to={stripTo} selected={when === "weekend" ? wkStart : anchor} today={today} counts={dayCounts} max={maxCount} onPick={onStripPick} onReach={extendStrip} /> : null}
        </div>
      </div>

      <FilterSheet
        open={sheet}
        onClose={() => setSheet(false)}
        anchor={chipRef}
        market={market}
        venue={venue}
        category={category}
        venues={venueOptions}
        catCounts={catCounts}
        total={total}
        onMarket={choose.market}
        onVenue={choose.venue}
        onCategory={choose.category}
        onClear={choose.clear}
        allowEmptyCategories={view === "onview"}
      />

      <div id="tonight" className="container-site order-3 flex scroll-mt-[calc(var(--header-h)+var(--band-h,0px))] flex-col gap-14 pb-section pt-8 lg:gap-16 lg:pt-12">
        {mode === "browse" && !searching && !when && view === "days" && anchor === today ? <Spotlight index={index} today={today} filter={filter} list={listApi} onTonight={() => shortcut("tonight")} onWeekend={() => shortcut("weekend")} /> : null}
        <div id="encore-panel" role="tabpanel" aria-label={panelLabel}>
          {seasonError && windowLoading ? (
            <SeasonWait onRetry={ensureFull} />
          ) : mode === "mine" ? (
            <ListView index={index} slugs={my.list} today={today} list={listApi} shared={false} loading={!full} />
          ) : mode === "shared" ? (
            <ListView index={index} slugs={initial.list} today={today} list={listApi} shared loading={!full} onSaveAll={() => my.addAll(initial.list)} />
          ) : searching ? (
            <SearchResults index={index} today={today} filter={filter} list={listApi} loading={!full} onDay={pickDay} venueSelect={venueSelect} />
          ) : when ? (
            <Agenda
              index={index}
              from={from}
              to={to}
              today={today}
              filter={filter}
              list={listApi}
              onDay={pickDay}
              onClear={choose.clear}
              nowMs={Date.now()}
              emptyTitle={when === "tonight" ? "Nothing more tonight on this filter." : "A quiet weekend on this filter."}
              emptyBody={when === "tonight" ? "Everything listed for today has started. The next day with something on is below." : "Widen the filter, or jump to the next day with something on."}
            />
          ) : view === "week" ? (
            <WeekView
              index={index}
              anchor={anchor}
              today={today}
              filter={filter}
              list={listApi}
              onDay={(d) => {
                chooseView("days");
                pickDay(d);
              }}
            />
          ) : view === "month" ? (
            <MonthView index={index} anchor={anchor} today={today} filter={filter} list={listApi} onDay={(d) => startTransition(() => setDate(d))} />
          ) : view === "onview" ? (
            <OnViewGrid index={index} today={today} filter={filter} list={listApi} />
          ) : (
            <Agenda index={index} from={from} to={to} today={today} filter={filter} list={listApi} onDay={pickDay} onClear={choose.clear} loading={windowLoading} />
          )}
        </div>
        {mode === "mine" && my.list.length ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-6">
            <ShareButton title="My Encore list" url={encoreHref({ list: my.list })} what="my-list" label="Share my list" />
            <button type="button" className="btn-quiet" onClick={my.clear}>
              Clear the list
            </button>
          </div>
        ) : null}
        {!full ? (
          <p className="sr-only" aria-live="polite">
            Loading the full season
          </p>
        ) : null}
        <p className="t-note">
          Times and prices come from each venue&rsquo;s own listing; confirm before you go.{" "}
          {mode === "browse" && venue ? (
            <Link href={`/venues/${venue}`} className="underline underline-offset-4">
              The venue&rsquo;s page →
            </Link>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/** When the season a move needs didn't come: why, and a retry. (While it is on its way, the views show their own loading rows.) */
function SeasonWait({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col gap-4" role="status">
      <p className="t-h3 text-navy">The season didn&rsquo;t load, so these days are empty for now.</p>
      <button type="button" className="btn-quiet self-start" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

const MEMORY = "encore";

/**
 * The calendar as the static page serves it: today and the next three weeks
 * from the server, then the view the address asks for (and this tab's search
 * words for it), on the browser's date.
 */
export function EncoreIsland({ serverToday, initialIndex, sliceRange }: { serverToday: string; initialIndex: EncoreIndex; sliceRange: [string, string] }) {
  const { initial, key } = useUrlInitial(
    (sp): { state: EncoreState; today: string } | null => {
      const today = localDay(Date.now());
      const mem = sessionMemory.read<{ q?: unknown }>(MEMORY);
      const q = typeof mem?.q === "string" ? mem.q.slice(0, 80) : "";
      if (!hasAny(sp, ENCORE_KEYS) && !q && today === serverToday) return null;
      const state = parseEncoreState(sp, today);
      return { state: { ...state, q: state.q || q }, today };
    },
    { state: parseEncoreState({}), today: serverToday },
  );
  return <Encore key={key} initial={initial.state} today={initial.today} initialIndex={initialIndex} sliceRange={sliceRange} />;
}

function feedQuery(f: Filter): string {
  const sp = new URLSearchParams();
  if (f.category) sp.set("category", f.category);
  if (f.market) sp.set("market", f.market);
  if (f.venue) sp.set("venue", f.venue);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
