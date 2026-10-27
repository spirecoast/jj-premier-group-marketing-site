"use client";

import Link from "next/link";
import { ProductLockup } from "@/components/brand/emblem";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ShareButton } from "@/components/share-button";
import { MARKETS, marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, STATUS_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { pathOf, type Filters } from "@/lib/neighborhoods/search";
import { LEVELS, STATUSES, TYPES } from "@/lib/neighborhoods/types";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { PlaceCard } from "./place-card";
import "./explorer.css";

export type SheetPosition = "peek" | "half" | "full";

type Props = {
  /** My places, docked to the top of the sheet on a phone. */
  tray?: ReactNode;
  /** The view is held to a list of places (?list=): how many fit, whether it came from Atlas Match, and a way to save them all. */
  list: { count: number; fromMatch: boolean; onSaveAll: () => void } | null;
  loading: boolean;
  error: boolean;
  /** Fetch the index again after it failed to load. */
  onRetry: () => void;
  q: string;
  onQuery: (q: string) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  selected: IndexEntry | null;
  ancestors: IndexEntry[];
  childCount: number;
  listed: IndexEntry[];
  total: number;
  searching: boolean;
  browsingInView: boolean;
  hover: string | null;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string | null) => void;
  by: Map<string, IndexEntry>;
  asOf: string;
  /** The view as a link, with the search words and the map position (the address bar has neither). */
  shareUrl: string;
  desktop: boolean;
  sheet: SheetPosition;
  onSheet: (p: SheetPosition) => void;
  /** The explorer's height in px, for the sheet's stops. */
  height: number;
  onShowAll: () => void;
};

const PAGE = 80;
const ORDER: SheetPosition[] = ["peek", "half", "full"];
/** The sheet's resting places, as the distance from the top of the explorer. */
const SHEET_TOP: Record<SheetPosition, (h: number) => number> = { peek: (h) => h * 0.58, half: (h) => h * 0.36, full: () => 12 };
/** Movement before a press becomes a drag (so taps on chips and the input still land). */
const DRAG_START = 8;
/** How far ahead a flick is projected when choosing the stop. */
const FLICK_MS = 120;
/** How long a count waits to be read out, so typing doesn't read a number per letter. */
const ANNOUNCE_MS = 400;

const stepUp = (s: SheetPosition): SheetPosition => ORDER[Math.min(2, ORDER.indexOf(s) + 1)]!;
const stepDown = (s: SheetPosition): SheetPosition => ORDER[Math.max(0, ORDER.indexOf(s) - 1)]!;

