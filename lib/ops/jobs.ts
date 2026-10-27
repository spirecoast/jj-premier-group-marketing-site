import vercel from "../../vercel.json";

/**
 * The scheduled jobs, read from vercel.json so there is one list, and the
 * pure rules for judging a run. Used by lib/ops/cron.ts (every cron route),
 * /api/cron/ops-check and /api/health?deep=1.
 */

export type Job = {
  /** "encore-check" for /api/encore/check; "archive-events" for /api/cron/archive-events. */
  slug: string;
  path: string;
  /** Vercel's cron expression, UTC. */
  schedule: string;
  /** The longest a healthy job goes between two runs, plus slack: past this it has stopped. */
  maxGapHours: number;
};

/** The nightly purge inside Postgres (pg_cron, migration 0009), which writes its own ops_runs row (0016). */
export const RETENTION_JOB: Job = { slug: "retention-purge", path: "pg_cron", schedule: "17 7 * * *", maxGapHours: 26 };

/** The one Sentry Crons monitor: the daily ops check's heartbeat. See monitorEveryJob below. */
export const HEARTBEAT_MONITOR = "site-crons";

/**
 * One Sentry monitor for every job (true), or just the heartbeat (false).
 * Sentry's free plan includes one cron monitor and charges for more, so the
 * site checks in once a day from the ops check, which itself watches every
 * job; a failed run of any job is still reported to Sentry as an error. Turn
 * this on only once the Sentry plan has room for a monitor per job.
 */
export const monitorEveryJob = false;

