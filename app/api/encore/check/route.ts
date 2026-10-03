import type { NextRequest } from "next/server";
import { runRoute } from "@/lib/encore/ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Encore's daily check (vercel.json, early morning): the sources with
 * performances in the next 21 days, read again for status (on sale, few
 * left, sold out, cancelled, postponed) and price only. Every reading is
 * kept in encore_checks and feeds the "From the venue" panel's "Checked …".
 * With time to spare it finishes any weekly work still due.
 *
 * Same secrets as /api/encore/collect. `?cursor=<source id>` resumes a
 * check that ran out of time (the route passes it on when it calls itself).
 */
export async function GET(request: NextRequest) {
  return runRoute(request, "check", maxDuration);
}
export const POST = GET;
