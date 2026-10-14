import type { BrowserOptions } from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "./scrub";

/**
 * Sentry reports errors from the live site: server, edge and browser.
 * NEXT_PUBLIC_SENTRY_DSN is the switch. Without it nothing loads, on the
 * server or in the browser, and no Sentry code ships to visitors. Set it on
 * Production only, as with Plausible, so previews never report into it.
 *
 * Errors only: no performance tracing, no session replay, no profiling.
 * `sendDefaultPii` stays off and every event goes through ./scrub.ts.
 */

export const sentryDsn = (): string | undefined => process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;

/** The options every runtime shares; the browser, Node and edge SDKs all accept these. */
export function sentryOptions(): BrowserOptions {
  return {
    dsn: sentryDsn(),
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  };
}
