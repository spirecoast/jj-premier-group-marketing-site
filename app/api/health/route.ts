import { NextResponse } from "next/server";
import { getLeadSinks, hasLeadSink } from "@/lib/lead-sinks";

/**
 * GET /api/health — which lead sinks this deployment has configured, and
 * what the newsletter hand-off (docs/ISSUES.md) has to work with.
 * Names and booleans only; no values, no secrets. `ok` is false when a
 * production deployment would accept a form and keep nothing; the issues
 * block never changes it.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const sinks = getLeadSinks();
  const ok = hasLeadSink(sinks);
  return NextResponse.json(
    {
      ok,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      sinks,
      issues: {
        previewSecret: Boolean(process.env.ISSUE_PREVIEW_SECRET),
        webhook: Boolean(process.env.ISSUE_WEBHOOK_URL),
        teamEmail: Boolean(process.env.TEAM_NOTIFY_EMAIL),
        resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        cronSecret: Boolean(process.env.CRON_SECRET),
      },
      now: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
