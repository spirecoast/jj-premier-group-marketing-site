import { seasonClock, type Perf, type Run } from "@/lib/art/encore";
import { getEncoreIndex, localDay } from "@/lib/encore/data";
import { addDays, occurrences } from "@/lib/encore/select";
import { SeasonRing } from "./season-ring";

/**
 * Encore's portrait on the page: the season clock (lib/art/encore.ts), the
 * season ahead as a full ring, from today to the last performance in the
 * index (at most a year), with every performance as a stroke at its day and
 * every exhibition as an arc inside, computed on the server from the same
 * index the calendar runs on. Closing the ring at the season's last date
 * keeps it whole: a fixed 365 days left an empty quarter where the dataset's
 * season ends. One 3:2 drawing, shown whole in the 2:1 box where the cards
 * stack.
 */
export const ENCORE_BOX = { width: 600, height: 400, shift: 0 } as const;

const dayNumber = (d: string) => Math.round(Date.parse(`${d}T12:00:00Z`) / 86_400_000);

export function EncoreCard() {
  const index = getEncoreIndex();
  const now = Date.now();
  const today = localDay(now);
  const found = occurrences(index, today, addDays(today, 364), {}, now);
  const perfs: Perf[] = found.map((o) => ({ day: o.day, category: o.e.c }));
  const last = found.reduce((m, o) => (o.day > m ? o.day : m), today);
  const days = Math.min(365, Math.max(90, dayNumber(last) - dayNumber(today) + 1));
  const runs = index.events.flatMap((e): Run[] => (e.x && e.f && e.r ? [{ from: e.f, to: e.r, category: e.c }] : []));
  return <SeasonRing g={seasonClock(perfs, runs, { ...ENCORE_BOX, today, days })} id="ec" className="card-img" />;
}
