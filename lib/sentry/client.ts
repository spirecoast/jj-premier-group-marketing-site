/**
 * Sentry in the browser, loaded on demand (lib/sentry/options.ts). The
 * import is dynamic and sits behind NEXT_PUBLIC_SENTRY_DSN, which Next
 * inlines at build time: a build without a DSN drops the branch and ships
 * none of Sentry's code, and a build with one loads it as its own chunk
 * after the page, so it never holds up the first paint. An error thrown
 * before that chunk arrives isn't reported.
 */

type SentryModule = typeof import("@sentry/nextjs");

let loading: Promise<SentryModule | null> | undefined;

/** Loads and starts Sentry once; resolves to null when this build has no DSN or the chunk fails to load. */
export function loadSentry(): Promise<SentryModule | null> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return Promise.resolve(null);
  loading ??= Promise.all([import("@sentry/nextjs"), import("./options")])
    .then(([Sentry, { sentryOptions }]) => {
      Sentry.init(sentryOptions());
      return Sentry;
    })
    .catch(() => null);
  return loading;
}

/**
 * Reports an error an error boundary caught. Errors with a digest came from
 * the server, which has already reported them (instrumentation.ts), so only
 * the browser's own are sent from here.
 */
export function reportClientError(error: Error & { digest?: string }): void {
  if (error.digest) return;
  void loadSentry().then((Sentry) => Sentry?.captureException(error));
}
