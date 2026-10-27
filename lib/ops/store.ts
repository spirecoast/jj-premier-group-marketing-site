import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import type { Outcome } from "./jobs";

/**
 * ops_runs and ops_alerts (migration 0016), in raw SQL. Every call fails
 * soft: without DATABASE_URL, or before 0016 is applied, writes are skipped
 * (one log line says which file to apply) and reads come back empty, so a
 * cron never fails because its bookkeeping couldn't be kept.
 */

const MIGRATION = "0016_ops_and_retention.sql";

function soft(table: string, err: unknown): void {
  if (isMissingTable(err)) warnMissingTable(table, MIGRATION);
  else console.error(`[ops] ${table}:`, err instanceof Error ? err.message : err);
}

export const opsDbAvailable = (): boolean => Boolean(process.env.DATABASE_URL);

export type RunRecord = {
  job: string;
  outcome: Outcome;
  httpStatus: number | null;
  startedAt: Date;
  finishedAt: Date;
  summary: Record<string, unknown> | null;
  error: string | null;
};

export async function recordRun(run: RunRecord): Promise<void> {
  if (!opsDbAvailable()) return;
  try {
    await getDb().execute(sql`
      INSERT INTO ops_runs (job, outcome, http_status, started_at, finished_at, summary, error)
      VALUES (${run.job}, ${run.outcome}, ${run.httpStatus}, ${run.startedAt.toISOString()}::timestamptz,
              ${run.finishedAt.toISOString()}::timestamptz, ${run.summary ? JSON.stringify(run.summary) : null}::jsonb, ${run.error})
    `);
  } catch (err) {
    soft("ops_runs", err);
  }
}

export type LastRun = { job: string; outcome: Outcome; httpStatus: number | null; startedAt: Date; summary: Record<string, unknown> | null; error: string | null };

type LastRunRow = { job: string; outcome: Outcome; http_status: number | null; started_at: string | Date; summary: Record<string, unknown> | null; error: string | null };

const toLastRun = (r: LastRunRow): LastRun => ({ job: r.job, outcome: r.outcome, httpStatus: r.http_status, startedAt: new Date(r.started_at), summary: r.summary, error: r.error });

/** The latest run of each job. Empty when the table isn't there. */
export async function latestRuns(): Promise<Map<string, LastRun>> {
  const out = new Map<string, LastRun>();
  if (!opsDbAvailable()) return out;
  try {
    const rows = (await getDb().execute(sql`
      SELECT DISTINCT ON (job) job, outcome, http_status, started_at, summary, error
        FROM ops_runs ORDER BY job, started_at DESC
    `)) as unknown as LastRunRow[];
    for (const r of rows) out.set(r.job, toLastRun(r));
  } catch (err) {
    soft("ops_runs", err);
  }
  return out;
}

/** The run of `job` before the one about to be recorded. */
export async function previousRun(job: string): Promise<LastRun | null> {
  if (!opsDbAvailable()) return null;
  try {
    const rows = (await getDb().execute(sql`
      SELECT job, outcome, http_status, started_at, summary, error FROM ops_runs
       WHERE job = ${job} ORDER BY started_at DESC LIMIT 1
    `)) as unknown as LastRunRow[];
    return rows[0] ? toLastRun(rows[0]) : null;
  } catch (err) {
    soft("ops_runs", err);
    return null;
  }
}

/** When the ops records start: before then, a job with no runs isn't overdue. */
export async function watchingSince(): Promise<Date | null> {
  if (!opsDbAvailable()) return null;
  try {
    const rows = (await getDb().execute(sql`SELECT min(started_at) AS since FROM ops_runs`)) as unknown as { since: string | Date | null }[];
    return rows[0]?.since ? new Date(rows[0].since) : null;
  } catch (err) {
    soft("ops_runs", err);
    return null;
  }
}

/**
 * Claims the right to email about `key`: true when it was never sent, or
 * last sent more than `repeatAfterDays` ago (and records the send). When the
 * table can't be used it answers true: an extra email beats a silent failure.
 */
export async function claimAlert(key: string, repeatAfterDays: number): Promise<boolean> {
  if (!opsDbAvailable()) return true;
  try {
    const rows = (await getDb().execute(sql`
      INSERT INTO ops_alerts (key) VALUES (${key})
      ON CONFLICT (key) DO UPDATE SET last_sent_at = now(), times = ops_alerts.times + 1
       WHERE ops_alerts.last_sent_at < now() - make_interval(days => ${repeatAfterDays})
      RETURNING key
    `)) as unknown as { key: string }[];
    return rows.length > 0;
  } catch (err) {
    soft("ops_alerts", err);
    return true;
  }
}

/** Forgets the alerts under `prefix`, so the problem is emailed again if it comes back. */
export async function clearAlerts(prefix: string): Promise<void> {
  if (!opsDbAvailable()) return;
  try {
    await getDb().execute(sql`DELETE FROM ops_alerts WHERE starts_with(key, ${prefix})`);
  } catch (err) {
    soft("ops_alerts", err);
  }
}

/** Undoes a claim whose email didn't go, so the next run tries again. */
export async function releaseAlert(key: string): Promise<void> {
  if (!opsDbAvailable()) return;
  try {
    await getDb().execute(sql`DELETE FROM ops_alerts WHERE key = ${key}`);
  } catch (err) {
    soft("ops_alerts", err);
  }
}
