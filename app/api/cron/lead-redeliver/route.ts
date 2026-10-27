import { NextResponse, type NextRequest } from "next/server";
import { pruneGuard } from "@/lib/lead-guard";
import { redeliverDue } from "@/lib/lead-outbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The lead outbox's daily sweep (lib/lead-outbox.ts): every CRM webhook or
 * team email that failed and is due another try, oldest first, then the
 * guard's housekeeping (lib/lead-guard.ts). The same sweep also runs after
 * every new lead; this run catches the quiet days. Vercel's Hobby plan allows
 * one cron run a day; on Pro, `*\/10 * * * *` in vercel.json makes it every
 * ten minutes.
 *
 * Vercel Cron calls this with `Authorization: Bearer ${CRON_SECRET}`.
 */
function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let tried = 0;
  let skipped: string | undefined;
  // A few rounds of 10, inside the minute this route has.
  for (let round = 0; round < 5; round += 1) {
    const r = await redeliverDue(10);
    tried += r.tried;
    skipped = r.skipped;
    if (r.tried < 10) break;
  }
  await pruneGuard();
  console.info(`[lead-redeliver] tried ${tried}${skipped ? ` (${skipped})` : ""}`);
  return NextResponse.json({ tried, ...(skipped ? { skipped } : {}) });
}

export const GET = run;
export const POST = run;
