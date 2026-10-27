"use client";

import { useCallback, useEffect, useState } from "react";

/*
 * One fetch of a JSON file per address for the whole visit. Atlas's explorer
 * and Atlas Match read the same neighborhood index, and Encore's calendar and
 * planner the same season: whichever opens first fetches it, and the other
 * (or the same page after Back) has it at once. A failed fetch is forgotten,
 * so "Try again" fetches afresh.
 */

const done = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

export function loadJson<T>(url: string): Promise<T> {
  if (done.has(url)) return Promise.resolve(done.get(url) as T);
  let p = inFlight.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))))
      .then((data: unknown) => {
        done.set(url, data);
        return data;
      })
      .finally(() => inFlight.delete(url));
    inFlight.set(url, p);
  }
  return p as Promise<T>;
}

/** The JSON at `url` (null while it loads), whether it failed, and a retry. A null url waits. */
export function useJsonResource<T>(url: string | null): { data: T | null; error: boolean; retry: () => void } {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: boolean }>(() => ({
    url,
    data: url && done.has(url) ? (done.get(url) as T) : null,
    error: false,
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return;
    let live = true;
    if (done.has(url)) {
      setState({ url, data: done.get(url) as T, error: false });
      return;
    }
    setState((s) => (s.url === url && !s.error ? s : { url, data: null, error: false }));
    loadJson<T>(url).then(
      (data) => live && setState({ url, data, error: false }),
      (err: unknown) => {
        if (!live) return;
        console.warn(`[data] ${err instanceof Error ? err.message : String(err)}`);
        setState({ url, data: null, error: true });
      },
    );
    return () => {
      live = false;
    };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = state.url === url;
  return { data: current ? state.data : null, error: current && state.error, retry };
}
