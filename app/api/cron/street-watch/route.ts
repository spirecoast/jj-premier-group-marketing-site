import { NextResponse, type NextRequest } from "next/server";
import { monitoredCron } from "@/lib/ops/cron";
import { runWatchDigests } from "@/lib/watch/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Street Watch's daily run (lib/watch/service.ts): once a sales refresh is
 * merged and deployed, one digest per address with the sales the county
 * recorded since the refresh before (data/sales/new-sales.json.gz), for
 * every confirmed watch that has any; at most one a week per address, under
 * the newsletter's daily cap. Re-runs never send twice. Also tidies the
 * watch tables (lib/watch/store.ts). Does nothing until subscriber email is
 * configured, and nothing on a preview.
 *
 * Vercel Cron calls this with `Authorization: Bearer ${CRON_SECRET}`. Each run
 * is logged, kept in ops_runs and alerted on when it fails (lib/ops/cron.ts).
 */
function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const result = await runWatchDigests();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

const monitored = monitoredCron(run);
export const GET = monitored;
export const POST = monitored;
