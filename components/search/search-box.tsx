"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SEARCH_COPY as C } from "@/lib/search/copy";

export const SEARCH_INPUT_ID = "site-search-q";

const href = (q: string) => (q ? (`/search?q=${encodeURIComponent(q)}` as Route) : ("/search" as Route));

/**
 * The search box on /search. A plain GET form, so it works without
 * JavaScript; with it, results follow the typing (debounced) and the URL
 * stays the address of what's on screen. Focused on arrival when there's no
 * query yet, which is how the header's search button and ⌘K open it.
 */
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string | null>(initial.trim());
  const input = useRef<HTMLInputElement>(null);

  // Back and forward change the query under us: follow it.
  useEffect(() => {
    setValue(initial);
    last.current = initial.trim();
  }, [initial]);

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const go = (q: string, mode: "push" | "replace") => {
    const t = q.trim();
    if (t === last.current) return;
    if (t.length === 1) return; // one letter isn't a search yet
    last.current = t;
    startTransition(() => {
      if (mode === "push") router.push(href(t), { scroll: false });
      else router.replace(href(t), { scroll: false });
    });
  };

  return (
    <form
      role="search"
      action="/search"
      method="get"
      className="flex w-full max-w-[760px] flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        last.current = null; // submit always runs, even for the same words
        go(value, "push");
      }}
    >
      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        {C.label}
      </label>
      <div className="flex items-stretch">
        <div className="relative flex-1">
          <input
            ref={input}
            id={SEARCH_INPUT_ID}
            name="q"
            type="search"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              setValue(v);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => go(v, "replace"), 350);
            }}
            placeholder={C.placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={200}
            autoFocus={!initial}
            className="search-input"
          />
          {value ? (
            <button
              type="button"
              className="search-clear"
              aria-label={C.clear}
              onClick={() => {
                setValue("");
                if (timer.current) clearTimeout(timer.current);
                go("", "replace");
                input.current?.focus();
              }}
            >
              ✕
            </button>
          ) : null}
        </div>
        <button type="submit" className="btn btn-navy !h-auto shrink-0 !px-5">
          {C.submit}
        </button>
      </div>
      <p className="t-mono-sm h-4 text-graphite-500" aria-live="polite">
        {pending ? C.searching : ""}
      </p>
    </form>
  );
}
