"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { readChannel } from "@/components/utm-tracker";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Fires the Plausible goal once per thank-you page view. The market comes
 * from the URL (`?market=`), carried over from the form. A reload of the same
 * page does not count twice (sessionStorage). `source` is the /from/<channel>
 * page the visit came through, or "none". The browser owns this goal; the
 * server action sends a separate "Lead server" event as an ad-blocker backstop.
 */
export function ThanksGoal({ event, form }: { event: AnalyticsEvent; form: string }) {
  const params = useSearchParams();
  const market = params.get("market") || "none";
  useEffect(() => {
    const key = `thanks-goal:${form}:${market}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // private mode: fire anyway
    }
    track(event, { form, market, source: readChannel() ?? "none" });
  }, [event, form, market]);
  return null;
}
