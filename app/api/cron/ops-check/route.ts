import { NextResponse, type NextRequest } from "next/server";
import { bearerMatches } from "@/lib/bearer";
import { checkOpenSends } from "@/lib/newsletter/service";
import { opsAlert } from "@/lib/ops/alert";
import { monitoredCron, sentryCheckIn } from "@/lib/ops/cron";
import { CRON_JOBS, HEARTBEAT_MONITOR, RETENTION_JOB, describeSchedule, jobForPath, type JobStanding } from "@/lib/ops/jobs";
import { opsSnapshot } from "@/lib/ops/snapshot";
import { clearAlerts } from "@/lib/ops/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The daily ops check (vercel.json, 07:53 UTC, after the nightly purge and
 * Encore's check). It looks for what fails without a sound:
 *
 *   - a scheduled job that has stopped running (its last ops_runs row is
 *     older than its schedule allows), or never ran;
 *   - the nightly purge of old personal data (pg_cron) not running;
 *   - the site database not answering;
 *   - a newsletter send that has stalled, or won't reach everyone before
 *     it expires at the daily cap.
 *
 * Each finding is emailed once a week while it lasts (lib/ops/alert.ts).
 * A failed run of a job is alerted by the job itself (lib/ops/cron.ts), not
 * here. With NEXT_PUBLIC_SENTRY_DSN set this check is also the one Sentry
 * Crons monitor ("site-crons"): if it stops checking in, Sentry says so.
 *
 * `Authorization: Bearer ${CRON_SECRET}`. Answers what it found as JSON.
 */

const STALE_STATES = new Set<JobStanding["state"]>(["stale", "never"]);

function staleAlert(s: JobStanding, retentionError: string | null): Parameters<typeof opsAlert>[0] {
  const since = s.lastRunAt
    ? `hasn't run since ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(s.lastRunAt))}`
    : "has never run";
  if (s.slug === RETENTION_JOB.slug) {
    return {
      key: `stale:${s.slug}`,
      subject: `the nightly clean-up of old personal data ${since}`,
      lines: [
        `retention_purge(), the job in Supabase that clears and deletes old form and newsletter records, ${since}. It's meant to run every night at 07:17 UTC, and the privacy page's retention periods depend on it.`,
        "In Supabase → SQL Editor, `select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'retention-purge') order by start_time desc limit 5;` shows its runs and any error. Migrations 0009 and 0016 set it up (docs/SITE.md, \"Personal data retention\").",
      ],
      detail: retentionError ?? undefined,
    };
  }
  const job = CRON_JOBS.find((j) => j.slug === s.slug);
  return {
    key: `stale:${s.slug}`,
    subject: `${s.slug} ${since}`,
    lines: [
      `The scheduled job ${s.slug}${job ? ` (${job.path})` : ""} ${since}. It's meant to run ${job ? describeSchedule(job.schedule) : "on a schedule"}, so whatever it does has stopped happening.`,
      "Check Vercel → Settings → Cron Jobs (is it listed and enabled?), that CRON_SECRET is set in Production, and Vercel → Logs for the path above.",
    ],
  };
}

async function run(request: NextRequest): Promise<Response> {
  if (!bearerMatches(request.headers.get("authorization"), [process.env.CRON_SECRET])) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const self = jobForPath(request.nextUrl.pathname);
  const open = await sentryCheckIn(HEARTBEAT_MONITOR, "in_progress", { schedule: self?.schedule, maxRuntimeMinutes: 5 });
  const now = new Date();
  const snapshot = await opsSnapshot(now);
  const problems: string[] = [];

  if (!snapshot.db.ok && process.env.DATABASE_URL) {
    await opsAlert({
      key: "db-unreachable",
      subject: "the site database didn't answer",
      lines: [
        "The daily check couldn't reach the site database (DATABASE_URL, Supabase). Forms still email the team, but nothing is being saved, and the jobs that need the database are failing.",
        "Check the project in Supabase (paused, out of space, or a changed password) and Vercel → Logs.",
      ],
      detail: snapshot.db.error,
    });
    problems.push("db-unreachable");
  }

  for (const s of snapshot.jobs) {
    if (s.slug === self?.slug) continue;
    if (STALE_STATES.has(s.state)) {
      await opsAlert(staleAlert(s, snapshot.retentionError));
      problems.push(`stale:${s.slug}`);
    } else if (s.state !== "waiting") {
      await clearAlerts(`stale:${s.slug}`);
    }
  }

  problems.push(...(await checkOpenSends(now)));

  console.info(`[ops-check] ${JSON.stringify({ problems, jobs: snapshot.jobs.map((j) => `${j.slug}=${j.state}`) })}`);
  await sentryCheckIn(HEARTBEAT_MONITOR, problems.length ? "error" : "ok", { open });
  return NextResponse.json({ ok: true, problems, ...snapshot }, { headers: { "Cache-Control": "no-store" } });
}

const monitored = monitoredCron(run);
export const GET = monitored;
export const POST = monitored;
