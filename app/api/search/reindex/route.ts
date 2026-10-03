import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runReindex } from "@/lib/search/run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** The first full index embeds every chunk; later runs only what changed. */
export const maxDuration = 300;

/**
 * Rebuild the search index (lib/search). Called daily by Vercel Cron
 * (vercel.json, `Authorization: Bearer ${CRON_SECRET}`) and by hand with
 * `Authorization: Bearer ${SEARCH_REINDEX_SECRET}`. Either secret works.
 *
 * A run stops starting new work about a minute before maxDuration and says
 * how many chunks are left in `remaining`; call it again until that's 0.
 * `?force=1` lets deletes through even when the run has under half the rows
 * already stored.
 */
function authorised(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header);
  return [process.env.SEARCH_REINDEX_SECRET, process.env.CRON_SECRET]
    .filter((s): s is string => Boolean(s))
    .some((secret) => {
      const want = Buffer.from(`Bearer ${secret}`);
      return want.length === given.length && timingSafeEqual(want, given);
    });
}

async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const started = Date.now();
  const force = request.nextUrl.searchParams.get("force") === "1";
  try {
    const result = await runReindex({
      deadline: started + (maxDuration - 60) * 1000,
      force,
      log: (m) => console.info(`[search/reindex] ${m}`),
    });
    return NextResponse.json(result, { status: result.sourceErrors.length ? 207 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[search/reindex] failed", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
