"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { lookupFeedsAsk, lookupOutcome, type LookupStatus } from "@/lib/sales/lookup";

export type LookupState<A, S> = { status: LookupStatus; data?: A; searched?: S };

/**
 * One street lookup against /api/sales, shared by Tide Street and Home Value:
 * a new search cancels the one before, the status runs idle, loading, then
 * done or error (lib/sales/lookup.ts says which answers settle), and the
 * result area takes focus when it settles. What was searched never goes into
 * the address bar (the CRM pixel reads it, and an address is someone's home);
 * a link that carries one (`fromLink`) is run once on arrival.
 */
export function useSalesLookup<A, S>({
  action,
  fromLink,
  onAsk,
}: {
  /** The Explore event's action. */
  action: "sold-search" | "home-value";
  /** The search a link asks for, read once on arrival, or null. */
  fromLink?: (sp: URLSearchParams) => { query: URLSearchParams; searched: S } | null;
  /** A settled lookup the ask form should carry. */
  onAsk?: (data: A, searched: S, httpStatus: number) => void;
}) {
  const [state, setState] = useState<LookupState<A, S>>({ status: "idle" });
  const abort = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const onAskRef = useRef(onAsk);
  useEffect(() => {
    onAskRef.current = onAsk;
  });

  const run = useCallback(
    async (query: URLSearchParams, searched: S) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setState({ status: "loading", searched });
      track("Explore", { action });
      try {
        const res = await fetch(`/api/sales?${query}`, { signal: controller.signal });
        const data = (await res.json().catch(() => null)) as A;
        setState({ status: lookupOutcome(res.status, data), data, searched });
        if (lookupFeedsAsk(res.status, data)) onAskRef.current?.(data, searched, res.status);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setState({ status: "error", searched });
      }
    },
    [action],
  );

  // A link that carries a search runs it once on arrival.
  const fromLinkRef = useRef(fromLink);
  useEffect(() => {
    const asked = fromLinkRef.current?.(new URLSearchParams(window.location.search));
    if (asked) void run(asked.query, asked.searched);
  }, [run]);

  // The result (or the error) takes focus when the lookup settles, so a screen reader hears it.
  useEffect(() => {
    if (state.status === "done" || state.status === "error") resultsRef.current?.focus();
  }, [state.status]);

  useEffect(() => () => abort.current?.abort(), []);

  return { state, run, resultsRef };
}
