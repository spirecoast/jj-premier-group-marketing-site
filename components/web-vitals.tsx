"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { VITALS_SAMPLE_RATE } from "@/lib/web-vitals";

/**
 * Real visitors' LCP, INP and CLS, sent to Plausible as the "Web Vitals"
 * goal (lib/web-vitals.ts, docs/MEASUREMENT.md). Rendered by
 * components/analytics.tsx, so only where Plausible is on: production with
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN set. A sample of page loads reports; the
 * others never download the reporter.
 */
const Reporter = dynamic(() => import("./web-vitals-reporter"), { ssr: false });

export function WebVitals({ domain, host }: { domain: string; host: string }) {
  // Decided once per page load, in the browser. Renders nothing either way.
  const [sampled] = useState(() => typeof window !== "undefined" && Math.random() < VITALS_SAMPLE_RATE);
  return sampled ? <Reporter domain={domain} host={host} /> : null;
}
