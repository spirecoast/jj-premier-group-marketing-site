"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "encore:list";

/**
 * The shows someone has saved, kept in this browser. Nothing leaves the
 * device unless they share the list, which turns it into a URL.
 */
export function useMyList() {
  const [list, setList] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setList(JSON.parse(raw).filter((s: unknown) => typeof s === "string"));
    } catch {
      /* private mode or blocked storage: the list just lives in memory */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setList(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (slug: string) => {
      persist(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
    },
    [list, persist],
  );

  const addAll = useCallback(
    (slugs: string[]) => {
      persist([...new Set([...list, ...slugs])]);
    },
    [list, persist],
  );

  return { list, ready, has: (slug: string) => list.includes(slug), toggle, addAll, clear: () => persist([]) };
}
