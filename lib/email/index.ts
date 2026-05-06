import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Send a transactional email via Resend. Returns a result object so callers can
 * decide whether to retry or surface to the user. Email failures should never
 * block the underlying business event (e.g., a captured lead).
 *
 * In dev without RESEND_API_KEY set, logs the payload and returns ok=true so
 * local form testing isn't blocked.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    console.info("[email] dev mode (no RESEND_API_KEY/FROM) — would send:", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: true, id: "dev-noop" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);
}
