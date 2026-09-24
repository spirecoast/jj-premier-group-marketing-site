import { NextResponse, type NextRequest } from "next/server";
import { isSanityConfigured } from "@/sanity/env";
import { staleEventIdsQuery } from "@/sanity/lib/queries";
import { getWriteClient } from "@/sanity/lib/write-client";

export const dynamic = "force-dynamic";

/**
 * Weekly archive of calendar events whose end is more than twelve months past.
 * Required at launch: the free-tier document cap counts drafts and system
 * records, and an unbounded calendar is what would eventually breach it.
 *
 * Vercel Cron calls this with `Authorization: Bearer ${CRON_SECRET}`.
 */
function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!isSanityConfigured()) {
    return NextResponse.json({ skipped: "sanity not configured", deleted: 0 });
  }
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 12);

  try {
    const client = getWriteClient();
    // Raw perspective so never-published drafts are included; normalise to the published id.
    const raw = await client.fetch<string[]>(staleEventIdsQuery, { cutoff: cutoff.toISOString() }, { perspective: "raw" });
    const ids = [...new Set(raw.map((id) => id.replace(/^drafts\./, "")))];
    if (!ids.length) {
      return NextResponse.json({ deleted: 0, cutoff: cutoff.toISOString() });
    }
    // Published documents and their drafts, in batches well under the mutation limit.
    const BATCH = 100;
    let deleted = 0;
    for (let i = 0; i < ids.length; i += BATCH) {
      let tx = client.transaction();
      for (const id of ids.slice(i, i + BATCH)) {
        tx = tx.delete(id).delete(`drafts.${id}`);
      }
      await tx.commit({ visibility: "async" });
      deleted += Math.min(BATCH, ids.length - i);
    }
    console.info(`[archive-events] deleted ${deleted} events older than ${cutoff.toISOString()}`);
    return NextResponse.json({ deleted, cutoff: cutoff.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[archive-events] failed", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
