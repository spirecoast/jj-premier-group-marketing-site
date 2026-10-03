import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { checkFairHousing } from "@/lib/fair-housing";
import { C, SANS, column, documentHtml, esc, row, type Issue } from "./render";

/**
 * Hands a finished issue to the team. The site sends no email to visitors or
 * subscribers: the issue goes out later from the agents' Coldwell Banker
 * mailboxes or the Home Platform's Marketing Center (docs/ISSUES.md). Here it
 * is only
 *
 *  1. emailed to TEAM_NOTIFY_EMAIL (Resend), the one address this module
 *     ever sends to, with a note on what to check before sending; and
 *  2. POSTed as JSON to ISSUE_WEBHOOK_URL when set (a Zapier Catch Hook),
 *     so a Zap can put it in an Outlook draft or the Marketing Center.
 *
 * The webhook is skipped when the Fair Housing checker flags the issue or the
 * issue is held (a Tide month that isn't complete); the team gets an alert
 * with the issue instead.
 */

/** Constant-time string compare that doesn't leak the length. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The preview: `?secret=` equal to ISSUE_PREVIEW_SECRET. Unset secret = no preview. */
export function previewAllowed(request: NextRequest): boolean {
  const secret = process.env.ISSUE_PREVIEW_SECRET;
  const given = request.nextUrl.searchParams.get("secret");
  if (!secret || !given) return false;
  return safeEqual(given, secret);
}

/** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Unset secret = the job can't run. */
export function cronAllowed(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || !header) return false;
  return safeEqual(header, `Bearer ${secret}`);
}

export function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