/** "/api/encore/check" → "encore-check". */
export function jobSlug(path: string): string {
  return path
    .replace(/\/+$/, "")
    .replace(/^\/?api\//, "")
    .replace(/^cron\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

const parseField = (field: string, min: number, max: number): number[] | null => {
  if (field === "*") return null;
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText ? Number(stepText) : 1;
    const [a, b] = range === "*" ? [min, max] : range!.split("-").map(Number);
    const from = a!;
    const to = b ?? (stepText ? max : from);
    for (let v = from; v <= to; v += step) out.add(v === 7 && max === 6 ? 0 : v);
  }
  return [...out].sort((x, y) => x - y);
};

/**
 * The longest gap between two runs of a five-field cron expression, in hours,
 * plus two hours of slack. Days of the month win over days of the week when
 * both are set (Vercel's crons use one or the other).
 */
export function maxGapHours(schedule: string): number {
  const [, , dom, , dow] = schedule.trim().split(/\s+/);
  const slack = 2;
  const days = parseField(dom ?? "*", 1, 31);
  if (days) {
    // The worst case is the gap across the end of a 31-day month.
    if (days.length === 1) return 31 * 24 + slack;
    const gaps = days.map((d, i) => (i + 1 < days.length ? days[i + 1]! - d : 31 - d + days[0]!));
    return Math.max(...gaps) * 24 + slack;
  }
  const weekdays = parseField(dow ?? "*", 0, 6);
  if (weekdays && weekdays.length) {
    const gaps = weekdays.map((d, i) => (i + 1 < weekdays.length ? weekdays[i + 1]! - d : 7 - d + weekdays[0]!));
    return Math.max(...gaps) * 24 + slack;
  }
  return 24 + slack;
}

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** "every day at 07:41 UTC", "Mondays at 10:00 UTC", "on the 3rd of each month at 13:00 UTC". */
export function describeSchedule(schedule: string): string {
  const [min, hour, dom, , dow] = schedule.trim().split(/\s+/);
  const time = /^\d+$/.test(hour ?? "") && /^\d+$/.test(min ?? "") ? ` at ${hour!.padStart(2, "0")}:${min!.padStart(2, "0")} UTC` : "";
  if (dom && dom !== "*" && /^\d+$/.test(dom)) return `on the ${ordinal(Number(dom))} of each month${time}`;
  if (dow && dow !== "*" && /^\d$/.test(dow)) return `${DAY_NAMES[Number(dow) % 7]}${time}`;
  if ((dom ?? "*") === "*" && (dow ?? "*") === "*") return `every day${time}`;
  return `on the schedule "${schedule}"`;
}

export function jobsFrom(crons: { path: string; schedule: string }[]): Job[] {
  return crons.map((c) => ({ slug: jobSlug(c.path), path: c.path, schedule: c.schedule, maxGapHours: maxGapHours(c.schedule) }));
}

/** Every Vercel cron in vercel.json. */
export const CRON_JOBS: Job[] = jobsFrom(vercel.crons);

export function jobForPath(path: string): Job | null {
  const slug = jobSlug(path);
  return CRON_JOBS.find((j) => j.slug === slug) ?? null;
}

/* ---- Judging a run ------------------------------------------------------- */

export type Outcome = "ok" | "held" | "partial" | "failed";

export type Verdict = {
  outcome: Outcome;
  /**
   * Stable names for what went wrong ("source:asolo-rep", "http-500"), so
   * the same problem is emailed once and a new one is emailed straight away.
   */
  problems: string[];
  /** One line a person can read. */
  headline: string;
};

type Body = Record<string, unknown> | null;

const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * What a cron route's answer means. 2xx is a good run; 207 is a run where
 * some parts failed (Encore sources, search sources); 422 with `held` is a
 * newsletter hand-off kept back on purpose, which the team has already been
 * emailed about; anything else is a failed run.
 */
export function judge(status: number, body: Body): Verdict {
  if (status === 207) {
    const failed = asList(body?.failed).map((f) => (f && typeof f === "object" && "id" in f ? String((f as { id: unknown }).id) : String(f)));
    const followUp = body?.followUp && typeof body.followUp === "object" ? asList((body.followUp as Body)?.failed) : [];
    for (const f of followUp) failed.push(f && typeof f === "object" && "id" in f ? String((f as { id: unknown }).id) : String(f));
    const sourceErrors = asList(body?.sourceErrors).map((e) => String(e).split(":")[0]!.trim());
    const names = [...new Set([...failed, ...sourceErrors].filter(Boolean))].sort();
    return {
      outcome: "partial",
      problems: names.length ? names.map((n) => `source:${n}`) : ["partial"],
      headline: names.length ? `finished, but ${names.length === 1 ? "one source" : `${names.length} sources`} failed: ${names.join(", ")}` : "finished with some parts failing",
    };
  }
  if (status === 422 && body?.held) return { outcome: "held", problems: [], headline: `held: ${String(body.held)}` };
  if (status >= 200 && status < 300) return { outcome: "ok", problems: [], headline: "ok" };
  const message = typeof body?.message === "string" ? body.message : typeof body?.error === "string" ? body.error : "";
  return { outcome: "failed", problems: [`http-${status}`], headline: `failed with HTTP ${status}${message ? `: ${message.slice(0, 200)}` : ""}` };
}

/**
 * A partial failure is emailed once the same problem shows on two runs in a
 * row, so one flaky fetch doesn't wake anyone; a failed run is emailed at
 * once. Returns the problems worth an email now.
 */
export function problemsToReport(verdict: Verdict, previousProblems: string[] | null): string[] {
  if (verdict.outcome === "failed") return verdict.problems;
  if (verdict.outcome !== "partial") return [];
  const before = new Set(previousProblems ?? []);
  return verdict.problems.filter((p) => before.has(p));
}

/**
 * The answer, cut down for ops_runs: top-level numbers, strings and
 * booleans, and arrays of at most 20 short items. Never a whole issue body.
 */
export function compactSummary(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (k === "html" || k === "text") continue;
    if (v === null || typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 300);
    else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20).map((item) => {
        if (item === null || typeof item !== "object") return typeof item === "string" ? item.slice(0, 200) : item;
        const small: Record<string, unknown> = {};
        for (const [ik, iv] of Object.entries(item as Record<string, unknown>)) {
          if (iv === null || typeof iv === "number" || typeof iv === "boolean") small[ik] = iv;
          else if (typeof iv === "string") small[ik] = iv.slice(0, 200);
        }
        return small;
      });
      if (v.length > 20) out[`${k}Count`] = v.length;
    }
  }
  return out;
}

/** How a job stands from its latest run, for the ops check and the health detail. */
export type JobStanding = { slug: string; state: "ok" | "held" | "partial" | "failed" | "stale" | "never" | "waiting"; lastRunAt: string | null; hoursSince: number | null };

export function standing(job: Pick<Job, "slug" | "maxGapHours">, last: { outcome: Outcome; startedAt: Date } | null, now: Date, watchingSince: Date | null): JobStanding {
  if (!last) {
    // Before the first run there's nothing to judge, unless the ops records have been kept longer than the job's gap.
    const overdue = watchingSince ? (now.getTime() - watchingSince.getTime()) / 3_600_000 > job.maxGapHours : false;
    return { slug: job.slug, state: overdue ? "never" : "waiting", lastRunAt: null, hoursSince: null };
  }
  const hours = (now.getTime() - last.startedAt.getTime()) / 3_600_000;
  const state = hours > job.maxGapHours ? "stale" : last.outcome;
  return { slug: job.slug, state, lastRunAt: last.startedAt.toISOString(), hoursSince: Math.round(hours * 10) / 10 };
}
