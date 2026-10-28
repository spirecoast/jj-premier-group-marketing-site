"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import {
  CHECKLIST_KEY,
  GUIDE_NAME,
  checklistIcs,
  formatDay,
  parseChecklist,
  setDone,
  setDue,
  summarize,
  type Checklist,
  type GuideKey,
} from "@/lib/guide-checklist";
import { dayHere } from "@/lib/time";
import { cn } from "@/lib/utils";
import "./guides/guides.css";

/*
 * The buyer's and seller's guides as a personal checklist, kept in this
 * browser (lib/guide-checklist.ts). One store per guide that every step's
 * row and the summary read, so they never disagree; a change in another tab
 * arrives through the storage event. Empty on the server and at hydration,
 * then what's stored. The steps' words are the owners' and are never touched.
 */

type Store = { get: () => Checklist; set: (next: Checklist) => void; subscribe: (l: () => void) => () => void };
const EMPTY: Checklist = {};
const stores = new Map<GuideKey, Store>();

function storeFor(guide: GuideKey): Store {
  const existing = stores.get(guide);
  if (existing) return existing;
  const key = CHECKLIST_KEY[guide];
  let list: Checklist = EMPTY;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      list = parseChecklist(window.localStorage.getItem(key));
    } catch {
      /* blocked storage: the checklist lives for this page */
    }
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== key && e.key !== null) return;
    list = parseChecklist(e.newValue ?? null);
    emit();
  };
  const store: Store = {
    get: () => {
      load();
      return list;
    },
    set: (next) => {
      list = next;
      try {
        if (Object.keys(next).length) window.localStorage.setItem(key, JSON.stringify(next));
        else window.localStorage.removeItem(key);
      } catch {
        /* still holds for this page */
      }
      emit();
    },
    subscribe: (l) => {
      if (!listeners.size) window.addEventListener("storage", onStorage);
      listeners.add(l);
      return () => {
        listeners.delete(l);
        if (!listeners.size) window.removeEventListener("storage", onStorage);
      };
    },
  };
  stores.set(guide, store);
  return store;
}

const still = () => () => {};
/** The visitor's own day, read in the browser only (empty on the server, where nothing dated renders). */
function useDay(): string {
  return useSyncExternalStore(still, () => dayHere(), () => "");
}

function useChecklist(guide: GuideKey): [Checklist, (next: Checklist) => void] {
  const store = storeFor(guide);
  const list = useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
  return [list, store.set];
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-5 shrink-0 place-items-center border transition-colors duration-(--dur-micro)",
        on ? "border-sky-700 bg-sky-700 text-white" : "border-graphite-400 bg-white text-transparent group-hover:border-sky-700",
      )}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
        <path d="M2.5 6.2 5 8.6 9.5 3.6" />
      </svg>
    </span>
  );
}

