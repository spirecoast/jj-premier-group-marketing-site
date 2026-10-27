"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { VITALS_SAMPLE_RATE } from "@/lib/web-vitals";

/**
 * Real visitors' LCP, INP and CLS, sent to Plausible as the "Web Vitals"
 * goal (lib/web-vitals.ts, docs/MEASUREMENT.md). Rendered by
 * components/analytics.tsx, so only where Plausible is on: production with
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN set. A sample of page loads reports; the
 * others never download the reporter.
 */
const Reporter = dynamic(() => import("./web-vitals-reporter"), { ssr: false });

// Decided once per page load, in the browser.
const sampledHere = typeof window !== "undefined" && Math.random() < VITALS_SAMPLE_RATE;
const noSubscription = () => () => undefined;

export function WebVitals({ domain, host }: { domain: string; host: string }) {
  // The server's answer (false) during hydration, so its HTML and the first client render agree; the browser's after.
  const sampled = useSyncExternalStore(noSubscription, () => sampledHere, () => false);
  return sampled ? <Reporter domain={domain} host={host} /> : null;
}
