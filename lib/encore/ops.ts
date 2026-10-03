import "server-only";
import { timingSafeEqual } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { supabaseSink } from "./collect/images";
import { runCollector, type RunResult } from "./collect/run";
import { pgStore } from "./store/pg";
import type { EncoreStore } from "./store/store";

/**
 * Shared by the Encore routes under app/api/encore: the secret check (the
 * same as /api/search/reindex: Vercel Cron's `Bearer ${CRON_SECRET}`, or
 * `Bearer ${ENCORE_COLLECT_SECRET}` by hand), the store, the image sink, and
 * the hand-off to the next invocation when a run ran out of time.
 */

export function authorised(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header);
  return [process.env.ENCORE_COLLECT_SECRET, process.env.CRON_SECRET]
    .filter((s): s is string => Boolean(s))
    .some((secret) => {
      const want = Buffer.from(`Bearer ${secret}`);
      return want.length === given.length && timingSafeEqual(want, given);
    });
}

export const unauthorised = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export function encoreStore(): EncoreStore {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return pgStore(getDb());
}

export function encoreImageSink() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? supabaseSink({ url, serviceKey: key }) : null;
}

/** Pages that show Encore data: rebuilt on their next request. */
export function refreshPages() {
  for (const p of ["/calendar", "/calendar/[slug]", "/venues/[slug]", "/api/encore/index", "/", "/sarasota", "/bradenton", "/lakewood-ranch"]) {
    try {
      revalidatePath(p, p.includes("[") ? "page" : undefined);
    } catch {
      /* outside a request scope in scripts */
    }
  }
}

/** How many times one cron run may hand itself on (each hand-off is a fresh 300s invocation). */
const MAX_CHAIN = 8;

/**
 * Run the collector in a route and, when it ran out of time with work left,
 * call the same route again after responding, so a weekly run finishes
 * without anyone watching. A dropped hand-off is not lost: due sources are
 * still due on the next daily run.
 */
export async function runRoute(request: NextRequest, mode: "collect" | "check", maxDuration: number): Promise<Response> {
  if (!authorised(request)) return unauthorised();
  const started = Date.now();
  const sp = request.nextUrl.searchParams;
  const chain = Number(sp.get("chain") ?? 0);
  const only = sp.get("only")?.split(",").filter(Boolean);
  const deadline = started + (maxDuration - 75) * 1000;
  const log = (m: string) => console.info(`[encore/${mode}] ${m}`);
  try {
    const store = encoreStore();
    await seedIfEmpty(store, log);
    const runId = await store.startRun(mode);
    const result: RunResult = await runCollector({ store, mode, deadline, images: mode === "collect" ? encoreImageSink() : null, only, cursor: sp.get("cursor") ?? undefined, log });
    let followUp: RunResult | null = null;
    // A daily check with time to spare finishes whatever the weekly run left due, and its images.
    if (mode === "check" && !result.remaining && Date.now() < deadline - 30_000) {
      followUp = await runCollector({ store, mode: "collect", deadline, images: encoreImageSink(), log });
    }
    await store.finishRun(runId, { sources: result.processed.length, remaining: result.remaining, stats: { ...summary(result), followUp: followUp ? summary(followUp) : null } });
    refreshPages();
    const left = result.remaining + result.remainingImages + (followUp ? followUp.remaining + followUp.remainingImages : 0);
    if (left > 0 && chain < MAX_CHAIN && !only) {
      const next = new URL(request.nextUrl.pathname, request.nextUrl.origin);
      next.searchParams.set("chain", String(chain + 1));
      if (mode === "check" && result.cursor) next.searchParams.set("cursor", result.cursor);
      const auth = request.headers.get("authorization") ?? "";
      after(async () => {
        // Fire and move on: the next invocation runs on its own once the request is in.
        await fetch(next, { method: "POST", headers: { authorization: auth }, signal: AbortSignal.timeout(8000) }).catch(() => undefined);
      });
    }
    const failed = result.processed.filter((p) => !p.ok);
    return NextResponse.json({ ...summary(result), followUp: followUp ? summary(followUp) : null, chain, seconds: Math.round((Date.now() - started) / 1000) }, { status: failed.length ? 207 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[encore/${mode}] failed`, message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

/**
 * An empty calendar would make every event the collector finds look new and
 * fill the review queue; the first run loads the bundled dataset instead.
 */
export async function seedIfEmpty(store: EncoreStore, log: (m: string) => void) {
  const snap = await store.load();
  if (snap.events.length) return;
  const [{ default: data }, { SOURCES, sourceForUrl }] = await Promise.all([import("@/lib/content/encore/encore-calendar.json"), import("./collect/sources")]);
  const counts = await store.seed(data as unknown as Parameters<EncoreStore["seed"]>[0], SOURCES, (e) => (sourceForUrl(e.sources[0]) ?? sourceForUrl(e.ticketUrl))?.id);
  log(`empty calendar: seeded ${JSON.stringify(counts)}`);
}

function summary(r: RunResult) {
  return {
    mode: r.mode,
    processed: r.processed.length,
    failed: r.processed.filter((p) => !p.ok).map((p) => ({ id: p.id, error: p.error })),
    sources: r.processed,
    remaining: r.remaining,
    remainingImages: r.remainingImages,
    images: r.images,
    requests: r.requests,
    cursor: r.cursor,
  };
}
