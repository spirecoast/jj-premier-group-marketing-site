"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the visitor paused the site's looping motion (the hero and
 * masthead photographs' drift, the cameo's orbit, Encore's bulbs). Set from
 * the small control in a hero's corner (components/motion-toggle.tsx), kept
 * in localStorage, and read on every page by components/motion.tsx, which
 * puts it on <html data-motion> for the stylesheet. Anyone who asked the
 * system for reduced motion sees none of these loops regardless.
 */
const KEY = "jj:motion";

let paused = false;
const listeners = new Set<() => void>();

function apply() {
  document.documentElement.setAttribute("data-motion", paused ? "paused" : "running");
  listeners.forEach((l) => l());
}

/** Read the stored choice and put it on the document. Called once per page load. */
export function readMotionPref() {
  try {
    paused = localStorage.getItem(KEY) === "paused";
  } catch {
    paused = false;
  }
  apply();
}

export function setMotionPaused(next: boolean) {
  paused = next;
  try {
    localStorage.setItem(KEY, next ? "paused" : "running");
  } catch {
    // Private mode or storage off: the choice holds for this page.
  }
  apply();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useMotionPaused(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => paused,
    () => false,
  );
}
