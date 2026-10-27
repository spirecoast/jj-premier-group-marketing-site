import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { bearerMatches } from "@/lib/bearer";
import { sideEffectsAllowed } from "@/lib/deploy-env";
import { opsAlert } from "./alert";
import { compactSummary, jobForPath, jobSlug, judge, monitorEveryJob, problemsToReport, type Job, type Verdict } from "./jobs";
import { clearAlerts, previousRun, recordRun } from "./store";

/**
 * Every scheduled job's route handler goes through monitoredCron. A call
 * with one of the job secrets is a run, and every run, good or bad:
 *
 *   1. writes one structured log line, `[cron] {"job":…,"outcome":…}`;
 *   2. is kept in ops_runs (migration 0016), which /api/cron/ops-check reads
 *      to notice a job that stopped running, and /api/health?deep=1 shows;
 *   3. when it failed, emails LEAD_ALERT_EMAIL through lib/ops/alert.ts (and
 *      reports to Sentry when NEXT_PUBLIC_SENTRY_DSN is set). A run where
 *      only some parts failed (a venue's page, a search source) is emailed
 *      once the same part fails twice in a row; a good run clears the slate.
 *
 * On a preview deployment a run is refused before it starts: previews share
 * production's database, so a job run there would change production's data.
 * Calls without a job secret pass straight to the handler, which answers
 * 401 or serves its own preview (the newsletter routes' ?secret= preview).
 */

type Handler<C> = (request: NextRequest, ctx: C) => Promise<Response> | Response;

const jobSecrets = () => [process.env.CRON_SECRET, process.env.ENCORE_COLLECT_SECRET, process.env.SEARCH_REINDEX_SECRET];

/** Statuses that mean the call wasn't a run at all (wrong secret for that route, unknown path). */
const NOT_A_RUN = new Set([401, 403, 404]);

type SentryCheckIn = { checkInId: string; startedAt: number } | null;

/** A Sentry Crons check-in, when NEXT_PUBLIC_SENTRY_DSN is set. Never throws. */
export async function sentryCheckIn(
  slug: string,
  status: "in_progress" | "ok" | "error",
  opts: { schedule?: string; maxRuntimeMinutes?: number; open?: SentryCheckIn } = {},
): Promise<SentryCheckIn> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
  try {
    const Sentry = await import("@sentry/nextjs");
    if (status === "in_progress") {
      const checkInId = Sentry.captureCheckIn(
        { monitorSlug: slug, status },
        opts.schedule
          ? { schedule: { type: "crontab", value: opts.schedule }, timezone: "Etc/UTC", checkinMargin: 30, maxRuntime: opts.maxRuntimeMinutes ?? 10, failureIssueThreshold: 1, recoveryThreshold: 1 }
          : undefined,
      );
      return { checkInId, startedAt: Date.now() };
    }
    if (opts.open) Sentry.captureCheckIn({ monitorSlug: slug, status, checkInId: opts.open.checkInId, duration: (Date.now() - opts.open.startedAt) / 1000 });
    else Sentry.captureCheckIn({ monitorSlug: slug, status });
    await Sentry.flush(2000);
  } catch {
    // reporting never breaks the job
  }
  return null;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  if (!(response.headers.get("content-type") ?? "").includes("json")) return null;
  try {
    const body: unknown = await response.clone().json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function alertFor(job: Pick<Job, "slug" | "path">, verdict: Verdict, report: string[], status: number, detail: string): Parameters<typeof opsAlert>[0] {
  const what = `The scheduled job ${job.slug} (${job.path}) ${verdict.headline}.`;
  const next =
    verdict.outcome === "partial"
      ? "The rest of the run went through. The same part failed on the run before too, so it's worth a look: Vercel → Logs, filtered on the path above, shows each run."
      : "Nothing from this run was kept. It runs again at its next scheduled time; Vercel → Logs, filtered on the path above, shows what went wrong. A run can also be started by hand with the job's secret (docs/SITE.md, \"Scheduled jobs and alerts\").";
  return {
    key: `cron:${job.slug}:${report.join(",")}`,
    subject: `${job.slug} ${verdict.outcome === "partial" ? "is partly failing" : `failed (HTTP ${status})`}`,
    lines: [what, next],
    detail,
  };
}

export function monitoredCron<C>(handler: Handler<C>): Handler<C> {
  return async (request, ctx) => {
    if (!bearerMatches(request.headers.get("authorization"), jobSecrets())) return handler(request, ctx);
    if (!sideEffectsAllowed()) {
      return NextResponse.json(
        { ok: false, message: "Scheduled jobs run on the production deployment only. Previews share its database, so they don't run them." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    const path = request.nextUrl.pathname.replace(/\/+$/, "");
    const job: Pick<Job, "slug" | "path" | "schedule"> = jobForPath(path) ?? { slug: jobSlug(path), path, schedule: "" };
    // Encore's long runs hand themselves on (?chain=N); the hand-ons are the same run, so Sentry hears about the first only.
    const continuation = Number(request.nextUrl.searchParams.get("chain") ?? 0) > 0;
    const startedAt = new Date();
    const open = monitorEveryJob && !continuation && job.schedule ? await sentryCheckIn(job.slug, "in_progress", { schedule: job.schedule }) : null;

    let response: Response;
    let thrown: string | null = null;
    try {
      response = await handler(request, ctx);
    } catch (err) {
      thrown = err instanceof Error ? err.message : String(err);
      response = NextResponse.json({ ok: false, message: thrown }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
    if (NOT_A_RUN.has(response.status)) return response;

    try {
      const body = await readJson(response);
      const verdict = judge(response.status, body);
      const finishedAt = new Date();
      const ms = finishedAt.getTime() - startedAt.getTime();
      const line = `[cron] ${JSON.stringify({ job: job.slug, outcome: verdict.outcome, http: response.status, ms, ...(continuation ? { continuation: true } : {}), ...(verdict.outcome === "ok" ? {} : { headline: verdict.headline }) })}`;
      if (verdict.outcome === "ok" || verdict.outcome === "held") console.info(line);
      else console.error(line);

      const previous = await previousRun(job.slug);
      const summary = { ...(compactSummary(body) ?? {}), problems: verdict.problems, ...(continuation ? { continuation: true } : {}) };
      const error = verdict.outcome === "failed" ? (thrown ?? verdict.headline).slice(0, 1000) : null;
      await recordRun({ job: job.slug, outcome: verdict.outcome, httpStatus: response.status, startedAt, finishedAt, summary, error });
      if (open) await sentryCheckIn(job.slug, verdict.outcome === "failed" || verdict.outcome === "partial" ? "error" : "ok", { open });

      if (verdict.outcome === "ok") {
        await clearAlerts(`cron:${job.slug}:`);
      } else {
        const previousProblems = Array.isArray(previous?.summary?.problems) ? (previous.summary.problems as string[]) : null;
        const report = problemsToReport(verdict, previousProblems);
        if (report.length) {
          const detail = JSON.stringify(compactSummary(body) ?? { status: response.status, error: thrown }, null, 2).slice(0, 4000);
          await opsAlert(alertFor({ slug: job.slug, path: job.path }, verdict, report, response.status, detail));
        }
      }
    } catch (err) {
      console.error("[cron] couldn't record the run", err instanceof Error ? err.message : err);
    }
    return response;
  };
}
