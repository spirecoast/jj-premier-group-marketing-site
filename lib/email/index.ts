import { Resend } from "resend";
import { previewEmailTo, sideEffectsAllowed } from "@/lib/deploy-env";
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
   * (internal team notifications and alerts) bypasses the FH check and ships
   * unconditionally. Defaults to 'transactional'.
   *
   * Nothing here addresses a visitor. The only email the site sends the
   * people who fill in its forms is the newsletter (confirmation, welcome,
   * issues), and that goes through lib/newsletter, not this module. Their
   * replies come from the agents' own mailboxes.
   */
  category?: EmailCategory;
  /** Files to attach (the newsletter hand-off attaches the finished issue). */
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

/** The id sendEmail answers with on a preview that sent nothing. */
export const PREVIEW_NOOP_ID = "preview-noop";

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
 *
 * On a preview deployment nothing goes to the real recipients
 * (lib/deploy-env.ts): with PREVIEW_EMAIL_TO set the email goes to that one
 * test inbox with "[Preview]" in front of the subject; without it, nothing is
 * sent and the result is ok with id PREVIEW_NOOP_ID, so a caller records the
 * step as done and never queues it for production to retry.
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

  let to = input.to;
  let subject = input.subject;
  if (!sideEffectsAllowed()) {
    const inbox = previewEmailTo();
    if (!inbox) {
      console.info("[email] preview deployment: not sent (set PREVIEW_EMAIL_TO for a test inbox)", { subject: input.subject, category });
      return { ok: true, id: PREVIEW_NOOP_ID };
    }
    to = inbox;
    subject = `[Preview] ${input.subject}`;
  }

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    console.info("[email] dev mode (no RESEND_API_KEY/FROM) — would send:", {
      to,
      subject,
      category,
    });
    return { ok: true, id: "dev-noop" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: input.html,
      replyTo: input.replyTo,
      attachments: input.attachments,
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
