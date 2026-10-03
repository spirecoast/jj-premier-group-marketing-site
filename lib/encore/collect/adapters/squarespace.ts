import { localParts } from "../dates";
import { clean } from "../html";
import type { Adapter, CollectedEvent } from "../types";
import { filterTitles, groupEvents, sha256, str, upcoming } from "../util";

/**
 * Squarespace events collections: `<collection>?format=json` lists the
 * upcoming items with start and end as epoch milliseconds.
 * config: { collections: string[] (full URLs), exclude? }
 */
type SqItem = {
  id?: string;
  title: string;
  startDate: number;
  endDate?: number;
  fullUrl: string;
  assetUrl?: string;
  excerpt?: string;
  body?: string;
  categories?: string[];
  location?: { addressTitle?: string };
};

export function squarespaceToCollected(item: SqItem, origin: string): CollectedEvent {
  const start = localParts(item.startDate);
  const end = item.endDate ? localParts(item.endDate) : start;
  const base: CollectedEvent = {
    sourceUrl: new URL(item.fullUrl, origin).toString(),
    externalId: item.id,
    title: clean(item.title),
    venueName: str(item.location?.addressTitle),
    performances: [],
    complete: true,
    imageUrl: str(item.assetUrl),
    sourceText: clean(item.excerpt || item.body || "").slice(0, 600),
    categoryHint: item.categories?.join(", "),
  };
  // A span of more than three days with no single show time is a run (an exhibition).
  if (end.date > start.date && Date.parse(end.date) - Date.parse(start.date) > 3 * 86_400_000) return { ...base, startDate: start.date, endDate: end.date };
  return { ...base, performances: [{ date: start.date, time: start.time }] };
}

export const squarespaceAdapter: Adapter = {
  name: "squarespace",
  kind: "generic",
  async collect(source, ctx) {
    const events: CollectedEvent[] = [];
    const warnings: string[] = [];
    let hash = "";
    for (const url of (source.config.collections as string[] | undefined) ?? []) {
      const u = new URL(url);
      u.searchParams.set("format", "json");
      const res = await ctx.fetch(u.toString(), { accept: "json" });
      if (!res.ok || !res.text.trim().startsWith("{")) {
        warnings.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const body = JSON.parse(res.text) as { upcoming?: SqItem[] };
      hash += JSON.stringify((body.upcoming ?? []).map((i) => [i.title, i.startDate, i.fullUrl]));
      for (const item of body.upcoming ?? []) events.push(squarespaceToCollected(item, u.origin));
    }
    if (!events.length && warnings.length) throw new Error(warnings.join("; "));
    return { events: upcoming(groupEvents(filterTitles(events, source.config)), ctx.today), warnings, contentHash: sha256(hash) };
  },
};
