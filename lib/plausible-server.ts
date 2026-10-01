import "server-only";

/**
 * Server-side Plausible events (https://plausible.io/docs/events-api), sent
 * from the lead pipeline as an ad-blocker backstop. Gated on
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN, the same switch as components/analytics.tsx.
 * Never throws.
 *
 * The browser owns the "Lead" and "Subscribe" goals (the thank-you page and
 * the inline letter form). This sends a separate "Lead server" goal, so the
 * two are never added together; the visitor's User-Agent and IP are forwarded
 * so Plausible attributes it to the same visitor.
 */
export type PlausibleServerEvent = {
  name: "Lead server";
  /** The page the form was on. Plausible needs an absolute URL. */
  url: string;
  props?: Record<string, string>;
  /** Forwarded so Plausible attributes the event to the visitor, not to the server. */
  userAgent?: string | null;
  ip?: string | null;
};

export type PlausibleServerResult = { ok: true; status: number } | { ok: false; error: string; skipped?: boolean };

export async function sendPlausibleEvent(
  event: PlausibleServerEvent,
  fetchImpl: typeof fetch = fetch,
): Promise<PlausibleServerResult> {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return { ok: false, error: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN not set", skipped: true };
  const host = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (event.userAgent) headers["User-Agent"] = event.userAgent;
  if (event.ip) headers["X-Forwarded-For"] = event.ip;
  try {
    const res = await fetchImpl(`${host}/api/event`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: event.name,
        url: event.url,
        domain,
        props: { ...event.props, channel: "server" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[plausible] ${res.status} from events API`, text.slice(0, 200));
      return { ok: false, error: `${res.status} ${text.slice(0, 200)}`.trim() };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[plausible] server event failed", message);
    return { ok: false, error: message };
  }
}
