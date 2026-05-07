import { Resend } from "resend";
import { checkFairHousing } from "@/lib/fair-housing";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export type EmailCategory = "transactional" | "marketing";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  /**
   * 'marketing' triggers the Fair Housing checker before send and is the only
   * path that should ever carry an unsubscribe footer. 'transactional'
   * (lead confirmations, internal team notifications, magic links) bypasses
   * the FH check and ships unconditionally. Defaults to 'transactional'.
   */
  category?: EmailCategory;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Send a transactional or marketing email via Resend.
 *
 * - Marketing sends run through Fair Housing — if any banned phrase matches,
 *   the send is blocked and the failure is logged loudly. Real-estate ad copy
 *   that trips the checker should be revised, not waved through.
 * - Email failures never roll back upstream business events (e.g., a captured
 *   lead). Callers should treat `{ ok: false }` as observability, not control
 *   flow.
 *
 * In dev without RESEND_API_KEY set, logs the payload and returns ok=true so
 * local form testing isn't blocked.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const category: EmailCategory = input.category ?? "transactional";

  if (category === "marketing") {
    const fh = checkFairHousing(input.html);
    if (!fh.passed) {
      console.error("[email] Fair Housing block — send halted", {
        subject: input.subject,
        flags: fh.flags,
      });
      return { ok: false, error: "fair_housing_blocked" };
    }
  }

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    console.info("[email] dev mode (no RESEND_API_KEY/FROM) — would send:", {
      to: input.to,
      subject: input.subject,
      category,
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
