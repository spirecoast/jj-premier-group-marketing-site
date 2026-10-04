/**
 * Resend's REST API through `fetch`: one email (POST /emails) or a batch of
 * up to 100 (POST /emails/batch). No SDK, so the tests can hand in a fake
 * fetch and see exactly what would go out.
 *
 * Every call carries an Idempotency-Key. On no answer or a 5xx it's tried
 * once more with the same key and body, which Resend answers from the first
 * call if that one went through; after that the outcome is "unknown" and
 * the caller never resends it automatically (lib/newsletter/batch.ts).
 */

export const RESEND_API = "https://api.resend.com";
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 2;

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  headers?: Record<string, string>;
  /** Resend tags: ASCII letters, digits, _ and - only. */
  tags?: { name: string; value: string }[];
};

export type ResendResult =
  | { ok: true; ids: string[]; httpStatus: number; attempts: number }
  | { ok: false; httpStatus: number | null; error: string; attempts: number };

/** Resend's JSON field names. */
function body(e: OutgoingEmail): Record<string, unknown> {
  return {
    from: e.from,
    to: [e.to],
    subject: e.subject,
    html: e.html,
    text: e.text,
    ...(e.replyTo ? { reply_to: e.replyTo } : {}),
    ...(e.headers && Object.keys(e.headers).length ? { headers: e.headers } : {}),
    ...(e.tags?.length ? { tags: e.tags.map((t) => ({ name: safeTag(t.name), value: safeTag(t.value) })) } : {}),
  };
}

/** Resend rejects a tag with anything but letters, digits, underscores and dashes. */
export const safeTag = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(path: string, payload: unknown, apiKey: string, idempotencyKey: string, fetchImpl: typeof fetch): Promise<ResendResult> {
  let last: ResendResult = { ok: false, httpStatus: null, error: "not sent", attempts: 0 };
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetchImpl(`${RESEND_API}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.slice(0, 256),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const raw = await res.text().catch(() => "");
      let json: unknown = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }
      if (res.ok) {
        const data = (json as { data?: unknown; id?: unknown } | null) ?? {};
        const ids = Array.isArray(data.data)
          ? (data.data as { id?: string }[]).map((d) => d?.id ?? "")
          : typeof data.id === "string"
            ? [data.id]
            : [];
        return { ok: true, ids, httpStatus: res.status, attempts: attempt };
      }
      const message = (json as { message?: string } | null)?.message ?? raw.slice(0, 300);
      last = { ok: false, httpStatus: res.status, error: message || `HTTP ${res.status}`, attempts: attempt };
      // A 4xx is an answer: nothing was sent, and the same request would get the same answer.
      if (res.status < 500) return last;
    } catch (err) {
      last = { ok: false, httpStatus: null, error: err instanceof Error ? err.message : String(err), attempts: attempt };
    }
    if (attempt < ATTEMPTS) await sleep(1_000);
  }
  return last;
}

export function sendOne(email: OutgoingEmail, opts: { apiKey: string; idempotencyKey: string; fetchImpl?: typeof fetch }): Promise<ResendResult> {
  return post("/emails", body(email), opts.apiKey, opts.idempotencyKey, opts.fetchImpl ?? fetch);
}

/** Up to 100 emails in one call. Resend sends all of them or none (strict validation, its default). */
export function sendBatch(emails: OutgoingEmail[], opts: { apiKey: string; idempotencyKey: string; fetchImpl?: typeof fetch }): Promise<ResendResult> {
  if (emails.length === 0) return Promise.resolve({ ok: true, ids: [], httpStatus: 200, attempts: 0 });
  if (emails.length > 100) throw new Error(`sendBatch: ${emails.length} emails; Resend takes at most 100 a call`);
  return post("/emails/batch", emails.map(body), opts.apiKey, opts.idempotencyKey, opts.fetchImpl ?? fetch);
}
