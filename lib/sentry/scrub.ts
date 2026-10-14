import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/**
 * What leaves the site in a Sentry error report. Sentry already sends no
 * cookies, IP addresses or request bodies with `sendDefaultPii` off
 * (lib/sentry/options.ts); this removes them again in case an integration
 * adds them, and takes out the things that are ours to protect:
 *
 * - Query strings and fragments. Tool state lives there (the Planner, Atlas
 *   Match, the relocation plan), and so do the newsletter confirm and
 *   unsubscribe tokens.
 * - The questionnaire token in /q/<token>: anyone holding the link can open
 *   the client's answers.
 * - Console breadcrumbs. A database or CRM error logged by the lead pipeline
 *   can quote the values it failed on (lib/lead-pipeline.ts, lib/crm.ts).
 *
 * The privacy page promises a report carries the page, the browser and the
 * error, and nothing typed into a form. Keep it true.
 */

/** The questionnaire token: /q/<token>, wherever it appears (a URL, a path, "GET /q/<token>"). */
const QUESTIONNAIRE_TOKEN = /\/q\/[^/?#\s]+/g;

/** A URL, path or route name with no query, no fragment and no questionnaire token. */
export function scrubUrl(raw: string): string {
  if (!raw) return raw;
  return raw.replace(/[?#]\S*/g, "").replace(QUESTIONNAIRE_TOKEN, "/q/[token]");
}

const KEEP_HEADERS = new Set(["user-agent", "referer"]);

function scrubHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (!KEEP_HEADERS.has(key)) continue;
    out[k] = key === "referer" ? scrubUrl(v) : v;
  }
  return out;
}

const URL_KEYS = ["url", "from", "to"] as const;

/** Drops console breadcrumbs; strips queries and tokens from the URLs the rest carry. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category === "console") return null;
  if (crumb.data) {
    const data = { ...crumb.data };
    for (const key of URL_KEYS) if (typeof data[key] === "string") data[key] = scrubUrl(data[key]);
    crumb = { ...crumb, data };
  }
  if (crumb.category === "navigation" && typeof crumb.message === "string") crumb = { ...crumb, message: scrubUrl(crumb.message) };
  return crumb;
}

const looksLikeUrl = (v: unknown): v is string => typeof v === "string" && (v.startsWith("/") || /^https?:\/\//i.test(v));

/** Cleans every URL-like string one level down (tags, extra, a context's fields). */
function scrubUrlValues<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = { ...obj };
  for (const [k, v] of Object.entries(out)) if (looksLikeUrl(v)) out[k] = scrubUrl(v);
  return out as T;
}

/** Sentry's beforeSend: the event with every field above removed or cleaned. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.server_name;
  if (event.request) {
    const { url, headers, method } = event.request;
    event.request = {
      ...(url ? { url: scrubUrl(url) } : {}),
      ...(method ? { method } : {}),
      ...(headers ? { headers: scrubHeaders(headers) } : {}),
    };
  }
  if (typeof event.transaction === "string") event.transaction = scrubUrl(event.transaction);
  // captureRequestError puts the raw path, query and all, in contexts.nextjs.request_path.
  if (event.contexts) {
    const contexts: NonNullable<ErrorEvent["contexts"]> = {};
    for (const [name, ctx] of Object.entries(event.contexts)) contexts[name] = ctx && typeof ctx === "object" ? scrubUrlValues(ctx) : ctx;
    event.contexts = contexts;
  }
  if (event.tags) event.tags = scrubUrlValues(event.tags);
  if (event.extra) event.extra = scrubUrlValues(event.extra);
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter((b): b is Breadcrumb => b !== null);
  }
  return event;
}
