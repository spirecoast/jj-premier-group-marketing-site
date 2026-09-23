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

export type AnalyticsEvent = "Lead" | "Subscribe" | "Calendar feed" | "Phone tap";

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // never let analytics break a form
  }
}
