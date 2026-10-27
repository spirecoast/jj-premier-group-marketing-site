import { NextResponse, type NextRequest } from "next/server";
import { bearerMatches } from "@/lib/bearer";
import { getLeadSinks, hasLeadSink } from "@/lib/lead-sinks";
import { newsletterConfig } from "@/lib/newsletter/config";
import { placesEnabled } from "@/lib/places/google";

/**
 * GET /api/health — which lead sinks this deployment has configured, what
 * the newsletter hand-off (docs/ISSUES.md) has to work with, and whether the
 * site sends to subscribers (and if not, the variable names it's missing).
 * Names and booleans only; no values, no secrets. `ok` is false when a
 * production deployment would accept a form and keep nothing; the issues
 * block never changes it.
 *
 * Anyone (an uptime monitor) gets the status alone: `{ ok }`, 200 or 503.
 * The detail, which says which defences are off, needs
 * `Authorization: Bearer` with CRON_SECRET, ENCORE_COLLECT_SECRET or
 * LEAD_TEST_SECRET, except on a local dev server.
 */

export const dynamic = "force-dynamic";

function detailAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return bearerMatches(request.headers.get("authorization"), [
    process.env.CRON_SECRET,
    process.env.ENCORE_COLLECT_SECRET,
    process.env.LEAD_TEST_SECRET,
  ]);
}

export async function GET(request: NextRequest) {
  const sinks = getLeadSinks();
  const ok = hasLeadSink(sinks);
  if (!detailAllowed(request)) {
    return NextResponse.json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }
  const newsletter = newsletterConfig();
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
      newsletter: {
        subscriberEmail: newsletter.enabled,
        missing: newsletter.missing,
        replyTo: Boolean(newsletter.replyTo),
        dailyCap: newsletter.dailyCap,
      },
      // Google Places: the Planner's Nearby lists and Atlas Move's help with the move.
      places: placesEnabled(),
      // Sentry error reports (lib/sentry/options.ts).
      sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      now: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
