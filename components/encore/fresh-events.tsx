"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { eventSpan, isCurrent } from "@/lib/encore/fresh";

/** Null while hydrating (the server's copy shows as it came), then the browser's clock. */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // After the first paint, so hydration matches the server's copy.
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);
  return now;
}

/**
 * A list of event cards that drops any card whose date has ended, for a
 * page served from a cache older than the evening it lists. `ends[i]` is
 * when child i is over (lib/encore/fresh.ts). When nothing is left, `empty`.
 */
export function FreshList({ ends, children, empty, className }: { ends: string[]; children: ReactNode; empty?: ReactNode; className?: string }) {
  const now = useNow();
  const items = Children.toArray(children);
  const shown = now == null ? items : items.filter((_, i) => !ends[i] || isCurrent(ends[i]!, now));
  if (!shown.length) return <>{empty ?? null}</>;
  return <ul className={className}>{shown}</ul>;
}

/** The ", November 6 to 13" after a heading, over the cards still showing. */
export function FreshSpan({ starts, ends }: { starts: string[]; ends: string[] }) {
  const now = useNow();
  if (now == null) return <>{eventSpan(starts)}</>;
  const today = new Date(now);
  // A run, or a show already under way, counts from today.
  const kept = starts.flatMap((s, i) => (!ends[i] || isCurrent(ends[i]!, now) ? [Date.parse(s) < now ? today : s] : []));
  return <>{eventSpan(kept)}</>;
}
