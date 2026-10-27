import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { CRON_JOBS, RETENTION_JOB, standing, type JobStanding } from "./jobs";
import { latestRuns, opsDbAvailable, watchingSince } from "./store";

/**
 * How the site's background work stands, read from the database: each
 * scheduled job's latest run (ops_runs), the nightly purge (ops_runs, with
 * pg_cron's own record of a failure), the Encore review queue and today's
 * Google Places calls. For /api/cron/ops-check and /api/health?deep=1.
 * Names, counts and times only; nothing about any person. Never throws.
 */

export type OpsSnapshot = {
  db: { ok: boolean; ms: number | null; error?: string };
  jobs: JobStanding[];
  /** pg_cron's last failure of the purge, when it failed and can be read. */
  retentionError: string | null;
  encoreReviewQueue: number | null;
  placesToday: Record<string, number> | null;
};

async function count<T>(query: ReturnType<typeof sql>, pick: (rows: T[]) => number | Record<string, number>): Promise<ReturnType<typeof pick> | null> {
  try {
    return pick((await getDb().execute(query)) as unknown as T[]);
  } catch {
    return null;
  }
}

/** The last failed purge pg_cron recorded, if it's the latest run. Needs the cron schema (Supabase grants it to postgres). */
async function retentionFailure(): Promise<string | null> {
  try {
    const rows = (await getDb().execute(sql`
      SELECT status, return_message, start_time FROM cron.job_run_details
       WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'retention-purge')
       ORDER BY start_time DESC LIMIT 1
    `)) as unknown as { status: string; return_message: string | null; start_time: string | Date }[];
    const last = rows[0];
    return last && last.status === "failed" ? `${new Date(last.start_time).toISOString()}: ${(last.return_message ?? "failed").slice(0, 500)}` : null;
  } catch {
    return null;
  }
}

export async function opsSnapshot(now = new Date()): Promise<OpsSnapshot> {
  if (!opsDbAvailable()) return { db: { ok: false, ms: null, error: "DATABASE_URL not set" }, jobs: [], retentionError: null, encoreReviewQueue: null, placesToday: null };
  const started = Date.now();
  let db: OpsSnapshot["db"];
  try {
    await getDb().execute(sql`select 1`);
    db = { ok: true, ms: Date.now() - started };
  } catch (err) {
    return { db: { ok: false, ms: Date.now() - started, error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, jobs: [], retentionError: null, encoreReviewQueue: null, placesToday: null };
  }
  const [runs, since, retentionError] = await Promise.all([latestRuns(), watchingSince(), retentionFailure()]);
  const jobs = [...CRON_JOBS, RETENTION_JOB].map((job) => {
    const last = runs.get(job.slug);
    return standing(job, last ? { outcome: last.outcome, startedAt: last.startedAt } : null, now, since);
  });
  const encoreReviewQueue = (await count<{ n: number }>(sql`select count(*)::int as n from encore_review_queue where status = 'pending'`, (r) => r[0]?.n ?? 0)) as number | null;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const placesToday = (await count<{ sku: string; calls: number }>(sql`select sku, calls from places_usage where day = ${day}::date`, (r) => Object.fromEntries(r.map((x) => [x.sku, x.calls])))) as Record<string, number> | null;
  return { db, jobs, retentionError, encoreReviewQueue, placesToday };
}
