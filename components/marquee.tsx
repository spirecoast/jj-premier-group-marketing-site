"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The ticker under the hero. Continuous motion longer than five seconds needs
 * a control (WCAG 2.2.2): it pauses on hover, on focus, and with the button.
 * Duplicated copies are hidden from assistive technology.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;
  const copies = [0, 1, 2, 3];
  return (
    <div className={cn("relative overflow-hidden whitespace-nowrap border-y border-rule py-5", className)}>
      <div
        className="marquee inline-flex gap-16 pr-24 font-mono text-[12px] uppercase tracking-[0.16em] text-linen-700"
        data-paused={paused ? "true" : undefined}
      >
        {copies.map((c) =>
          items.map((item, i) => (
            <span key={`${c}-${i}`} aria-hidden={c > 0 ? "true" : undefined}>
              {item}
            </span>
          )),
        )}
      </div>
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-pressed={paused}
        className="absolute right-0 top-1/2 flex h-11 -translate-y-1/2 items-center bg-linen-200 pl-4 pr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-linen-700 hover:text-navy"
      >
        {paused ? "Play" : "Pause"}
      </button>
    </div>
  );
}
