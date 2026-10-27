"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

const WIDE = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * One market's block in the crawlable index under the explorer. On a tablet
 * or desktop it is always open, the heading and the columns of links as they
 * were. On a phone it is a closed disclosure ("Lakewood Ranch · 48") so the
 * index is a few rows instead of a 3,800 px wall, and the links are 44 px
 * rows when it opens. The server renders it open, so crawlers and readers
 * without JavaScript see every link.
 */
export function MarketDisclosure({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => true);
  // What the visitor did on a phone; wide screens are always open.
  const [opened, setOpened] = useState(false);
  const open = wide || opened;
  return (
    <details open={open} onToggle={(e) => setOpened(e.currentTarget.open)} className="group flex flex-col gap-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 border-b border-hairline pb-2 md:pointer-events-none md:cursor-default [&::-webkit-details-marker]:hidden">
        {heading}
        <span className="font-mono text-[12px] text-graphite-500 transition-transform group-open:rotate-45 md:hidden" aria-hidden="true">
          +
        </span>
      </summary>
      {children}
    </details>
  );
}
