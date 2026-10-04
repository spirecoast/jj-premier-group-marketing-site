import type { NextRequest } from "next/server";
import { fill } from "@/lib/issues/copy";
import { C, SANS, SERIF, esc } from "@/lib/issues/render";
import { ISSUE_ACTION_COPY, TEAM_SEND_COPY } from "@/lib/newsletter/copy";
import { performIssueAction, sentDay, viewIssueAction } from "@/lib/newsletter/service";

/**
 * The team email's "Send it now" and "Hold this issue" links
 * (docs/ISSUES.md). `?t=` is a signed token (NEWSLETTER_SECRET) naming the
 * action, the kind and the period, good for three weeks.
 *
 * GET shows what the button will do; only the POST from that button acts.
 * Mail scanners open every link in an email, so a GET that sent or held an
 * issue would do it for them.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title></head>
<body style="margin:0;padding:48px 16px;background:${C.linen};font-family:${SANS};color:${C.ink};">
<main style="max-width:520px;margin:0 auto;padding:32px;background:${C.paper};border:1px solid ${C.rule};">
<h1 style="margin:0 0 16px 0;font-family:${SERIF};font-weight:normal;font-size:28px;line-height:1.25;color:${C.navy};">${esc(title)}</h1>
${body}
</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

const p = (s: string) => `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;">${esc(s)}</p>`;
const plural = (n: number) => (n === 1 ? "subscriber" : "subscribers");

export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t");
  const view = await viewIssueAction(t);
  switch (view.state) {
    case "off":
      return page(ISSUE_ACTION_COPY.sendTitle, p(ISSUE_ACTION_COPY.off));
    case "invalid":
      return page(ISSUE_ACTION_COPY.sendTitle, p(ISSUE_ACTION_COPY.invalid), 404);
    case "missing":
      return page(ISSUE_ACTION_COPY.sendTitle, p(ISSUE_ACTION_COPY.missing), 404);
    case "sent":
      return page(view.label, p(fill(ISSUE_ACTION_COPY.alreadySent, { when: sentDay(view.when) })));
    case "expired":
      return page(view.label, p(ISSUE_ACTION_COPY.expired));
    case "ready": {
      const hold = view.action === "hold";
      const title = hold ? ISSUE_ACTION_COPY.holdTitle : ISSUE_ACTION_COPY.sendTitle;
      const text = hold
        ? fill(ISSUE_ACTION_COPY.holdBody, { issue: view.label })
        : fill(ISSUE_ACTION_COPY.sendBody, { issue: view.label, count: view.recipients, subscribers: plural(view.recipients) });
      const note = view.status === "held" && hold ? p(TEAM_SEND_COPY.held) : "";
      const color = hold ? C.amber : C.navy;
      const form = `<form method="post" action="/api/newsletter/issue?t=${encodeURIComponent(t ?? "")}">
<button type="submit" style="padding:14px 26px;font-family:${SANS};font-size:16px;font-weight:bold;color:${C.white};background:${color};border:0;border-radius:2px;cursor:pointer;">${esc(hold ? ISSUE_ACTION_COPY.holdButton : ISSUE_ACTION_COPY.sendButton)}</button>
</form>`;
      return page(title, `${p(text)}${note}${form}`);
    }
  }
}

export async function POST(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t");
  try {
    const result = await performIssueAction(t);
    console.info("[newsletter] issue link", result.ok ? "done" : "refused", result.message, result.run ?? "");
    return page(result.action === "hold" ? ISSUE_ACTION_COPY.holdTitle : ISSUE_ACTION_COPY.sendTitle, p(result.message), result.ok ? 200 : 409);
  } catch (err) {
    console.error("[newsletter] issue link failed", err);
    return page(ISSUE_ACTION_COPY.sendTitle, p(fill(ISSUE_ACTION_COPY.refused, { reason: err instanceof Error ? err.message : String(err) })), 500);
  }
}
