"use client";

import { useSyncExternalStore } from "react";

/**
 * The one card the visitor just clicked, so its picture can carry a view
 * transition name into the page it opens (components/shared-frame.tsx). Only
 * the clicked card is named: a calendar can show the same event in two
 * rails, and two elements with one name would cancel the transition. The
 * key is the link's React id, which is stable across a remount of the same
 * list, so the hero finds its way back to the same card on a return.
 */
export type SharedTarget = { name: string; key: string };

let current: SharedTarget | null = null;
const listeners = new Set<() => void>();

export function markShared(target: SharedTarget) {
  current = target;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSharedTarget(): SharedTarget | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
