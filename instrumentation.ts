import type { Instrumentation } from "next";

/**
 * Runs once per server start (Next.js instrumentation hook): start Sentry
 * when NEXT_PUBLIC_SENTRY_DSN is set (lib/sentry/options.ts), and say which
 * lead sinks are on, shouting in production if none are.
 */
export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const [Sentry, { sentryOptions }] = await Promise.all([import("@sentry/nextjs"), import("@/lib/sentry/options")]);
    Sentry.init(sentryOptions());
  }
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { warnIfNoLeadSink } = await import("@/lib/lead-sinks");
  warnIfNoLeadSink();
}

/** Errors from server rendering, route handlers and server actions. Nothing is loaded without a DSN. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
