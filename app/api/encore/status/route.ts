import { NextResponse, type NextRequest } from "next/server";
import { addDays, todayLocal } from "@/lib/encore/collect/dates";
import { effectiveSources } from "@/lib/encore/collect/run";
import { authorised, encoreStore, unauthorised } from "@/lib/encore/ops";
import { isDue } from "@/lib/encore/store/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Encore's health, for people: every source with its adapter, when it last
 * read cleanly, its last error and what it found; the review queue's size
 * by kind; the last runs; counts of events, upcoming performances and
 * images. Same secrets as /api/encore/collect. `?queue=1` adds the pending
 * review items themselves.
 */
export async function GET(request: NextRequest) {
  if (!authorised(request)) return unauthorised();
  try {
    const store = encoreStore();
    const now = new Date();
    const today = todayLocal(now.getTime());
    const [states, snap, pending, runs] = await Promise.all([store.sources(), store.load(), store.review("pending", 5000), store.lastRuns(12)]);
    const sources = effectiveSources(states).map((s) => ({
      id: s.id,
      domain: s.domain,
      adapter: s.adapter,
      frequency: s.frequency,
      enabled: s.enabled !== false,
      due: s.state ? isDue({ ...s.state, enabled: s.enabled !== false, frequency: s.frequency }, now) : true,
      lastRunAt: s.state?.lastRunAt ?? null,
      lastOkAt: s.state?.lastOkAt ?? null,
      lastError: s.state?.lastError ?? null,
      lastErrorAt: s.state?.lastErrorAt ?? null,
      failures: s.state?.failures ?? 0,
      eventsFound: s.state?.eventsFound ?? null,
      performancesFound: s.state?.performancesFound ?? null,
      matched: s.state?.matched ?? null,
      queued: s.state?.queued ?? null,
      warnings: s.state?.warnings ?? [],
      config: s.config,
    }));
    const live = snap.events.filter((e) => !e.hidden && e.status !== "announced");
    const upcoming = live.flatMap((e) => e.performances.filter((p) => p.date >= today && p.status !== "removed"));
    const soon = upcoming.filter((p) => p.date <= addDays(today, 21));
    const byKind: Record<string, number> = {};
    for (const q of pending) byKind[q.kind] = (byKind[q.kind] ?? 0) + 1;
    const automated = sources.filter((s) => s.adapter !== "manual");
    return NextResponse.json({
      now: now.toISOString(),
      summary: {
        sources: automated.length,
        healthy: automated.filter((s) => s.lastOkAt && !(s.lastErrorAt && s.lastErrorAt > s.lastOkAt)).length,
        failing: automated.filter((s) => s.lastErrorAt && (!s.lastOkAt || s.lastErrorAt > s.lastOkAt)).map((s) => s.id),
        neverRun: automated.filter((s) => !s.lastRunAt).map((s) => s.id),
        due: automated.filter((s) => s.due).length,
        manual: sources.length - automated.length,
      },
      counts: {
        events: live.length,
        hidden: snap.events.filter((e) => e.hidden).length,
        upcomingPerformances: upcoming.length,
        next21Days: soon.length,
        checkedNext21Days: soon.filter((p) => p.checkedAt).length,
        cancelledOrPostponed: upcoming.filter((p) => p.status === "cancelled" || p.status === "postponed").length,
        soldOut: upcoming.filter((p) => p.availability === "sold-out").length,
        images: snap.images.filter((i) => i.publicUrl && !i.hidden).length,
        imagesHidden: snap.images.filter((i) => i.hidden).length,
        imagesFailed: snap.images.filter((i) => i.error).length,
      },
      reviewQueue: { pending: pending.length, byKind },
      queue: request.nextUrl.searchParams.get("queue") === "1" ? pending : undefined,
      runs,
      sources,
    });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
