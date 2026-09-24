"use client";

import { useEffect, useRef } from "react";
import { dayNumber, daysInRange, weekday, weekdayShort, monthLabel } from "@/lib/encore/select";
import { cn } from "@/lib/utils";

/**
 * A strip of days you flick through. Each day shows how much is on as a
 * small bar; today is filled, the chosen day is underlined in amber. The
 * strip snaps and keeps the chosen day in view.
 */
export function DayStrip({
  from,
  to,
  selected,
  today,
  counts,
  max,
  onPick,
}: {
  from: string;
  to: string;
  selected: string;
  today: string;
  counts: Map<string, number>;
  max: number;
  onPick: (day: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const days = daysInRange(from, to);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (!el || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.left < box.left || r.right > box.right) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  const scrollBy = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="encore-strip-wrap">
      <button type="button" className="encore-strip-arrow" aria-label="Earlier days" onClick={() => scrollBy(-1)}>
        ‹
      </button>
      <div ref={ref} className="encore-strip" role="listbox" aria-label="Pick a day">
        {days.map((d, i) => {
          const n = counts.get(d) ?? 0;
          const firstOfMonth = dayNumber(d) === 1 || i === 0;
          const wd = weekday(d);
          return (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={d === selected}
              data-day={d}
              onClick={() => onPick(d)}
              className={cn("encore-day", d === today && "is-today", d === selected && "is-selected", (wd === 0 || wd === 6) && "is-weekend")}
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
      </div>
      <button type="button" className="encore-strip-arrow" aria-label="Later days" onClick={() => scrollBy(1)}>
        ›
      </button>
    </div>
  );
}
