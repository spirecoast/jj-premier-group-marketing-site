import type { NextRequest } from "next/server";
import { runRoute } from "@/lib/encore/ops";
import { monitoredCron } from "@/lib/ops/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Encore's weekly refresh (vercel.json, early Sunday UTC, before the Monday
 * issue): every source that is due, a few hosts at a time, each reconciled
 * on its own (lib/encore/collect/run.ts), then the images waiting. Known
 * events update themselves; new ones go to encore_review_queue.
 *
 * `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron) or `Bearer
 * ${ENCORE_COLLECT_SECRET}` (by hand). A run stops starting new work about a
 * minute before maxDuration, says what is left in `remaining` and
 * `remainingImages`, and calls itself again (up to eight times) until both
 * are 0. `?only=id,id` runs those sources whether due or not.
 *
 * Each run is logged, kept in ops_runs and alerted on when it fails or a
 * source keeps failing (lib/ops/cron.ts).
 */
export const GET = monitoredCron((request: NextRequest) => runRoute(request, "collect", maxDuration));
export const POST = GET;