export function ExplorerPanel(p: Props) {
  const [showFilters, setShowFilters] = useState(Boolean(p.filters.level || p.filters.type || p.filters.status || p.filters.gated || p.filters.registry));
  const [limit, setLimit] = useState(PAGE);
  const panelRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardHeading = useRef<HTMLHeadingElement>(null);
  const searchId = useId();
  const bodyId = useId();
  const footId = useId();
  const reduced = useReducedMotion();
  const activeFilters = [p.filters.level, p.filters.type, p.filters.status, p.filters.gated, p.filters.registry].filter(Boolean).length;

  useEffect(() => {
    setLimit(PAGE);
    listRef.current?.scrollTo({ top: 0 });
  }, [p.q, p.filters, p.selected?.s]);

  /* ---- The bottom sheet (phones): follows the finger, settles on a stop, works from the keyboard. ---- */
  const sheet = p.sheet;
  const onSheet = p.onSheet;
  const drag = useRef<{ startY: number; startTop: number; top: number; samples: { t: number; y: number }[]; active: boolean; pointerId: number | null } | null>(null);
  const dragged = useRef(false);

  const stops = useCallback(() => {
    const h = p.height || panelRef.current?.clientHeight || 640;
    return { peek: SHEET_TOP.peek(h), half: SHEET_TOP.half(h), full: SHEET_TOP.full(h), h };
  }, [p.height]);

  const setTop = useCallback((top: number) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.setProperty("--sheet-y", `${Math.round(top)}px`);
    el.dataset.dragging = "";
  }, []);
  const clearTop = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    el.style.removeProperty("--sheet-y");
    delete el.dataset.dragging;
  }, []);

  const begin = useCallback(
    (y: number) => {
      const s = stops();
      drag.current = { startY: y, startTop: s[sheet], top: s[sheet], samples: [{ t: performance.now(), y }], active: false, pointerId: null };
      dragged.current = false;
    },
    [sheet, stops],
  );

  /** Moves the sheet with the finger; past the ends it gives a little and comes back. */
  const move = useCallback(
    (y: number) => {
      const d = drag.current;
      if (!d) return;
      const s = stops();
      let top = d.startTop + (y - d.startY);
      if (top < s.full) top = s.full - (s.full - top) * 0.3;
      if (top > s.peek) top = s.peek + (top - s.peek) * 0.3;
      d.top = top;
      d.samples.push({ t: performance.now(), y });
      if (d.samples.length > 6) d.samples.shift();
      setTop(top);
    },
    [setTop, stops],
  );

  /** Settles on the nearest stop, a flick counting for where it was heading. */
  const end = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.active) {
      clearTop();
      return;
    }
    const s = stops();
    const first = d.samples[0]!;
    const last = d.samples[d.samples.length - 1]!;
    const dt = Math.max(1, last.t - first.t);
    const velocity = (last.y - first.y) / dt; // px per ms, positive downward
    const projected = d.top + velocity * FLICK_MS;
    const nearest = ORDER.reduce((best, pos) => (Math.abs(s[pos] - projected) < Math.abs(s[best] - projected) ? pos : best), "peek" as SheetPosition);
    onSheet(nearest);
    // The stop is in the DOM by the next frame; letting go of the inline position then means one transition, to the new stop.
    requestAnimationFrame(clearTop);
  }, [clearTop, onSheet, stops]);

  const interactive = (el: EventTarget | null) => el instanceof Element && Boolean(el.closest("input, select, textarea, a"));

  // The whole head is the drag surface. A press on a chip or the handle is a click until it travels DRAG_START.
  const onHeadPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (p.desktop || e.pointerType === "mouse" && e.button !== 0) return;
    if (interactive(e.target)) return;
    begin(e.clientY);
  };
  const onHeadPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.active) {
      if (Math.abs(e.clientY - d.startY) < DRAG_START) return;
      d.active = true;
      d.pointerId = e.pointerId;
      dragged.current = true;
      headRef.current?.setPointerCapture(e.pointerId);
    }
    move(e.clientY);
  };
  const onHeadPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d?.pointerId !== null && d?.pointerId !== undefined) headRef.current?.releasePointerCapture(d.pointerId);
    end();
    void e;
  };

  // A swipe down on a list that is already at its top pulls the sheet down with it.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let state: { y: number; atTop: boolean; active: boolean } | null = null;
    const start = (e: TouchEvent) => {
      if (p.desktop || e.touches.length !== 1) return;
      state = { y: e.touches[0]!.clientY, atTop: el.scrollTop <= 0, active: false };
    };
    const during = (e: TouchEvent) => {
      if (!state || e.touches.length !== 1) return;
      const y = e.touches[0]!.clientY;
      if (!state.active) {
        if (!state.atTop || y - state.y < DRAG_START) return;
        state.active = true;
        begin(y);
        if (drag.current) drag.current.active = true;
      }
      e.preventDefault();
      move(y);
    };
    const finish = () => {
      if (state?.active) end();
      state = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", during, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", finish);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", during);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
    };
  }, [p.desktop, begin, move, end]);

  const onHandleClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    onSheet(sheet === "full" ? "half" : stepUp(sheet));
  };
  const onHandleKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") onSheet(stepUp(sheet));
    else if (e.key === "ArrowDown") onSheet(stepDown(sheet));
    else if (e.key === "Escape") onSheet("peek");
    else return;
    e.preventDefault();
  };

  /* ---- Focus follows the visitor. ---- */
  const returnTo = useRef<string | null>(null);
  const focusRow = useCallback((slug: string | null, fallbackIndex?: number) => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;
      const rows = list.querySelectorAll<HTMLButtonElement>(".explorer-row");
      const target = (slug && list.querySelector<HTMLButtonElement>(`.explorer-row[data-slug="${CSS.escape(slug)}"]`)) || (fallbackIndex !== undefined ? rows[fallbackIndex] : undefined) || rows[0];
      if (target) target.focus({ preventScroll: false });
      else inputRef.current?.focus();
    });
  }, []);

  // A place opens: its name takes focus. Close returns to the row it came from.
  const selectedSlug = p.selected?.s ?? null;
  useEffect(() => {
    if (selectedSlug) cardHeading.current?.focus({ preventScroll: true });
  }, [selectedSlug]);
  const closeCard = () => {
    const back = returnTo.current;
    returnTo.current = null;
    p.onSelect(null);
    focusRow(back);
  };

  /* ---- The count, read out once typing settles. ---- */
  const context = p.selected && p.childCount && !p.searching
    ? `Inside ${p.selected.n}`
    : p.searching
      ? `${p.total.toLocaleString()} ${p.total === 1 ? "match" : "matches"}`
      : p.list
        ? `${p.listed.length.toLocaleString()} ${p.listed.length === 1 ? "place" : "places"} · ${p.list.fromMatch ? "your Match list" : "your list"}`
        : p.browsingInView
          ? `${p.listed.length.toLocaleString()} in view`
          : `${p.listed.length.toLocaleString()} places`;
  const countLine = p.loading ? "Loading the catalogue" : p.error ? "The catalogue did not load" : context;
  const [announced, setAnnounced] = useState("");
  const announce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (announce.current) clearTimeout(announce.current);
    announce.current = setTimeout(() => setAnnounced(countLine), ANNOUNCE_MS);
    return () => {
      if (announce.current) clearTimeout(announce.current);
    };
  }, [countLine]);

  const showMore = () => {
    const first = limit;
    const next = Math.min(limit + PAGE, p.listed.length);
    setLimit(next);
    if (announce.current) clearTimeout(announce.current);
    setAnnounced(`Showing ${next.toLocaleString()} of ${p.listed.length.toLocaleString()}`);
    focusRow(null, first);
  };

  return (
    <aside ref={panelRef} className="explorer-panel" aria-label="Atlas, the neighborhood explorer" data-reduced={reduced ? "" : undefined}>
      {p.tray}
      {/* Atlas's strip: the product's name and the team's, on its own green. */}
      <div className="atlas-plate">
        <ProductLockup family="atlas" product="Atlas Neighborhoods" size="sm" />
      </div>
      <div ref={headRef} className="explorer-head" onPointerDown={onHeadPointerDown} onPointerMove={onHeadPointerMove} onPointerUp={onHeadPointerUp} onPointerCancel={onHeadPointerUp}>
        <button
          type="button"
          className="explorer-handle"
          aria-label={sheet === "peek" ? "Expand the list" : sheet === "half" ? "Expand the list to full height" : "Shrink the list"}
          aria-expanded={sheet !== "peek"}
          aria-controls={bodyId}
          onClick={onHandleClick}
          onKeyDown={onHandleKey}
        >
          <span aria-hidden="true" />
        </button>
        <div className="explorer-title-row flex items-start justify-between gap-4">
          <div className="explorer-title flex flex-col gap-1.5">
            <h1 className="font-display text-[clamp(1.2rem,1.8vw,1.45rem)] font-light leading-[1.15] text-navy">
              {p.list ? (p.list.fromMatch ? "Your Match list" : "Your list") : "Every neighborhood in Lakewood Ranch, Sarasota and Bradenton."}
            </h1>
            {p.list ? (
              <p className="t-small flex flex-wrap gap-x-3 gap-y-1 text-body">
                <span>
                  {p.list.count.toLocaleString()} {p.list.count === 1 ? "place" : "places"}
                  {p.list.fromMatch ? " from Atlas Match." : " from this link."}
                </span>
                <button type="button" className="text-harbor-700 underline underline-offset-4 hover:text-navy" onClick={p.list.onSaveAll}>
                  Save them all
                </button>
                <Link href="/neighborhoods/match" className="text-harbor-700 underline underline-offset-4 hover:text-navy">
                  {p.list.fromMatch ? "Change the answers" : "Try Atlas Match"}
                </Link>
              </p>
            ) : (
              <p className="t-small text-body">
                Not sure where to start?{" "}
                <Link href="/neighborhoods/match" className="text-harbor-700 underline underline-offset-4 hover:text-navy">
                  Try Atlas Match
                </Link>
              </p>
            )}
          </div>
          <div className="explorer-share shrink-0">
            <ShareButton title="Atlas · JJ Premier Group" url={p.shareUrl} what="explorer-view" className="mt-1" />
          </div>
        </div>

        <div className="explorer-search">
          <label htmlFor={searchId} className="sr-only">
            Search places, ZIPs, builders and associations
          </label>
          <input
            ref={inputRef}
            id={searchId}
            type="search"
            value={p.q}
            onChange={(e) => p.onQuery(e.target.value)}
            onFocus={() => !p.desktop && onSheet("full")}
            placeholder="A place, a ZIP, a builder, an HOA"
            autoComplete="off"
            enterKeyHint="search"
            className="explorer-input"
          />
          {p.q ? (
            <button type="button" className="explorer-clear" onClick={() => p.onQuery("")} aria-label="Clear search">
              ✕
            </button>
          ) : (
            <span className="explorer-clear font-mono text-[12px] text-graphite-400" aria-hidden="true">
              ⌕
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[{ slug: undefined, name: "Everywhere" }, ...MARKETS].map((m) => (
            <button
              key={m.slug ?? "all"}
              type="button"
              className="chip !min-h-9 !px-3 !text-[12px]"
              data-active={p.filters.market === m.slug ? "true" : undefined}
              aria-pressed={p.filters.market === m.slug}
              onClick={() => p.onFilters({ ...p.filters, market: m.slug as Filters["market"] })}
            >
              {m.name}
            </button>
          ))}
          <button
            type="button"
            className="chip !min-h-9 !px-3 !text-[12px]"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters{activeFilters ? ` · ${activeFilters}` : ""} {showFilters ? "▴" : "▾"}
          </button>
        </div>

        {showFilters ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline pt-3">
            <Select label="Level" value={p.filters.level ?? ""} onChange={(v) => p.onFilters({ ...p.filters, level: (v || undefined) as Filters["level"] })} options={LEVELS.map((l) => [l, LEVEL_LABEL[l]])} />
            <Select label="Type" value={p.filters.type ?? ""} onChange={(v) => p.onFilters({ ...p.filters, type: (v || undefined) as Filters["type"] })} options={TYPES.map((t) => [t, TYPE_LABEL[t]])} />
            <Select label={`Status · as of ${p.asOf}`} value={p.filters.status ?? ""} onChange={(v) => p.onFilters({ ...p.filters, status: (v || undefined) as Filters["status"] })} options={STATUSES.map((s) => [s, STATUS_LABEL[s]])} />
            <div className="flex flex-col gap-2 pt-4">
              <Check label="Gated" checked={Boolean(p.filters.gated)} onChange={(v) => p.onFilters({ ...p.filters, gated: v || undefined })} />
              <Check label="Include county-registry names" checked={Boolean(p.filters.registry)} onChange={(v) => p.onFilters({ ...p.filters, registry: v || undefined })} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="explorer-body" id={bodyId} ref={listRef}>
        {p.selected ? (
          <PlaceCard
            entry={p.selected}
            ancestors={p.ancestors}
            childCount={p.childCount}
            asOf={p.asOf}
            headingRef={cardHeading}
            onSelect={p.onSelect}
            onClose={closeCard}
          />
        ) : null}

        <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-5 py-3">
          <p className="t-note">{countLine}</p>
          {p.selected || p.searching || activeFilters || p.filters.market || p.list ? (
            <button type="button" className="t-note text-harbor-700 underline underline-offset-4 hover:text-navy" onClick={p.onShowAll}>
              Show everything
            </button>
          ) : null}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announced}
        </p>

        {p.listed.length ? (
          <a href={`#${footId}`} className="explorer-skip">
            Skip the list
          </a>
        ) : null}

        {p.loading ? (
          <ul className="flex flex-col" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="explorer-row">
                <span className="block h-4 w-2/3 animate-pulse bg-linen-100" />
                <span className="mt-2 block h-3 w-1/2 animate-pulse bg-linen-100" />
              </li>
            ))}
          </ul>
        ) : p.listed.length ? (
          <ul className="flex flex-col">
            {p.listed.slice(0, limit).map((e) => {
              const path = pathOf(e, p.by).map((a) => a.n);
              return (
                <li key={e.s}>
                  <button
                    type="button"
                    className={cn("explorer-row", p.hover === e.s && "is-hover")}
                    data-slug={e.s}
                    onMouseEnter={() => p.onHover(e.s)}
                    onMouseLeave={() => p.onHover(null)}
                    onFocus={() => p.onHover(e.s)}
                    onBlur={() => p.onHover(null)}
                    onClick={() => {
                      returnTo.current = e.s;
                      p.onSelect(e.s);
                    }}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className={cn("explorer-dot", e.l === "area" && "is-area", !e.r && "is-registry")} aria-hidden="true" />
                      <span className="t-h4 text-navy">{e.n}</span>
                      {e.x === null ? <span className="t-mono-sm text-graphite-400">no point</span> : null}
                    </span>
                    <span className="t-note block">
                      {[path.length ? path.join(" › ") : marketName(e.m), e.t ? TYPE_LABEL[e.t] : LEVEL_LABEL[e.l]].join(" · ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : !p.error ? (
          <div className="flex flex-col gap-3 px-5 py-8">
            <p className="t-h3 text-navy">{p.searching ? "Nothing by that name yet." : "Nothing in this view."}</p>
            <p className="t-small text-body-muted">
              {p.searching
                ? "Try the ZIP, the builder, or the association's name. If it's a real street we don't have, tell us and we'll add it."
                : "Zoom out, widen the filters, or search for a place by name."}
            </p>
            {p.searching ? (
              <Link href={`/contact?message=${encodeURIComponent(`Looking for: ${p.q}`)}${p.filters.market ? `&market=${p.filters.market}` : ""}`} className="link-rule self-start">
                Ask us about it
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-5 py-8">
            <p className="t-h3 text-navy">The catalogue did not load.</p>
            <p className="t-small text-body-muted">Check the connection and try again. The map still works without it.</p>
            <button type="button" className="link-rule self-start" onClick={p.onRetry}>
              Try again
            </button>
          </div>
        )}

        {p.listed.length > limit ? (
          <div className="px-5 py-4">
            <button type="button" className="link-rule" onClick={showMore}>
              Show {Math.min(PAGE, p.listed.length - limit)} more
            </button>
          </div>
        ) : null}

        <div id={footId} tabIndex={-1} className="mt-auto flex flex-col gap-2 border-t border-hairline px-5 py-5 outline-none">
          <p className="t-small text-body-muted">
            Facts come from county map services, school-district locators and the builders’ own sites, each checked and dated. Nothing here is a rating or a price.
          </p>
          <Link href="/contact" className="link-rule self-start">
            Ask us about a street
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="t-mono-sm text-graphite-500">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="explorer-select">
        <option value="">Any</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 t-small text-body">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-navy)]" />
      {label}
    </label>
  );
}
