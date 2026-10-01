import type { NextRequest } from "next/server";
import { cronAllowed, handOff, handoffResponse, notFound, previewAllowed, previewResponse } from "@/lib/issues/handoff";
import { issueToday, loadTideIssue } from "@/lib/issues/load";
import { isDay } from "@/lib/issues/render";
import { tideTeamSubject } from "@/lib/issues/tide-monthly";

/**
 * The monthly Tide issue (docs/ISSUES.md).
 *
 * GET  ?secret=<ISSUE_PREVIEW_SECRET>[&date=YYYY-MM-DD | &month=YYYY-MM][&format=text]
 *      The preview: the issue for the latest month complete in all three
 *      markets as of `date` (default today, America/New_York), or for
 *      `month`, as HTML or plain text. 404 without the secret.
 * GET  or POST with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends a
 *      GET on the 1st; a manual re-run can POST with `?month=`)
 *      Builds the issue, emails it to TEAM_NOTIFY_EMAIL and POSTs it to
 *      ISSUE_WEBHOOK_URL when set. A month that isn't complete is held from
 *      the webhook. Returns the hand-off status as JSON.
 *
 * Nothing here sends to a subscriber or to any address but the team's.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function args(request: NextRequest): [string, string | undefined] {
  const sp = request.nextUrl.searchParams;
  const d = sp.get("date");
  const m = sp.get("month");
  return [isDay(d) ? d : issueToday(), m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : undefined];
}

const noData = () => Response.json({ ok: false, message: "No county sales data has been ingested (docs/SALES-DATA.md)." }, { status: 503, headers: { "Cache-Control": "no-store" } });

async function run(request: NextRequest): Promise<Response> {
  const issue = await loadTideIssue(...args(request));
  if (!issue) return noData();
  const result = await handOff(issue, tideTeamSubject(issue));
  console.info(`[issues] tide ${issue.month}: team email ${result.teamEmail.status}, webhook ${result.webhook.status}`);
  return handoffResponse(result);
}

export async function GET(request: NextRequest) {
  if (cronAllowed(request)) return run(request);
  if (!previewAllowed(request)) return notFound();
  const issue = await loadTideIssue(...args(request));
  if (!issue) return noData();
  return previewResponse(issue, request);
}

export async function POST(request: NextRequest) {
  if (!cronAllowed(request)) return Response.json({ message: "Unauthorized" }, { status: 401 });
  return run(request);
}
