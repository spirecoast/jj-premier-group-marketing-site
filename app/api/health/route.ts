import { NextResponse } from "next/server";
import { getLeadSinks, hasLeadSink } from "@/lib/lead-sinks";

/**
 * GET /api/health — which lead sinks this deployment has configured.
 * Names and booleans only; no values, no secrets. `ok` is false when a
 * production deployment would accept a form and keep nothing.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const sinks = getLeadSinks();
  const ok = hasLeadSink(sinks);
  return NextResponse.json(
    {
      ok,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      sinks,
      now: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
