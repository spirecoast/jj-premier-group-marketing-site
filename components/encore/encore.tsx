"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShareButton } from "@/components/share-button";
import { track } from "@/lib/analytics";
import { MARKETS, marketName } from "@/lib/content/markets";
import { CATEGORY, CATEGORY_ORDER } from "@/lib/encore/categories";
import type { EncoreIndex } from "@/lib/encore/index-format";
import { addDays, countsByCategory, countsByDay, longDay, monthEnd, monthLabel, monthStart, shortDay, weekStart, type Filter } from "@/lib/encore/select";
import { encoreHref, type EncoreState, type EncoreView } from "@/lib/encore/url";
import { cn } from "@/lib/utils";
import { DayStrip } from "./day-strip";
import { useMyList } from "./use-my-list";
import { Agenda, ListView, MonthView, OnViewGrid, Spotlight, WeekView } from "./views";

const STRIP_DAYS = 120;
const VIEW_LABEL: Record<EncoreView, string> = { days: "Days", week: "Week", month: "Month", onview: "On view" };

/**
 * Encore. One state (view, day, filters, search) that the URL, the strip and
 * the body all reflect. The first paint uses the slice the server sent; the
 * full index arrives once and every move after that is instant.
 */
export function Encore({ initial, today, initialIndex }: { initial: EncoreState; today: string; initialIndex: EncoreIndex }) {
  const [index, setIndex] = useState<EncoreIndex>(initialIndex);
  const [full, setFull] = useState(false);
  const [view, setView] = useState<EncoreView>(initial.view);
  const [date, setDate] = useState(initial.date || today);
  const [category, setCategory] = useState(initial.category);
  const [market, setMarket] = useState(initial.market);
  const [venue, setVenue] = useState(initial.venue);
  const [q, setQ] = useState(initial.q);
  const [mode, setMode] = useState<"browse" | "mine" | "shared">(initial.list.length ? "shared" : "browse");
  const my = useMyList();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/encore/index", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: EncoreIndex) => {
        setIndex(data);
        setFull(true);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const filter: Filter = useMemo(() => ({ category, market, venue, q }), [category, market, venue, q]);
  const anchor = date;
  const [from, to] = useMemo((): [string, string] => {
    if (view === "week") {
      const s = weekStart(anchor);
      return [s, addDays(s, 6)];
    }
    if (view === "month") return [monthStart(anchor), monthEnd(anchor)];
    return [anchor, addDays(anchor, 6)];
  }, [view, anchor]);

  const stripTo = addDays(today, STRIP_DAYS);
  const dayCounts = useMemo(() => countsByDay(index, today, stripTo, filter), [index, today, stripTo, filter]);
  const maxCount = useMemo(() => Math.max(1, ...dayCounts.values()), [dayCounts]);
  const catCounts = useMemo(() => countsByCategory(index, from, to, filter), [index, from, to, filter]);
  const venueOptions = useMemo(() => [...index.venues].sort((a, b) => a.n.localeCompare(b.n)), [index.venues]);

  // The URL follows the state.
  useEffect(() => {
    const t = setTimeout(() => {
      const s: Partial<EncoreState> = { view, date: date === today ? "" : date, category, market, venue, q, list: mode === "shared" ? initial.list : [] };
      window.history.replaceState(window.history.state, "", encoreHref(s));
    }, 200);
    return () => clearTimeout(t);
  }, [view, date, category, market, venue, q, mode, initial.list, today]);

  const go = useCallback((d: string) => {
    setDate(d);
    setMode("browse");
    track("Explore", { action: "calendar-day" });
  }, []);
  const pickDay = useCallback(
    (d: string) => {
      setDate(d);
      setMode("browse");
      if (view === "onview") setView("days");
    },
    [view],
  );
  const step = (dir: 1 | -1) => {
    if (view === "month") {
      const [y, m] = anchor.split("-").map(Number) as [number, number];
      const nm = new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10);
      setDate(nm < today && dir === -1 ? (nm.slice(0, 7) === today.slice(0, 7) ? today : nm) : nm);
    } else setDate(addDays(anchor, view === "days" ? 7 * dir : 7 * dir));
    setMode("browse");
  };
  const rangeLabel =
    view === "month" ? monthLabel(anchor) : view === "onview" ? "Exhibitions and runs" : `${shortDay(from)} – ${shortDay(to)}${to.slice(0, 4) !== today.slice(0, 4) ? `, ${to.slice(0, 4)}` : ""}`;
  const activeFilters = [category, market, venue, q].filter(Boolean).length;
  const bodyKey = `${mode}-${view}-${anchor}-${category ?? ""}-${market ?? ""}-${venue ?? ""}-${q}`;
  const listApi = { has: my.has, toggle: my.toggle };
  const shareState: Partial<EncoreState> = { view, date: date === today ? "" : date, category, market, venue, q };

  return (
    <div className="encore">
      <div className="container-site flex flex-col gap-8 pt-10 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Encore Arts Calendar</p>
            <h1 className="t-display max-w-[860px] text-navy">What&rsquo;s on stage, in the hall and on the walls, close to home.</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ShareButton title="Encore Arts Calendar" url={encoreHref(shareState)} what="calendar-view" label="Share this view" />
            <a href={`/api/calendar.ics${feedQuery(filter)}`} className="link-rule">
              Subscribe{activeFilters ? " to this filter" : ""}
            </a>
          </div>
        </div>

        {/* Toolbar */}
        <div className="encore-toolbar">
          <div className="encore-search">
            <label htmlFor="encore-q" className="sr-only">
              Search shows, venues and presenters
            </label>
            <input
              id="encore-q"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setMode("browse");
              }}
              placeholder="A show, a venue, a presenter"
              autoComplete="off"
              enterKeyHint="search"
              className="encore-input"
            />
            {q ? (
              <button type="button" className="encore-clear" onClick={() => setQ("")} aria-label="Clear search">
                ✕
              </button>
            ) : (
              <span className="encore-clear" aria-hidden="true">
                ⌕
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[{ slug: undefined, name: "Everywhere" }, ...MARKETS].map((m) => (
              <button key={m.slug ?? "all"} type="button" className="chip !min-h-9 !px-3 !text-[12px]" aria-pressed={market === m.slug} onClick={() => setMarket(m.slug as Filter["market"])}>
                {m.name}
              </button>
            ))}
            <label className="encore-venue">
              <span className="sr-only">Venue</span>
              <select value={venue ?? ""} onChange={(e) => setVenue(e.target.value || undefined)} className="encore-select" aria-label="Venue">
                <option value="">Any venue</option>
                {MARKETS.map((m) => (
                  <optgroup key={m.slug} label={m.name}>
                    {venueOptions
                      .filter((v) => v.m === m.slug)
                      .map((v) => (
                        <option key={v.s} value={v.s}>
                          {v.n}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={cn("chip !min-h-9 !px-3 !text-[12px]", mode === "mine" && "!bg-amber !text-white")}
              aria-pressed={mode === "mine"}
              onClick={() => setMode(mode === "mine" ? "browse" : "mine")}
            >
              My list{my.list.length ? ` · ${my.list.length}` : ""}
            </button>
          </div>
          <div className="encore-cats" role="group" aria-label="Category">
            <button type="button" className="encore-cat" aria-pressed={!category} onClick={() => setCategory(undefined)}>
              <i style={{ background: "var(--color-navy)" }} aria-hidden="true" />
              Everything
            </button>
            {CATEGORY_ORDER.map((c) => {
              const n = catCounts.get(c) ?? 0;
              return (
                <button key={c} type="button" className="encore-cat" aria-pressed={category === c} onClick={() => setCategory(category === c ? undefined : c)} disabled={!n && category !== c && view !== "onview"}>
                  <i style={{ background: CATEGORY[c].color }} aria-hidden="true" />
                  {CATEGORY[c].label}
                  {n ? <span className="encore-cat-n">{n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* View tabs and range */}
        <div className="encore-nav">
          <div className="encore-tabs" role="tablist" aria-label="View">
            {(Object.keys(VIEW_LABEL) as EncoreView[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={mode === "browse" && view === v}
                className="encore-tab"
                onClick={() => {
                  setView(v);
                  setMode("browse");
                }}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>
          {mode === "browse" && view !== "onview" ? (
            <div className="flex items-center gap-2">
              <button type="button" className="encore-step" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={() => step(-1)} disabled={from <= today && view !== "month" ? anchor <= today : anchor.slice(0, 7) <= today.slice(0, 7)}>
                ‹
              </button>
              <button type="button" className="encore-today" onClick={() => go(today)} disabled={anchor === today}>
                Today
              </button>
              <span className="t-record px-2 text-navy">{rangeLabel}</span>
              <button type="button" className="encore-step" aria-label={view === "month" ? "Next month" : "Next week"} onClick={() => step(1)}>
                ›
              </button>
            </div>
          ) : (
            <span className="t-record text-navy">{mode === "mine" ? "My list" : mode === "shared" ? "A shared list" : rangeLabel}</span>
          )}
        </div>

        {mode === "browse" && (view === "days" || view === "week") ? (
          <DayStrip from={today} to={stripTo} selected={anchor} today={today} counts={dayCounts} max={maxCount} onPick={pickDay} />
        ) : null}
      </div>

      <div className="container-site flex flex-col gap-12 pb-section pt-8" ref={bodyRef}>
        {mode === "browse" && view === "days" && anchor === today ? (
          <Spotlight index={index} today={today} filter={filter} list={listApi} onDay={go} />
        ) : null}
        <div key={bodyKey} className="encore-body">
          {mode === "mine" ? (
            <ListView index={index} slugs={my.list} today={today} list={listApi} shared={false} />
          ) : mode === "shared" ? (
            <ListView index={index} slugs={initial.list} today={today} list={listApi} shared onSaveAll={() => my.addAll(initial.list)} />
          ) : view === "week" ? (
            <WeekView index={index} anchor={anchor} today={today} filter={filter} list={listApi} onDay={(d) => { setView("days"); go(d); }} />
          ) : view === "month" ? (
            <MonthView index={index} anchor={anchor} today={today} filter={filter} list={listApi} onDay={(d) => setDate(d)} />
          ) : view === "onview" ? (
            <OnViewGrid index={index} today={today} filter={filter} list={listApi} />
          ) : (
            <Agenda index={index} from={from} to={to} today={today} filter={filter} list={listApi} onNext={() => step(1)} />
          )}
        </div>
        {mode === "mine" && my.list.length ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-6">
            <ShareButton title="My Encore list" url={encoreHref({ list: my.list })} what="my-list" label="Share my list" />
            <a href={`/api/calendar.ics?${my.list.map((s) => `event=${encodeURIComponent(s)}`).join("&")}`} className="link-rule" hidden>
              Add all to my calendar
            </a>
            <button type="button" className="t-mono-sm text-graphite-500 underline underline-offset-4 hover:text-navy" onClick={my.clear}>
              Clear the list
            </button>
          </div>
        ) : null}
        {!full ? <p className="sr-only" aria-live="polite">Loading the full season</p> : null}
        <p className="t-mono-sm text-graphite-500">
          Times and prices come from each venue&rsquo;s own listing; confirm before you go. {mode === "browse" && venue ? <Link href={`/venues/${venue}`} className="underline underline-offset-4">The venue&rsquo;s page →</Link> : null}
        </p>
      </div>
    </div>
  );
}

function feedQuery(f: Filter): string {
  const sp = new URLSearchParams();
  if (f.category) sp.set("category", f.category);
  if (f.market) sp.set("market", f.market);
  if (f.venue) sp.set("venue", f.venue);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
