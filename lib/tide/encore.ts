import type { EncoreIndex } from "../encore/index-format";
import type { MarketSlug } from "../issues/render";
import { MARKET_ORDER } from "../issues/render";

/**
 * "Out this month" on a Tide issue: a few things on the Encore calendar in
 * the issue month, one per market where the calendar has one. Pure: the
 * live index (lib/encore/data.ts `loadEncoreIndex`) comes in, slugs and the
 * performance to show come out; the page looks each event up for its card.
 *
 * Per market, the first dated performance in the month that isn't sold out,
 * leaning to an event with its own picture, each from a different venue and,
 * where the calendar allows, on a different day, so the three spread out.
 * A market with nothing that month gives its place to the next performance
 * elsewhere, so the section still has three when the calendar does.
 */
export type EncorePick = { slug: string; market: MarketSlug; at: { startsAt: string; endsAt?: string; allDay?: boolean } };

export function encorePicks(index: EncoreIndex, month: string, n = 3, today?: string): EncorePick[] {
  const from = today && today.slice(0, 7) === month ? today : `${month}-01`;
  const candidates = index.perfs
    .filter((p) => p[1].slice(0, 7) === month && p[1] >= from)
    .map((p) => ({ perf: p, event: index.events[p[0]]! }))
    .filter(({ event }) => !event.so && !event.x)
    .sort((a, b) => Number(Boolean(b.event.img)) - Number(Boolean(a.event.img)) || a.perf[3] - b.perf[3]);
  const picked: { perf: (typeof candidates)[number]["perf"]; event: (typeof candidates)[number]["event"] }[] = [];
  const take = (c: (typeof candidates)[number] | undefined) => {
    if (c) picked.push(c);
  };
  const free = (c: (typeof candidates)[number], spread: boolean) =>
    !picked.some((p) => p.event.s === c.event.s || p.event.v === c.event.v || (spread && p.perf[1] === c.perf[1]));
  for (const m of MARKET_ORDER) take(candidates.find((c) => c.event.m === m && free(c, true)) ?? candidates.find((c) => c.event.m === m && free(c, false)));
  while (picked.length < n) {
    const next = candidates.find((c) => free(c, true)) ?? candidates.find((c) => free(c, false));
    if (!next) break;
    take(next);
  }
  return picked.slice(0, n).map(({ perf, event }) => ({
    slug: event.s,
    market: event.m,
    at: { startsAt: new Date(perf[3]).toISOString(), ...(perf[4] !== perf[3] ? { endsAt: new Date(perf[4]).toISOString() } : {}), ...(perf[2] === "" ? { allDay: true } : {}) },
  }));
}
