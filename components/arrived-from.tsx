"use client";

import { useSyncExternalStore } from "react";
import { readFirstTouch } from "@/components/utm-tracker";

/**
 * Whether this visit came from one of the site's own emails (Tide or
 * Encore), so a page can stop asking a subscriber to subscribe. Read from
 * the link's utm tags (utm_source=tide|encore, or utm_medium=email), kept
 * for the session so the next page knows too, and from the stored first
 * touch. Client-only: the server renders the sign-up, and a reader from the
 * email sees the swap on hydration.
 */

export type EmailList = "tide" | "encore";

const KEY = "arrived-from";

function fromParams(search: string): EmailList | null {
  const p = new URLSearchParams(search);
  const source = (p.get("utm_source") ?? "").toLowerCase();
  const medium = (p.get("utm_medium") ?? "").toLowerCase();
  if (source === "tide" || source === "encore") return source;
  if (medium === "email") return "tide";
  return null;
}

function read(): EmailList | null {
  try {
    const now = fromParams(window.location.search);
    if (now) {
      window.sessionStorage.setItem(KEY, now);
      return now;
    }
    const kept = window.sessionStorage.getItem(KEY);
    if (kept === "tide" || kept === "encore") return kept;
  } catch {
    // blocked storage: the link's own tags still count
    const now = fromParams(window.location.search);
    if (now) return now;
  }
  const first = readFirstTouch();
  const source = (first?.utm_source ?? "").toLowerCase();
  if (source === "tide" || source === "encore") return source;
  return (first?.utm_medium ?? "").toLowerCase() === "email" ? "tide" : null;
}

const subscribe = () => () => {};

/** The list this visit arrived from, or null; null on the server and for the first client render. */
export function useArrivedFrom(): EmailList | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** `reader` for a visitor who came from the list's email, else `signup`. */
export function ArrivedFrom({ list, signup, reader }: { list: EmailList; signup: React.ReactNode; reader: React.ReactNode }) {
  const from = useArrivedFrom();
  return <>{from === list ? reader : signup}</>;
}