/** One step's row: mark it done, give it a date. Under the step's own words, never in them. */
export function StepCheck({ guide, step, title }: { guide: GuideKey; step: number; title: string }) {
  const [list, set] = useChecklist(guide);
  const mark = list[step] ?? {};
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const today = useDay();

  const toggle = () => {
    const next = setDone(list, step, mark.done ? null : dayHere());
    set(next);
    if (!mark.done) track("Explore", { action: "guide-checklist", guide, what: "done" });
  };

  const openDate = () => {
    setEditing(true);
    // After the input is in the page: focus it, and open the picker where the browser can.
    requestAnimationFrame(() => {
      const el = input.current;
      if (!el) return;
      el.focus();
      try {
        el.showPicker?.();
      } catch {
        /* not allowed here: the focused field is enough */
      }
    });
  };

  const pick = (value: string) => {
    if (!value) return;
    set(setDue(list, step, value));
    setEditing(false);
    track("Explore", { action: "guide-checklist", guide, what: "date" });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-4" role="group" aria-label={`Your checklist, step ${step}`}>
      <button type="button" aria-pressed={Boolean(mark.done)} onClick={toggle} className="group -ml-1 flex min-h-11 items-center gap-3 px-1 text-left">
        <CheckBox on={Boolean(mark.done)} />
        <span className={cn("t-small", mark.done ? "text-navy" : "text-body")}>
          {mark.done ? (
            <>
              Done <span className="text-graphite-500">· {formatDay(mark.done, today || undefined)}</span>
            </>
          ) : (
            "Mark this step done"
          )}
        </span>
        <span className="sr-only">{`: ${title}`}</span>
      </button>

      {editing ? (
        <span className="flex items-center gap-3">
          <label htmlFor={id} className="t-small text-body">
            Have it done by
          </label>
          <input
            ref={input}
            id={id}
            type="date"
            min={today || undefined}
            defaultValue={mark.due ?? ""}
            className="field-input guide-check-date"
            onChange={(e) => pick(e.currentTarget.value)}
            onBlur={(e) => {
              if (!e.currentTarget.value || e.currentTarget.value === mark.due) setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </span>
      ) : mark.due ? (
        <span className="flex items-center gap-1">
          <button type="button" onClick={openDate} className="t-small flex min-h-11 items-center gap-2 px-1 text-body transition-colors hover:text-navy" aria-label={`Change the date for step ${step}, now ${formatDay(mark.due, today || undefined)}`}>
            <CalendarGlyph />
            By {formatDay(mark.due, today || undefined)}
          </button>
          <button
            type="button"
            onClick={() => set(setDue(list, step, null))}
            className="grid size-11 place-items-center text-graphite-500 transition-colors hover:text-navy"
            aria-label={`Take the date off step ${step}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
            </svg>
          </button>
        </span>
      ) : mark.done ? null : (
        <button type="button" onClick={openDate} className="t-small flex min-h-11 items-center gap-2 px-1 text-body transition-colors hover:text-navy">
          <CalendarGlyph />
          Add a date
        </button>
      )}
    </div>
  );
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" className="text-sky-700">
      <path d="M4 6.5h16V20H4zM4 10.5h16M8.5 4v4M15.5 4v4" />
    </svg>
  );
}

/**
 * After the steps, once anything is marked: how far along the reader is, the
 * next step, the dated ones to a calendar file, and a way to start over.
 */
export function ChecklistSummary({ guide, titles }: { guide: GuideKey; titles: string[] }) {
  const [list, set] = useChecklist(guide);
  const [confirming, setConfirming] = useState(false);
  const today = useDay();
  const s = summarize(list, titles.length);
  if (!s.any) return null;

  const download = () => {
    const pageUrl = `${window.location.origin}${window.location.pathname}`;
    const body = checklistIcs({ guide, list, titles, pageUrl, domain: window.location.hostname, siteName: "JJ Premier Group", now: new Date() });
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide === "buy" ? "buying" : "selling"}-checklist.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    track("Calendar feed", { kind: "guide", filter: `${guide}: ${s.dated.length} steps` });
  };

  const next = s.next;
  return (
    <section className="border-t border-hairline bg-paper" aria-labelledby={`${guide}-checklist-title`}>
      <div className="container-site flex flex-col gap-6 py-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="flex max-w-[620px] flex-col gap-3">
          <h2 id={`${guide}-checklist-title`} className="t-h2 text-navy">
            Your checklist
          </h2>
          <p className="t-body text-body" aria-live="polite">
            {s.done === s.total
              ? `All ${s.total} steps done.`
              : `${s.done} of ${s.total} steps done.`}
            {next ? (
              <>
                {" "}
                Next:{" "}
                <a href={`#step-${next.step}`} className="text-navy underline underline-offset-4 hover:text-sky-700">
                  step {next.step}, {titles[next.step - 1]}
                </a>
                {next.due ? `, by ${formatDay(next.due, today || undefined)}` : ""}.
              </>
            ) : null}
          </p>
          <p className="t-small text-graphite-500">Kept in this browser only. Nothing here is sent to us.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {s.dated.length ? (
            <button type="button" className="btn btn-navy" onClick={download}>
              Add the dates to my calendar
            </button>
          ) : (
            <p className="t-small max-w-[260px] text-graphite-500">Give a step a date and you can add it to your calendar.</p>
          )}
          {confirming ? (
            <span className="flex items-center gap-4">
              <span className="t-small text-body">Clear every mark in the {GUIDE_NAME[guide].toLowerCase()}?</span>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  set({});
                  setConfirming(false);
                }}
              >
                Clear
              </button>
              <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>
                Keep them
              </button>
            </span>
          ) : (
            <button type="button" className="btn-quiet" onClick={() => setConfirming(true)}>
              Clear my checklist
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