/** The preview response: the issue's HTML, or its plain text with `?format=text`. */
export function previewResponse(issue: Issue, request: NextRequest): Response {
  const text = request.nextUrl.searchParams.get("format") === "text";
  return new Response(text ? issue.text : issue.html, {
    status: 200,
    headers: {
      "Content-Type": text ? "text/plain; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/** What a Zap receives. `html` and `text` are the issue exactly as subscribers should get it, less the send tool's unsubscribe link. */
export type IssuePayload = {
  kind: Issue["kind"];
  subject: string;
  html: string;
  text: string;
  period: Issue["period"];
  preheader: string;
  /** True for Tide while a dashed box is left (the month's story, or a signed note): fill or delete each before anything is sent. */
  needsEdit: boolean;
  placeholder: string | null;
  warnings: string[];
  generatedAt: string;
};

export type StepResult = { status: "sent" | "skipped" | "failed"; detail?: string; attempts?: number; httpStatus?: number };

export type HandoffResult = {
  ok: boolean;
  kind: Issue["kind"];
  period: Issue["period"];
  subject: string;
  fairHousing: "passed" | "flagged";
  /** Why the issue was kept from the Zap, when it was: the Fair Housing check, or a Tide month that isn't complete. */
  held: string | null;
  teamEmail: StepResult;
  webhook: StepResult;
  warnings: string[];
};

const WEBHOOK_TIMEOUT_MS = 8_000;
const WEBHOOK_ATTEMPTS = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST to the Zapier Catch Hook. Any 2xx is success; one retry on anything else (the lib/crm.ts pattern). */
async function postWebhook(payload: IssuePayload, fetchImpl: typeof fetch): Promise<StepResult> {
  const url = process.env.ISSUE_WEBHOOK_URL;
  if (!url) return { status: "skipped", detail: "ISSUE_WEBHOOK_URL not set" };
  const body = JSON.stringify(payload);
  let last: StepResult = { status: "failed" };
  for (let attempt = 1; attempt <= WEBHOOK_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      const text = await res.text().catch(() => "");
      if (res.ok) return { status: "sent", attempts: attempt, httpStatus: res.status, detail: text.slice(0, 200) || undefined };
      last = { status: "failed", attempts: attempt, httpStatus: res.status, detail: text.slice(0, 300) };
      console.error(`[issues] webhook ${res.status} (attempt ${attempt}/${WEBHOOK_ATTEMPTS})`, text.slice(0, 300));
    } catch (err) {
      last = { status: "failed", attempts: attempt, detail: err instanceof Error ? err.message : String(err) };
      console.error(`[issues] webhook network error (attempt ${attempt}/${WEBHOOK_ATTEMPTS})`, last.detail);
    }
    if (attempt < WEBHOOK_ATTEMPTS) await sleep(750);
  }
  return last;
}

function noteHtml(lines: string[], tone: "info" | "alert"): string {
  const color = tone === "alert" ? "#9b2c2c" : C.navy;
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:16px 18px;border-left:4px solid ${color};background-color:${C.white};">${lines
      .map((l) => `<p style="margin:0 0 8px 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${C.ink};">${l}</p>`)
      .join("")}</td></tr></table>`,
    "20px 32px 20px 32px",
    C.linen,
  );
}

/** The note above the issue in the team email: what this is, what to do, and the warnings. */
function teamNote(issue: Issue, webhook: StepResult): string[] {
  const lines = [
    `<strong>This is the ${issue.kind === "encore" ? "Encore" : "Tide"} issue for ${esc(issue.period.label)}, built by the website. Nothing has been sent to subscribers.</strong>`,
    `Subject line for subscribers: <strong>${esc(issue.subject)}</strong>`,
  ];
  if (issue.needsEdit && issue.placeholder)
    lines.push(
      issue.kind === "tide"
        ? "Before it goes out, fill in or delete each dashed box. There’s one for the month’s story until it’s written, and one each for a short note from Joelyn and from Jessica, in your own words. The issue says nothing for you that you didn’t write."
        : `Before it goes out, replace the dashed box (“${esc(issue.placeholder)}”).`,
    );
  lines.push(
    webhook.status === "sent"
      ? "It was also sent to the Zap (ISSUE_WEBHOOK_URL), which puts it where you send from."
      : "To send it: upload or paste the attached .html file (or the .txt for plain text) into the send tool, Outlook or the Marketing Center, which adds the unsubscribe link. The issue is also shown below.",
  );
  for (const w of issue.warnings) lines.push(`Check: ${esc(w)}`);
  return lines;
}

/** The issue as files, so it can be uploaded or pasted without copying out of an inbox. */
function issueFiles(issue: Issue): { filename: string; content: Buffer; contentType: string }[] {
  const base = `${issue.kind}-${issue.kind === "tide" ? issue.period.from.slice(0, 7) : issue.period.from}`;
  return [
    { filename: `${base}.html`, content: Buffer.from(issue.html, "utf8"), contentType: "text/html; charset=utf-8" },
    { filename: `${base}.txt`, content: Buffer.from(issue.text, "utf8"), contentType: "text/plain; charset=utf-8" },
  ];
}

/**
 * Fair Housing check, then the team email, then the webhook. Never throws;
 * every outcome comes back in the result, which the route returns as JSON.
 */
export async function handOff(issue: Issue, teamSubject: string, opts: { fetchImpl?: typeof fetch } = {}): Promise<HandoffResult> {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  const fh = checkFairHousing(`${issue.subject}\n${issue.html}\n${issue.text}`);
  const base = { kind: issue.kind, period: issue.period, subject: issue.subject, warnings: issue.warnings };

  const held = !fh.passed ? "the Fair Housing check flagged it" : (issue.hold ?? null);
  if (held) {
    console.error(`[issues] hand-off held: ${held}`, { kind: issue.kind, period: issue.period, flags: fh.passed ? [] : fh.flags });
    const lines = !fh.passed
      ? [
          "<strong>The issue below was not sent to the Zap: the Fair Housing checker flagged it.</strong>",
          ...fh.flags.map((f) => `${esc(f.reason)} (<code>${esc(f.pattern)}</code>)`),
          "The flagged words come from the event or sales data, not the templates. Edit before sending, or skip this issue.",
        ]
      : [`<strong>The issue below was not sent to the Zap: ${esc(held)}.</strong>`, ...issue.warnings.map((w) => `Check: ${esc(w)}`)];
    let teamEmail: StepResult = { status: "skipped", detail: "TEAM_NOTIFY_EMAIL not set" };
    if (to) {
      const res = await sendEmail({
        to,
        subject: `${teamSubject.replace(/: ready to send$/, "")}: held, not ready to send`,
        html: documentHtml({
          title: teamSubject,
          preheader: `Held: ${held}`,
          body: `${column(noteHtml(lines, "alert"))}<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>${issue.bodyHtml}`,
        }),
      });
      teamEmail = res.ok ? (res.id === "dev-noop" ? { status: "skipped", detail: "Resend not configured" } : { status: "sent", detail: res.id }) : { status: "failed", detail: res.error };
    }
    return { ...base, ok: false, fairHousing: fh.passed ? "passed" : "flagged", held, teamEmail, webhook: { status: "skipped", detail: `held: ${held}` } };
  }

  const payload: IssuePayload = {
    kind: issue.kind,
    subject: issue.subject,
    html: issue.html,
    text: issue.text,
    period: issue.period,
    preheader: issue.preheader,
    needsEdit: issue.needsEdit,
    placeholder: issue.placeholder ?? null,
    warnings: issue.warnings,
    generatedAt: new Date().toISOString(),
  };
  const webhook = await postWebhook(payload, opts.fetchImpl ?? fetch);

  let teamEmail: StepResult = { status: "skipped", detail: "TEAM_NOTIFY_EMAIL not set" };
  if (to) {
    // The team's address and nothing else: never a subscriber, never an address from the request.
    const res = await sendEmail({
      to,
      subject: teamSubject,
      attachments: issueFiles(issue),
      html: documentHtml({
        title: teamSubject,
        preheader: issue.preheader,
        body: `${column(noteHtml(teamNote(issue, webhook), "info"))}<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>${issue.bodyHtml}`,
      }),
    });
    teamEmail = res.ok ? (res.id === "dev-noop" ? { status: "skipped", detail: "Resend not configured" } : { status: "sent", detail: res.id }) : { status: "failed", detail: res.error };
  }

  const ok = teamEmail.status === "sent" || webhook.status === "sent";
  return { ...base, ok, fairHousing: "passed", held: null, teamEmail, webhook };
}

/** The JSON a cron run returns. 200 when the issue reached the team one way or another, 422 when it was held, 502 when neither path took it. */
export function handoffResponse(result: HandoffResult): Response {
  const status = result.ok ? 200 : result.held ? 422 : 502;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
