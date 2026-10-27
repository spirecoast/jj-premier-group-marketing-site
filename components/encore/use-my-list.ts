"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MY_LIST_KEY, addSlugs, parseList, toggleSlug } from "@/lib/encore/my-list";

/*
 * One list per browser, held in a module store that every Save button, count
 * and list view reads (useSyncExternalStore), so they never disagree. A save
 * in another tab arrives through the storage event.
 */

const EMPTY: string[] = [];
let list: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    list = parseList(window.localStorage.getItem(MY_LIST_KEY));
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
    window.localStorage.setItem(MY_LIST_KEY, JSON.stringify(next));
  } catch {
    /* the list still holds for this page */
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== MY_LIST_KEY && e.key !== null) return;
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

/**
 * The shows someone has saved, kept in this browser. Empty on the server and
 * at hydration, then the stored list. `toggle` and `addAll` read the current
 * list, never a copy from an earlier render.
 */
export function useMyList() {
  const current = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = useCallback((slug: string) => set(toggleSlug(list, slug)), []);
  const addAll = useCallback((slugs: string[]) => set(addSlugs(list, slugs)), []);
  const clear = useCallback(() => set([]), []);
  const has = useCallback((slug: string) => current.includes(slug), [current]);
  return { list: current, has, toggle, addAll, clear };
}
