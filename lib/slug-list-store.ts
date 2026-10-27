"use client";

import { useCallback, useSyncExternalStore } from "react";
import { addSlugs, parseList, toggleSlug } from "@/lib/encore/my-list";

/*
 * A list of slugs kept in this browser, one per key: Encore's My list
 * (`encore:list`) and Atlas's My places (`atlas:places`). Each is a module
 * store that every Save button, count and list view reads
 * (useSyncExternalStore), so they never disagree; a save in another tab
 * arrives through the storage event. Empty on the server and at hydration,
 * then the stored list. Nothing leaves the browser unless the visitor shares
 * the list as a link.
 */

export type SlugList = {
  list: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  addAll: (slugs: string[]) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const EMPTY: string[] = [];

export function createSlugListStore(key: string): () => SlugList {
  let list: string[] = EMPTY;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded) return;
    loaded = true;
    try {
      list = parseList(window.localStorage.getItem(key));
    } catch {
      /* private mode or blocked storage: the list lives in memory */
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function set(next: string[]) {
    list = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* the list still holds for this page */
    }
    emit();
  }

  function onStorage(e: StorageEvent) {
    if (e.key !== key && e.key !== null) return;
    list = parseList(e.newValue ?? null);
    emit();
  }

  function subscribe(l: () => void) {
    load();
    if (!listeners.size) window.addEventListener("storage", onStorage);
    listeners.add(l);
    return () => {
      listeners.delete(l);
      if (!listeners.size) window.removeEventListener("storage", onStorage);
    };
  }

  function snapshot() {
    load();
    return list;
  }

  /** `toggle`, `addAll` and `remove` read the current list, never a copy from an earlier render. */
  return function useSlugList(): SlugList {
    const current = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
    const toggle = useCallback((slug: string) => set(toggleSlug(list, slug)), []);
    const addAll = useCallback((slugs: string[]) => set(addSlugs(list, slugs)), []);
    const remove = useCallback((slug: string) => set(list.filter((s) => s !== slug)), []);
    const clear = useCallback(() => set([]), []);
    const has = useCallback((slug: string) => current.includes(slug), [current]);
    return { list: current, has, toggle, addAll, remove, clear };
  };
}
