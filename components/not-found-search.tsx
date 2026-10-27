"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SEARCH_COPY as C } from "@/lib/search/copy";
import { queryFromPath } from "@/lib/not-found-query";
import { KIND_LABEL, type SearchHit, type SearchResponse } from "@/lib/search/types";

/** How many of the site's own matches the page offers before the search box is needed. */
const SUGGESTIONS = 3;

/**
 * Search on the 404 page. The address that wasn't found usually names what
 * the visitor was after ("/neighborhoods/lake-club"), so the box opens with
 * those words (lib/not-found-query.ts) and, when the site's search has a
 * match for them above its threshold, the three best sit under "Did you
 * mean" as links. The page is static, so the browser reads the address after
 * hydration; without JavaScript the box is a plain GET form to /search.
 */
export function NotFoundSearch() {
  const input = useRef<HTMLInputElement>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    const q = queryFromPath(window.location.pathname);
    // The box is uncontrolled: the words go straight in, and the visitor's own typing is never overwritten.
    if (input.current && !input.current.value) input.current.value = q;
    if (q.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? (r.json() as Promise<SearchResponse>) : null))
      .then((res) => {
        if (res?.results?.length) setHits(res.results.slice(0, SUGGESTIONS));
      })
      .catch(() => {
        /* no suggestions, the box still works */
      });
    return () => ctrl.abort();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <form role="search" action="/search" method="get" className="flex w-full max-w-[640px] flex-col gap-2">
        <label htmlFor="not-found-q" className="field-label">
          {C.label}
        </label>
        <div className="flex items-stretch">
          <div className="relative flex-1">
            <input
              ref={input}
              id="not-found-q"
              name="q"
              type="search"
              defaultValue=""
              placeholder={C.placeholder}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              maxLength={200}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-navy !h-auto shrink-0 !px-5">
            {C.submit}
          </button>
        </div>
      </form>

      {hits.length ? (
        <div className="flex flex-col gap-3">
          <p className="t-h4 text-navy">Did you mean</p>
          <ul className="flex max-w-[640px] flex-col border-y border-hairline">
            {hits.map((h) => (
              <li key={h.id} className="border-b border-hairline last:border-b-0">
                <Link href={h.url as Route} className="row-link flex min-h-12 items-center justify-between gap-4 py-2.5">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="t-body text-navy">{h.title}</span>
                    {h.section && h.section !== h.title ? <span className="t-note">{h.section}</span> : null}
                  </span>
                  <span className="t-label shrink-0 text-sky-700">{KIND_LABEL[h.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
