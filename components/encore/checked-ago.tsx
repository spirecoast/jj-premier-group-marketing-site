"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/encore/panel";

/**
 * The time since the listing was last read. The server's render time gives
 * the first text (so the HTML is complete and hydration matches); the
 * browser moves it to now, since an ISR page can be an hour old.
 */
export function CheckedAgo({ iso, renderedAt }: { iso: string; renderedAt: string }) {
  const [now, setNow] = useState(() => Date.parse(renderedAt));
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York" })}>
      {relativeTime(iso, now)}
    </time>
  );
}
