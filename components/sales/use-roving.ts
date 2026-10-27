"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";

/**
 * Arrow keys across a row of buttons (a toolbar of chips, or a radiogroup):
 * Left and Right move, Home and End jump, and the row is one Tab stop. The
 * caller gives each button `tabIndex={i === active ? 0 : -1}` and the row
 * the returned `onKeyDown`.
 */
export function useRoving(count: number, active: number, setActive: (i: number) => void) {
  const row = useRef<HTMLDivElement>(null);
  const focus = useCallback(
    (i: number) => {
      const next = ((i % count) + count) % count;
      setActive(next);
      const buttons = row.current?.querySelectorAll<HTMLElement>('[role="radio"], button');
      buttons?.[next]?.focus();
    },
    [count, setActive],
  );
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!count) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        focus(active + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        focus(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        focus(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focus(count - 1);
      }
    },
    [active, count, focus],
  );
  return { row, onKeyDown };
}
