"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MARKETS } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { CATEGORY, CATEGORY_ORDER } from "@/lib/encore/categories";
import type { EncoreVenue } from "@/lib/encore/index-format";
import { cn } from "@/lib/utils";
import { ChevronDown, Cross } from "./glyphs";

/**
 * "Where and what": the market, the venue and the category, in one sheet
 * that opens from the filter chip. A bottom sheet on a phone (swipe the
 * handle or the scrim to close), a panel under the chip from lg. It is a
 * native dialog, so focus is held inside, Esc closes it and focus returns
 * to the chip. Filters apply as they are tapped; the footer's count says
 * what the view will hold.
 */
export function FilterSheet({
  open,
  onClose,
  anchor,
  market,
  venue,
  category,
  venues,
  catCounts,
  total,
  onMarket,
  onVenue,
  onCategory,
  onClear,
  allowEmptyCategories,
}: {
  open: boolean;
  onClose: () => void;
  /** The chip it opened from, to sit under it on a desktop. */
  anchor: React.RefObject<HTMLElement | null>;
  market?: MarketSlug;
  venue?: string;
  category?: EventCategory;
  venues: EncoreVenue[];
  catCounts: Map<EventCategory, number>;
  total: number;
  onMarket: (m?: MarketSlug) => void;
  onVenue: (v?: string) => void;
  onCategory: (c?: EventCategory) => void;
  onClear: () => void;
  /** On view: a category with no dated performance may still have exhibitions. */
  allowEmptyCategories?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      const a = anchor.current?.getBoundingClientRect();
      if (a) {
        // Under the chip, unless that leaves the panel no room: then high enough for 600px of it.
        const top = Math.max(136, Math.min(a.bottom + 8, window.innerHeight - 640));
        el.style.setProperty("--sheet-x", `${Math.round(Math.min(a.left, window.innerWidth - 464))}px`);
        el.style.setProperty("--sheet-y", `${Math.round(top)}px`);
      }
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && el.open) {
      el.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open, anchor]);

  // The handle: a short drag down closes; anything less springs back.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    start.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    setDrag(Math.max(0, e.clientY - start.current));
  };
  const onPointerUp = () => {
    const d = drag;
    start.current = null;
    setDrag(0);
    if (d > 80) onClose();
  };

  const count = (c: EventCategory) => catCounts.get(c) ?? 0;

  return (
    <dialog
      ref={ref}
      className="encore-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
    >
      <div className="encore-sheet-handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-hidden="true">
        <span />
      </div>
      <div className="encore-sheet-body flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="t-h3 text-navy">
            Where and what
          </h2>
          <button type="button" className="btn-quiet is-square" aria-label="Close" onClick={onClose}>
            <Cross />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="t-mono-sm text-graphite-600">Market</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Market">
            {[{ slug: undefined, name: "Everywhere" }, ...MARKETS].map((m) => (
              <button key={m.slug ?? "all"} type="button" className="chip" aria-pressed={market === m.slug} onClick={() => onMarket(m.slug as MarketSlug | undefined)}>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="encore-venue" className="t-mono-sm text-graphite-600">
            Venue
          </label>
          <VenueSelect id="encore-venue" venues={venues} value={venue} onChange={onVenue} />
          <p className="t-note">{venues.length} places, grouped by town.</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="t-mono-sm text-graphite-600">Category</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            <button type="button" className="chip" aria-pressed={!category} onClick={() => onCategory(undefined)}>
              <i className="chip-dot" style={{ background: "var(--color-navy)" }} aria-hidden="true" />
              Everything
            </button>
            {CATEGORY_ORDER.map((c) => {
              const n = count(c);
              return (
                <button key={c} type="button" className="chip" aria-pressed={category === c} disabled={!n && category !== c && !allowEmptyCategories} onClick={() => onCategory(category === c ? undefined : c)}>
                  <i className="chip-dot" style={{ background: CATEGORY[c].color }} aria-hidden="true" />
                  {CATEGORY[c].label}
                  {n ? <span className="chip-n">{n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="encore-sheet-foot">
        <button type="button" className="btn-quiet" onClick={onClear} disabled={!market && !venue && !category}>
          Clear
        </button>
        <button type="button" className="btn btn-navy" onClick={onClose}>
          Show {total} {total === 1 ? "event" : "events"}
          <span className="btn-dash" aria-hidden="true" />
        </button>
      </div>
    </dialog>
  );
}

/** The venue select, grouped by town: the one native control, 48px with 16px type. */
export function VenueSelect({ id, venues, value, onChange, className }: { id: string; venues: EncoreVenue[]; value?: string; onChange: (v?: string) => void; className?: string }) {
  return (
    <span className={cn("encore-select-wrap block", className)}>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className="encore-select" aria-label="Venue">
        <option value="">Any venue</option>
        {MARKETS.map((m) => (
          <optgroup key={m.slug} label={m.name}>
            {venues
              .filter((v) => v.m === m.slug)
              .map((v) => (
                <option key={v.s} value={v.s}>
                  {v.n}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown />
    </span>
  );
}
