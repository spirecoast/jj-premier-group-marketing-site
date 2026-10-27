import { addDays, todayLocal } from "./collect/dates";
import type { ImageSink } from "./collect/images";
import type { EncoreStore, PruneResult } from "./store/store";

/**
 * Keeping the encore_* tables the size of the calendar, not of its history.
 * Run once a week, at the start of the Sunday collect (lib/encore/ops.ts),
 * so it is watched like that job and needs nothing scheduled in the
 * database:
 *
 * - dates more than 13 months past (a year of "last season" for the
 *   collector to match against, plus a month);
 * - status and price readings (encore_checks) older than 90 days;
 * - productions with no dates left whose run ended more than 13 months ago,
 *   with their image rows, and their image files in the bucket.
 *
 * Pages read only from five weeks back (lib/encore/live.ts), so none of
 * this was on a page.
 */

export const PRUNE_DAYS = 396;
export const CHECKS_DAYS = 90;

export function pruneCutoffs(now: Date): { before: string; checksBefore: Date } {
  return { before: addDays(todayLocal(now.getTime()), -PRUNE_DAYS), checksBefore: new Date(now.getTime() - CHECKS_DAYS * 86_400_000) };
}

export async function pruneEncore(store: EncoreStore, images: ImageSink | null, now = new Date()): Promise<(PruneResult & { imagesRemoved: number }) | null> {
  if (!store.prune) return null;
  const result = await store.prune(pruneCutoffs(now));
  let imagesRemoved = 0;
  if (images?.remove) {
    for (let i = 0; i < result.imagePaths.length; i += 100) {
      const part = result.imagePaths.slice(i, i + 100);
      // A file that stays behind costs a little storage and nothing else.
      await images.remove(part).then(
        () => (imagesRemoved += part.length),
        (err: unknown) => console.warn(`[encore/prune] image files not removed: ${err instanceof Error ? err.message : String(err)}`),
      );
    }
  }
  return { ...result, imagesRemoved };
}
