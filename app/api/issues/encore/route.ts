import type { NextRequest } from "next/server";
import { encoreTeamSubject } from "@/lib/issues/encore-weekly";
import { cronAllowed, handOff, handoffResponse, notFound, previewAllowed, previewResponse } from "@/lib/issues/handoff";
import { issueToday, loadEncoreIssue } from "@/lib/issues/load";
import { isDay } from "@/lib/issues/render";
import { loadEncoreSnapshot } from "@/lib/encore/live";

/**
 * The Monday Encore issue (docs/ISSUES.md).
 *
 * GET  ?secret=<ISSUE_PREVIEW_SECRET>[&date=YYYY-MM-DD][&format=text]
 *      The preview: the issue for the week on or after `date` (default today,
 *      America/New_York) as HTML, or plain text. 404 without the secret.
 * GET  or POST with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends a
 *      GET; a manual re-run can POST, with `?date=` for another week)
 *      Builds the issue, emails it to TEAM_NOTIFY_EMAIL and POSTs it to
 *      ISSUE_WEBHOOK_URL when set. Returns the hand-off status as JSON.
 *
 * Nothing here sends to a subscriber or to any address but the team's.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function day(request: NextRequest): string {
  const d = request.nextUrl.searchParams.get("date");
  return isDay(d) ? d : issueToday();
}

async function run(request: NextRequest): Promise<Response> {
  // loadEncoreIssue reads the index synchronously; load the database snapshot first.
  await loadEncoreSnapshot();
  const issue = await loadEncoreIssue(day(request));
  const result = await handOff(issue, encoreTeamSubject(issue));
  console.info(`[issues] encore ${issue.period.from}: team email ${result.teamEmail.status}, webhook ${result.webhook.status}`);
  return handoffResponse(result);
}

export async function GET(request: NextRequest) {
  if (cronAllowed(request)) return run(request);
  if (!previewAllowed(request)) return notFound();
  await loadEncoreSnapshot();
  return previewResponse(await loadEncoreIssue(day(request)), request);
}

export async function POST(request: NextRequest) {
  if (!cronAllowed(request)) return Response.json({ message: "Unauthorized" }, { status: 401 });
  return run(request);
}
