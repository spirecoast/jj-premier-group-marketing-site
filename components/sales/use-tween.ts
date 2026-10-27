"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * A number that settles on a new value over `ms` (ease-out) rather than
 * jumping: the medians on Tide Street when the group changes. Null jumps,
 * the first value shows at once, and reduced motion swaps instantly.
 */
export function useTween(value: number | null, ms = 600): number | null {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number | null>(value);
  const from = useRef<number | null>(value);
  useEffect(() => {
    const start = from.current;
    if (value === null || start === null || reduced || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduced]);
  return shown;
}
