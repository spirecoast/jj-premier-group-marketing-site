"use client";

import { useEffect, useState } from "react";
import { dayHere, msUntilNextDay } from "./time";

/**
 * A day that stays current. `initial` is what the server (or the first
 * client read) decided; `read` is how to read the clock, the visitor's own
 * day by default. The value updates at the next midnight and every one after.
 */
export function useToday(initial: string, read: (d: Date) => string = dayHere): string {
  const [today, setToday] = useState(initial);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      const now = new Date();
      setToday((t) => (t === read(now) ? t : read(now)));
      timer = setTimeout(arm, msUntilNextDay(read, now));
    };
    timer = setTimeout(arm, msUntilNextDay(read));
    // A tab that was asleep (laptop lid closed) checks the day again when it wakes.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const now = read(new Date());
        setToday((t) => (t === now ? t : now));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [read]);
  return today;
}
