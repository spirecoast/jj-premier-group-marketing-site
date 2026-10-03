import { clean } from "../html";
import type { Adapter, Availability, CollectedEvent, CollectedPerformance } from "../types";
import { filterTitles, sha256, str, upcoming } from "../util";

/**
 * OvationTix (AudienceView Professional) public calendar JSON, the one its
 * own ticket pages read: web.ovationtix.com/trs/api/rest/CalendarProductions
 * with a `clientId` header lists every upcoming showtime with isSoldOut and
 * isCancelled. On a weekly run each production's detail
 * (Production(id)/performance) adds the venue and the production image.
 *
 * config: { clientId, exclude?, details? (default true on collect runs) }
 */
const API = "https://web.ovationtix.com/trs/api/rest";

type Showtime = {
  productionId: number;
  performanceId: number;
  performanceStartTime: string;
  performanceAvailable?: boolean;
  isVisible?: boolean;
  isCancelled?: boolean;
  isSoldOut?: boolean;
  shutOff?: boolean;
};
type CalendarDay = { date: string; productions: { productionId: number; name: string; supertitle?: string; logoFile?: string; showtimes: Showtime[]; hidden?: boolean }[] };
type Detail = { venue?: { name?: string }; logoUrl?: string; productionName?: string };

export function showtimeAvailability(s: Showtime): { availability: Availability; status?: "cancelled" } {
  if (s.isCancelled) return { availability: "not-on-sale", status: "cancelled" };
  if (s.isSoldOut) return { availability: "sold-out" };
  if (s.performanceAvailable === false || s.shutOff) return { availability: "not-on-sale" };
  return { availability: "on-sale" };
}

export function calendarToCollected(days: CalendarDay[], clientId: string): CollectedEvent[] {
  const by = new Map<number, CollectedEvent>();
  for (const day of days) {
    for (const p of day.productions) {
      if (p.hidden) continue;
      let e = by.get(p.productionId);
      if (!e) {
        e = {
          sourceUrl: `https://ci.ovationtix.com/${clientId}/production/${p.productionId}`,
          externalId: String(p.productionId),
          title: clean(p.name || p.supertitle || ""),
          performances: [],
          complete: true,
          ticketUrl: `https://ci.ovationtix.com/${clientId}/production/${p.productionId}`,
          imageUrl: p.logoFile ? `${API}/ClientFile(${p.logoFile})` : undefined,
        };
        by.set(p.productionId, e);
      }
      for (const s of p.showtimes) {
        if (s.isVisible === false) continue;
        const [date, time] = s.performanceStartTime.split(" ") as [string, string | undefined];
        const a = showtimeAvailability(s);
        const perf: CollectedPerformance = {
          date,
          time: (time ?? "").slice(0, 5),
          availability: a.availability,
          status: a.status,
          ticketUrl: `https://ci.ovationtix.com/${clientId}/performance/${s.performanceId}`,
        };
        e.performances.push(perf);
      }
    }
  }
  return [...by.values()].filter((e) => e.title && e.performances.length);
}

export const ovationtixAdapter: Adapter = {
  name: "ovationtix",
  kind: "platform",
  async collect(source, ctx) {
    const clientId = String(source.config.clientId);
    const headers = { clientId, newCIRequest: "true", Referer: `https://ci.ovationtix.com/${clientId}` };
    const res = await ctx.fetch(`${API}/CalendarProductions`, { accept: "json", headers });
    if (!res.ok) throw new Error(`OvationTix ${res.status} for client ${clientId}`);
    const days = JSON.parse(res.text) as CalendarDay[];
    let events = filterTitles(calendarToCollected(days, clientId), source.config);
    const warnings: string[] = [];
    if (ctx.mode === "collect" && source.config.details !== false) {
      for (const e of events) {
        if (ctx.deadline && Date.now() > ctx.deadline) break;
        const d = await ctx.fetch(`${API}/Production(${e.externalId})/performance?`, { accept: "json", headers }).catch(() => null);
        if (!d?.ok) {
          warnings.push(`production ${e.externalId}: detail ${d?.status ?? "failed"}`);
          continue;
        }
        const detail = JSON.parse(d.text) as Detail;
        e.venueName = str(detail.venue?.name);
        if (detail.logoUrl) e.imageUrl = `${API}${detail.logoUrl}`;
      }
    }
    events = upcoming(events, ctx.today);
    return {
      events,
      warnings,
      contentHash: sha256(JSON.stringify(days.map((d) => d.productions.map((p) => [p.productionId, p.showtimes.map((s) => [s.performanceId, s.isSoldOut, s.isCancelled, s.performanceAvailable])])))),
    };
  },
};
