"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ShareButton } from "@/components/share-button";
import { MARKETS, marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, STATUS_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { pathOf, type Filters } from "@/lib/neighborhoods/search";
import { LEVELS, STATUSES, TYPES } from "@/lib/neighborhoods/types";
import { cn } from "@/lib/utils";
import { PlaceCard } from "./place-card";

export type SheetPosition = "peek" | "half" | "full";

type Props = {
  loading: boolean;
  error: boolean;
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
  desktop: boolean;
  sheet: SheetPosition;
  onSheet: (p: SheetPosition) => void;
  onShowAll: () => void;
};

const PAGE = 80;

export function ExplorerPanel(p: Props) {
  const [showFilters, setShowFilters] = useState(Boolean(p.filters.level || p.filters.type || p.filters.status || p.filters.gated || p.filters.registry));
  const [limit, setLimit] = useState(PAGE);
  const listRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const activeFilters = [p.filters.level, p.filters.type, p.filters.status, p.filters.gated, p.filters.registry].filter(Boolean).length;

  useEffect(() => {
    setLimit(PAGE);
    listRef.current?.scrollTo({ top: 0 });
  }, [p.q, p.filters, p.selected?.s]);

  // Bottom sheet drag (phones): a handle you can pull between three stops.
  const drag = useRef<{ startY: number; startPos: SheetPosition } | null>(null);
  const onHandleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { startY: e.clientY, startPos: p.sheet };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    const order: SheetPosition[] = ["peek", "half", "full"];
    let i = order.indexOf(drag.current.startPos);
    if (dy < -40) i = Math.min(2, i + 1);
    else if (dy > 40) i = Math.max(0, i - 1);
    else if (Math.abs(dy) < 6) i = i === 2 ? 1 : i + 1; // a tap steps up, or closes from full
    p.onSheet(order[i]!);
    drag.current = null;
  };

  const context = p.selected && p.childCount && !p.searching
    ? `Inside ${p.selected.n}`
    : p.searching
      ? `${p.total.toLocaleString()} ${p.total === 1 ? "match" : "matches"}`
      : p.browsingInView
        ? `${p.listed.length.toLocaleString()} in view`
        : `${p.listed.length.toLocaleString()} places`;

  return (
    <aside className="explorer-panel" aria-label="Atlas, the neighborhood explorer">
      {!p.desktop ? (
        <button type="button" className="explorer-handle" aria-label={p.sheet === "full" ? "Shrink the list" : "Expand the list"} onPointerDown={onHandleDown} onPointerUp={onHandleUp}>
          <span aria-hidden="true" />
        </button>
      ) : null}

      <div className="explorer-head">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="t-eyebrow text-amber">Atlas · The neighborhood explorer</p>
            <h1 className="font-display text-[clamp(1.375rem,2.2vw,1.75rem)] font-light leading-[1.1] text-navy">
              Every place in Lakewood Ranch, Sarasota and Bradenton.
            </h1>
          </div>
          <ShareButton title="Atlas · JJ Premier Group" what="explorer-view" className="mt-1 shrink-0" />
        </div>

        <div className="explorer-search">
          <label htmlFor={searchId} className="sr-only">
            Search places, ZIPs, builders and associations
          </label>
          <input
            id={searchId}
            type="search"
            value={p.q}
            onChange={(e) => p.onQuery(e.target.value)}
            onFocus={() => !p.desktop && p.onSheet("full")}
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

      <div className="explorer-body" ref={listRef}>
        {p.selected ? (
          <PlaceCard
            entry={p.selected}
            ancestors={p.ancestors}
            childCount={p.childCount}
            asOf={p.asOf}
            onSelect={p.onSelect}
            onClose={() => p.onSelect(null)}
          />
        ) : null}

        <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-5 py-3">
          <p className="t-mono-sm text-graphite-500">{p.loading ? "Loading the catalog" : p.error ? "The catalog did not load" : context}</p>
          {p.selected || p.searching || activeFilters || p.filters.market ? (
            <button type="button" className="t-mono-sm text-harbor-700 underline underline-offset-4 hover:text-navy" onClick={p.onShowAll}>
              Show everything
            </button>
          ) : null}
        </div>

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
                    onMouseEnter={() => p.onHover(e.s)}
                    onMouseLeave={() => p.onHover(null)}
                    onFocus={() => p.onHover(e.s)}
                    onBlur={() => p.onHover(null)}
                    onClick={() => p.onSelect(e.s)}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className={cn("explorer-dot", e.l === "area" && "is-area", !e.r && "is-registry")} aria-hidden="true" />
                      <span className="t-h4 text-navy">{e.n}</span>
                      {e.x === null ? <span className="t-mono-sm text-graphite-400">no point</span> : null}
                    </span>
                    <span className="t-mono-sm block text-graphite-500">
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
              <Link href={`/contact?message=${encodeURIComponent(`Looking for: ${p.q}`)}`} className="link-rule self-start">
                Ask us about it
              </Link>
            ) : null}
          </div>
        ) : null}

        {p.listed.length > limit ? (
          <div className="px-5 py-4">
            <button type="button" className="link-rule" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, p.listed.length - limit)} more
            </button>
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 border-t border-hairline px-5 py-5">
          <p className="t-small text-body-muted">
            Facts come from county map services, school-district locators and the builders' own sites, each checked and dated. Nothing here is a rating or a price.
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
