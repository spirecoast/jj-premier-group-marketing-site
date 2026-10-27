"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { addDays, dayNumber, daysInRange, monthLabel, weekday, weekdayShort } from "@/lib/encore/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "./glyphs";

/**
 * A strip of days you flick through. Each day shows how much is on as a
 * small bar; today is filled navy, the chosen day carries one amber bar
 * that slides between cells. The strip is one tab stop: the chosen day
 * holds the focus, the arrows move a day, PageUp and PageDown a week, Home
 * is today and End the last day loaded. It grows as it is scrolled, so the
 * page starts with three weeks of cells rather than four months.
 */
export function DayStrip({
  from,
  to,
  selected,
  today,
  counts,
  max,
  onPick,
  onReach,
}: {
  from: string;
  to: string;
  selected: string;
  today: string;
  counts: Map<string, number>;
  max: number;
  onPick: (day: string) => void;
  /** Scrolled near the end: load more days. */
  onReach?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const days = daysInRange(from, to);
  const selIndex = Math.max(0, days.indexOf(selected));

  // The chosen day stays in view, centred when it is off the edge.
  useEffect(() => {
    const strip = ref.current;
    const el = strip?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (!el || !strip) return;
    const box = strip.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.left < box.left || r.right > box.right) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  }, [selected]);

  // Near the right edge: ask for more days.
  useEffect(() => {
    const strip = ref.current;
    if (!strip || !onReach) return;
    const check = () => {
      if (strip.scrollLeft > 0 && strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 240) onReach();
    };
    strip.addEventListener("scroll", check, { passive: true });
    return () => strip.removeEventListener("scroll", check);
  }, [onReach, to]);

  const scrollBy = (dir: number) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dir > 0) onReach?.();
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  // Roving focus: the arrows move the focus and the selection together.
  const move = (day: string) => {
    const next = day < from ? from : day > to ? to : day;
    onPick(next);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus({ preventScroll: true }));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, PageDown: 7, PageUp: -7 };
    if (e.key in steps) {
      e.preventDefault();
      move(addDays(selected, steps[e.key]!));
    } else if (e.key === "Home") {
      e.preventDefault();
      move(today);
    } else if (e.key === "End") {
      e.preventDefault();
      move(to);
    }
  };

  return (
    <div className="encore-strip-wrap">
      <button type="button" className="btn-quiet is-square encore-strip-arrow" aria-label="Earlier days" onClick={() => scrollBy(-1)}>
        <ChevronLeft />
      </button>
      <div ref={ref} className="encore-strip" role="listbox" aria-label="Pick a day" onKeyDown={onKeyDown} style={{ ["--sel" as string]: selIndex }}>
        {days.map((d, i) => {
          const n = counts.get(d) ?? 0;
          const firstOfMonth = dayNumber(d) === 1 || i === 0;
          const wd = weekday(d);
          const isSel = d === selected;
          return (
            <button
              key={d}
              id={`day-${d}`}
              type="button"
              role="option"
              aria-selected={isSel}
              tabIndex={isSel ? 0 : -1}
              data-day={d}
              onClick={() => onPick(d)}
              className={cn("encore-day", d === today && "is-today", (wd === 0 || wd === 6) && "is-weekend")}
            >
              {firstOfMonth ? <span className="encore-day-month">{monthLabel(d).slice(0, 3)}</span> : null}
              <span className="encore-day-wd">{weekdayShort(d)}</span>
              <span className="encore-day-num">{dayNumber(d)}</span>
              <span className="encore-day-bar" aria-hidden="true">
                <span style={{ height: `${n ? Math.max(12, Math.round((n / Math.max(1, max)) * 100)) : 0}%` }} />
              </span>
              <span className="sr-only">
                {n} {n === 1 ? "event" : "events"}
              </span>
            </button>
          );
        })}
        <span className="encore-day-mark" aria-hidden="true" />
      </div>
      <button type="button" className="btn-quiet is-square encore-strip-arrow" aria-label="Later days" onClick={() => scrollBy(1)}>
        <ChevronRight />
      </button>
    </div>
  );
}
