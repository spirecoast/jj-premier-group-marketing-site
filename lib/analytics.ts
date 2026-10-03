/**
 * Custom events for Plausible. `window.plausible` exists only when the
 * script in components/analytics.tsx has loaded, so every call is a no-op
 * on previews, in tests and for visitors who block it.
 */
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

/** Every goal and its props are mapped to the funnel in docs/MEASUREMENT.md. */
export type AnalyticsEvent = "Lead" | "Subscribe" | "Review permission" | "Calendar feed" | "Phone tap" | "Share" | "Explore" | "Search";

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // never let analytics break a form
  }
}
