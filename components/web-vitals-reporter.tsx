"use client";

import { useParams, usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import { pixelCapturingHere } from "@/lib/home-platform";
import { plausiblePayload, routeTemplate, vitalEvent, type VitalMetric } from "@/lib/web-vitals";

/**
 * Loaded for the sampled page loads only (components/web-vitals.tsx). The
 * page is read once, when the visit arrives: the route template and the
 * viewport's width. Whether Home Platform's pixel is running is read as each
 * metric goes (it starts at the window's load, and stays off for visitors
 * with Global Privacy Control or Do Not Track), so `pixel` splits the same
 * pages into visits with and without its cost.
 * Each metric goes once, by sendBeacon, so a value reported as the page is
 * hidden or left still arrives. Plausible's own rules apply: nothing from
 * localhost or from a browser marked with `plausible_ignore`.
 */

type Landing = { template: string; width: number };

let landing: Landing | null = null;
let target: { endpoint: string; domain: string } | null = null;
const sent = new Set<string>();

function ignored(): boolean {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:") return true;
  try {
    return localStorage.getItem("plausible_ignore") === "true";
  } catch {
    return false;
  }
}

function report(metric: VitalMetric) {
  if (!landing || !target || sent.has(metric.id) || ignored()) return;
  const props = vitalEvent(metric, { ...landing, pixel: pixelCapturingHere() });
  if (!props) return;
  sent.add(metric.id);
  const body = plausiblePayload(props, { url: location.href, domain: target.domain, referrer: document.referrer || null });
  try {
    if (navigator.sendBeacon?.(target.endpoint, body)) return;
    void fetch(target.endpoint, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => undefined);
  } catch {
    // never let measuring break the page
  }
}

export default function WebVitalsReporter({ domain, host }: { domain: string; host: string }) {
  const pathname = usePathname();
  const params = useParams();
  useEffect(() => {
    if (landing) return;
    landing = {
      template: routeTemplate(pathname ?? location.pathname, params as Record<string, string | string[]> | null),
      width: window.innerWidth,
    };
    target = { endpoint: `${host.replace(/\/$/, "")}/api/event`, domain };
    // Only the page the visit landed on is measured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useReportWebVitals(report);
  return null;
}
