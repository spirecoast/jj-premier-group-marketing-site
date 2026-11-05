"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { addMonths, clampDay, dayWords, keyTarget, monthOf, monthTitle, monthWeeks, pickDay, planBounds, previewRange, type RangePick } from "@/lib/encore/range";
import { DAYS } from "@/lib/encore/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "./glyphs";

/** Two months side by side from here; one below. */
const WIDE = "(min-width: 64rem)";
const WEEKDAYS = DAYS.map((d) => ({ full: d, short: d.slice(0, 2) }));

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The Planner's days, as a calendar to tap (the pure rules are in
 * lib/encore/range.ts). Tap one day and that's the plan; tap a later day to
 * make it a range; tap again to start over. Today is marked and the days
 * before it can't be picked; the months run as far as the Planner plans (a
 * year). One month on a phone, two side by side from 1024px.
 *
 * A grid in the WAI-ARIA sense, with one tab stop: the arrow keys move a day
 * or a week, Home and End to the ends of the week, Page Up and Page Down a
 * month (the months follow the focus), Enter or Space picks. The chosen days
 * are aria-selected, today is aria-current="date", and the month heading is
 * a polite live region so a screen reader hears where the arrows went.
 */
export function RangeCalendar({
  from,
  to,
  today,
  onChange,
  labelledBy,
  describedBy,
}: {
  from: string;
  to: string;
  today: string;
  onChange: (from: string, to: string) => void;
  labelledBy: string;
  describedBy?: string;
}) {
  const uid = useId();
  const { min, max } = planBounds(today);
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);
  const shownMonths = wide ? 2 : 1;
  const minMonth = monthOf(min);
  const maxMonth = monthOf(max);
  /** The first month shown, kept inside the months that have a day to pick. */
  const fit = (m: string) => {
    const last = addMonths(maxMonth, 1 - shownMonths);
    return m < minMonth ? minMonth : m > last ? (last < minMonth ? minMonth : last) : m;
  };

  const [anchor, setAnchor] = useState<string | null>(null);
  const [view, setView] = useState(() => monthOf(clampDay(from, min, max)));
  const [focusDay, setFocusDay] = useState(() => clampDay(from, min, max));
  const [over, setOver] = useState<string | null>(null);
  // The days this calendar last chose: anything else arriving (a quick date chip) moves the calendar to it.
  const [mine, setMine] = useState<string | null>(null);
  const [seen, setSeen] = useState(`${from}|${to}`);
  if (seen !== `${from}|${to}`) {
    setSeen(`${from}|${to}`);
    if (mine !== `${from}|${to}`) {
      setAnchor(null);
      setView(monthOf(clampDay(from, min, max)));
      setFocusDay(clampDay(from, min, max));
    }
  }

  const first = fit(view);
  const months = Array.from({ length: 2 }, (_, i) => addMonths(first, i));
  const visible = (day: string) => monthOf(day) >= first && monthOf(day) <= addMonths(first, shownMonths - 1);
  // The one tab stop: the focused day while it's on screen, else the first day that can be picked on screen.
  const tabDay = visible(focusDay) ? focusDay : clampDay(`${first}-01`, min, max);

  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, first]);

  const pick = (day: string) => {
    if (day < min || day > max) return;
    const next: RangePick = pickDay({ from, to, anchor }, day);
    setAnchor(next.anchor);
    setFocusDay(day);
    setOver(null);
    setMine(`${next.from}|${next.to}`);
    onChange(next.from, next.to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const day = (e.target as HTMLElement).dataset?.day;
    if (!day) return;
    const target = keyTarget(day, e.key);
    if (!target) return;
    e.preventDefault();
    const next = clampDay(target, min, max);
    if (!visible(next)) setView(monthOf(next) < first ? monthOf(next) : addMonths(monthOf(next), 1 - shownMonths));
    moveFocus.current = true;
    setFocusDay(next);
    if (anchor) setOver(next);
  };

  const step = (n: number) => {
    const next = fit(addMonths(first, n));
    setView(next);
    // The tab stop goes with the months: the same date if it's there, else the first day that can be picked.
    if (!(monthOf(focusDay) >= next && monthOf(focusDay) <= addMonths(next, shownMonths - 1))) setFocusDay(clampDay(`${next}-01`, min, max));
  };

  const atStart = first <= minMonth;
  const atEnd = addMonths(first, shownMonths - 1) >= maxMonth;
  const preview = previewRange(anchor, over);
  const range = from !== to;

  return (
    <div className="plan-cal" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {/* aria-disabled rather than disabled at either end, so the focus isn't dropped from a button that just ran out of months. */}
      <button type="button" className="btn-quiet plan-cal-nav is-prev" aria-label="Previous month" aria-disabled={atStart || undefined} onClick={() => !atStart && step(-1)}>
        <ChevronLeft />
      </button>
      <button type="button" className="btn-quiet plan-cal-nav is-next" aria-label="Next month" aria-disabled={atEnd || undefined} onClick={() => !atEnd && step(1)}>
        <ChevronRight />
      </button>
      <div ref={gridRef} className="plan-cal-months" onKeyDown={onKeyDown} onMouseLeave={() => setOver(null)}>
        {months.map((month, i) => (
          <div key={month} className={cn("plan-cal-month", i === 1 && "is-second")}>
            <table role="grid" className="plan-cal-grid" aria-labelledby={`${uid}-${i}`}>
              <caption id={`${uid}-${i}`} className="plan-cal-title" aria-live={i === 0 ? "polite" : undefined}>
                {monthTitle(month)}
              </caption>
              <thead>
                <tr>
                  {WEEKDAYS.map((w) => (
                    <th key={w.full} scope="col" className="plan-cal-wd">
                      <span aria-hidden="true">{w.short}</span>
                      <span className="sr-only">{w.full}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks(month).map((week, w) => (
                  <tr key={w}>
                    {week.map((day, d) => {
                      if (!day) return <td key={d} className="plan-cal-cell" />;
                      const off = day < min || day > max;
                      const chosen = day >= from && day <= to;
                      const edge = day === from || day === to;
                      const previewed = !!preview && day > preview[0] && day <= preview[1];
                      const label = `${dayWords(day, today)}${range && day === from ? ", first day" : range && day === to ? ", last day" : ""}`;
                      return (
                        <td
                          key={d}
                          role="gridcell"
                          aria-selected={off ? undefined : chosen}
                          className={cn("plan-cal-cell", chosen && !edge && "is-in", previewed && !chosen && "is-preview")}
                        >
                          <button
                            type="button"
                            data-day={day}
                            tabIndex={day === tabDay ? 0 : -1}
                            aria-label={label}
                            aria-disabled={off || undefined}
                            aria-current={day === today ? "date" : undefined}
                            className={cn("plan-cal-day", edge && "is-edge", previewed && day === preview?.[1] && "is-preview-end")}
                            onClick={() => pick(day)}
                            onMouseEnter={() => anchor && setOver(day)}
                            onFocus={() => setFocusDay(day)}
                          >
                            {Number(day.slice(8, 10))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
