"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { URL_PENDING_STYLE_ID } from "./url-island";

/**
 * One way for the tools to keep their state in the address bar, so a view is a
 * link, Back steps back, and nothing a visitor types reaches the URL.
 *
 * The tool pages are static: the server renders each tool in its default
 * state (fast from the CDN, and complete for crawlers), and the browser reads
 * the query once after hydration. The rules every tool follows:
 *
 * - Discrete steps (Atlas Move, Atlas Match, the Encore Planner's questions)
 *   push a history entry per step, and the browser's Back returns to the step
 *   before (useStepHistory). The finished plan or list replaces the last entry
 *   with its canonical URL.
 * - Committed choices (a filter, a view, a selected place) replace the URL
 *   once, when they're made (replaceQuery).
 * - Free text (a search box) and the map's position stay in memory and in
 *   this tab's session (sessionMemory) and reach a URL only when someone
 *   shares the view. The CRM pixel records a page view on every history write
 *   (lib/home-platform.ts), so nothing here writes per keystroke or per pan.
 * - Answers in progress are kept in localStorage on every change (draft), so a
 *   reload or an accidental swipe away comes back to where the visitor was.
 *
 * Parsing and printing stay in each tool's lib/<tool>/url.ts (or plan.ts,
 * match.ts), with round-trip tests beside them.
 */

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const STEP_KEY = "jjStep";


/**
 * The tool's starting state: the server's default for the first render (so it
 * hydrates clean), then, before the first paint after hydration, what the
 * address asks for. `key` changes when the URL state arrives, so a tool keyed
 * on it starts fresh from `initial` with all its own state.
 * `parse` returns null when the query says nothing to this tool.
 */
export function useUrlInitial<S>(parse: (sp: URLSearchParams) => S | null, serverInitial: S): { initial: S; key: string; fromUrl: boolean } {
  const [state, setState] = useState<{ initial: S; key: string; fromUrl: boolean }>({ initial: serverInitial, key: "server", fromUrl: false });
  const parseRef = useRef(parse);
  useIsoLayoutEffect(() => {
    const parsed = parseRef.current(new URLSearchParams(window.location.search));
    if (parsed !== null) setState({ initial: parsed, key: "url", fromUrl: true });
    document.getElementById(URL_PENDING_STYLE_ID)?.remove();
  }, []);
  return state;
}

/** True when the query carries any of these keys. */
export function hasAny(sp: URLSearchParams, keys: readonly string[]): boolean {
  return keys.some((k) => sp.has(k));
}

/**
 * Replaces the current entry's URL, keeping the hash, when it differs. Next's
 * router follows (usePathname, useSearchParams); no new entry is made.
 */
export function replaceQuery(href: string): void {
  const next = new URL(href, window.location.href);
  if (next.pathname === window.location.pathname && next.search === window.location.search) return;
  // A step flow's record on this entry stays with it (useStepHistory).
  const step = (window.history.state as Record<string, unknown> | null)?.[STEP_KEY];
  window.history.replaceState(step ? { [STEP_KEY]: step } : null, "", `${next.pathname}${next.search}${window.location.hash}`);
}

/* ---- Steps -------------------------------------------------------------- */

type StepRecord = { name: string; depth: number; entry: unknown };

function stepRecord(state: unknown): StepRecord | null {
  const r = (state as Record<string, unknown> | null)?.[STEP_KEY] as StepRecord | undefined;
  return r && typeof r === "object" && typeof r.depth === "number" ? r : null;
}

/**
 * History for a step-by-step flow. `push` makes a new entry per step (with an
 * optional URL); `back` steps back through them, so the in-page Back and the
 * browser's agree; `replace` rewrites the current one (the finished plan).
 * When the visitor moves through history, `onEntry` gets that entry's value,
 * or `initial` for the entry the page loaded on.
 */
export function useStepHistory<T>(name: string, initial: T, onEntry: (entry: T) => void) {
  const onEntryRef = useRef(onEntry);
  // The value at mount (or at the remount with the URL's state) is the page's first entry.
  const initialRef = useRef(initial);
  useEffect(() => {
    onEntryRef.current = onEntry;
  });

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const r = stepRecord(e.state);
      onEntryRef.current(r && r.name === name ? (r.entry as T) : initialRef.current);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [name]);

  const write = useCallback(
    (how: "push" | "replace", entry: T, href?: string) => {
      const current = stepRecord(window.history.state);
      const depth = how === "push" ? (current?.name === name ? current.depth : 0) + 1 : (current?.name === name ? current.depth : 0);
      const url = href ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const record: StepRecord = { name, depth, entry };
      if (how === "push") window.history.pushState({ [STEP_KEY]: record }, "", url);
      else window.history.replaceState({ [STEP_KEY]: record }, "", url);
    },
    [name],
  );

  const push = useCallback((entry: T, href?: string) => write("push", entry, href), [write]);
  const replace = useCallback((entry: T, href?: string) => write("replace", entry, href), [write]);

  /** Steps back through history when this flow pushed the entry we're on; otherwise returns false and the caller moves itself. */
  const back = useCallback((): boolean => {
    const r = stepRecord(window.history.state);
    if (r && r.name === name && r.depth > 0) {
      window.history.back();
      return true;
    }
    return false;
  }, [name]);

  return { push, replace, back };
}

/* ---- Storage ------------------------------------------------------------ */

/** Answers in progress, in this browser. Every read and write survives blocked storage. */
export const draft = {
  read<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode or blocked storage: the answers live in memory */
    }
  },
  clear(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to clear */
    }
  },
};

/**
 * What a view holds that the URL doesn't (a search box's words, the map's
 * position), for this tab and this page's address. Coming Back to the same
 * address restores it; another address starts clean.
 */
export const sessionMemory = {
  read<T>(scope: string): T | null {
    try {
      const raw = window.sessionStorage.getItem(`view:${scope}:${window.location.pathname}${window.location.search}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write(scope: string, value: unknown): void {
    try {
      window.sessionStorage.setItem(`view:${scope}:${window.location.pathname}${window.location.search}`, JSON.stringify(value));
    } catch {
      /* blocked storage: the view lives in memory */
    }
  },
};
