import { NextResponse, type NextRequest } from "next/server";
import { cronAllowed } from "@/lib/issues/handoff";
import { dispatchDue } from "@/lib/newsletter/service";

/**
 * The sends to subscribers (docs/ISSUES.md), run by Vercel Cron:
 *
 *   /api/newsletter/send/encore   Mondays 12:00 UTC, two hours after the team preview
 *   /api/newsletter/send/tide     the 3rd, 13:00 UTC (9am in Sarasota in daylight time)
 *   /api/newsletter/send/all      every day 13:30 UTC: carries on any send the daily cap cut short
 *
 * GET (Vercel Cron) or POST, with `Authorization: Bearer <CRON_SECRET>`.
 * Sends every due issue of that kind that isn't held, to its confirmed
 * subscribers, in batches of 100 under NEWSLETTER_DAILY_CAP. Safe to re-run:
 * nobody gets an issue twice. Returns JSON with what each send did.
 * With subscriber email off it does nothing and says so.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS = ["tide", "encore", "all"] as const;
type Kind = (typeof KINDS)[number];

async function run(request: NextRequest, params: Promise<{ kind: string }>): Promise<Response> {
  if (!cronAllowed(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { kind } = await params;
  if (!(KINDS as readonly string[]).includes(kind)) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const k = kind as Kind;
  try {
    const result = await dispatchDue(k === "all" ? undefined : k);
    console.info(`[newsletter] send/${k}: ${result.enabled ? `${result.runs.length} send(s) looked at` : "off"}`, result.runs.map((r) => `${r.kind} ${r.period} ${r.decision} sent=${r.sentThisRun} deferred=${r.deferred}`));
    return NextResponse.json(result, { status: result.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[newsletter] send/${k} failed`, message);
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export function GET(request: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  return run(request, ctx.params);
}

export function POST(request: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  return run(request, ctx.params);
}
