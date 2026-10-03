import { NextResponse, type NextRequest } from "next/server";
import data from "@/lib/content/encore/encore-calendar.json";
import type { DatasetEvent, DatasetVenue } from "@/lib/encore/collect/known";
import { SOURCES, sourceForUrl } from "@/lib/encore/collect/sources";
import { authorised, encoreStore, refreshPages, unauthorised } from "@/lib/encore/ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Load the hand-collected dataset (lib/content/encore/encore-calendar.json)
 * into the encore_* tables, the same as `scripts/encore-collect.ts seed`,
 * for when only Vercel can reach the database. Adds what is missing and
 * changes nothing that is already stored, so it is safe to run again.
 * POST with the collector's secret.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) return unauthorised();
  try {
    const store = encoreStore();
    const runId = await store.startRun("seed");
    const counts = await store.seed(data as unknown as { venues: DatasetVenue[]; events: DatasetEvent[] }, SOURCES, (e) => (sourceForUrl(e.sources[0]) ?? sourceForUrl(e.ticketUrl))?.id);
    await store.finishRun(runId, { sources: counts.sources, stats: counts });
    refreshPages();
    return NextResponse.json(counts);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
