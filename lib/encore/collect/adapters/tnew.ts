import { addDays, isoToLocal } from "../dates";
import { clean } from "../html";
import type { Adapter, Availability, CollectedEvent, CollectedPerformance } from "../types";
import { filterTitles, sha256, str, upcoming } from "../util";

/**
 * Tessitura TNEW (v7): the events page's own JSON endpoint,
 * POST /api/products/productionseasons with a date window, returns every
 * production with its performances, each with isOnSale,
 * hasLimitedSeatingAvailable and a status message ("Sold Out", "Cancelled").
 * No venue in the feed: matching uses the title and dates.
 *
 * config: { base (https://buy.sarasotaorchestra.org), days? (default 450), exclude? }
 */
type TnewPerf = {
  id: number;
  iso8601DateString?: string;
  performanceDate?: string;
  actionUrl?: string;
  isPerformanceVisible?: boolean;
  isOnSale?: boolean;
  hasLimitedSeatingAvailable?: boolean;
  performanceStatusMessage?: string;
  performanceTitle?: string;
  productTypeName?: string;
};
type TnewProduction = {
  productionSeasonId: string;
  productionTitle: string;
  listingImageUrl?: string;
  description?: string;
  productionSeasonActionUrl?: string;
  performances: TnewPerf[];
};

export function tnewAvailability(p: TnewPerf): { availability: Availability; status?: "cancelled" | "postponed" } {
  const msg = (p.performanceStatusMessage ?? "").toLowerCase();
  if (/cancel/.test(msg)) return { availability: "not-on-sale", status: "cancelled" };
  if (/postpone/.test(msg)) return { availability: "not-on-sale", status: "postponed" };
  if (/sold\s*out/.test(msg)) return { availability: "sold-out" };
  // Off sale without a reason: not yet on sale, or closed. Only the message says "sold out".
  if (p.isOnSale === false) return { availability: "not-on-sale" };
  if (p.hasLimitedSeatingAvailable || /limited|few/.test(msg)) return { availability: "few-left" };
  return { availability: "on-sale" };
}

export function tnewToCollected(p: TnewProduction, base: string): CollectedEvent {
  const performances: CollectedPerformance[] = [];
  for (const perf of p.performances) {
    if (perf.isPerformanceVisible === false) continue;
    const at = isoToLocal(perf.iso8601DateString?.replace(/(\.\d+)?([+-]\d{2}:\d{2})$/, "$2") ?? perf.performanceDate);
    if (!at) continue;
    const a = tnewAvailability(perf);
    performances.push({ date: at.date, time: at.time, availability: a.availability, status: a.status, ticketUrl: str(perf.actionUrl) });
  }
  return {
    sourceUrl: p.productionSeasonActionUrl ?? `${base}/${p.productionSeasonId}`,
    externalId: p.productionSeasonId,
    title: clean(p.productionTitle),
    performances,
    complete: true,
    ticketUrl: p.productionSeasonActionUrl ?? `${base}/${p.productionSeasonId}`,
    imageUrl: str(p.listingImageUrl),
    sourceText: clean(p.description ?? "").slice(0, 600),
    categoryHint: p.performances[0]?.productTypeName,
  };
}

export const tnewAdapter: Adapter = {
  name: "tnew",
  kind: "platform",
  async collect(source, ctx) {
    const base = String(source.config.base).replace(/\/$/, "");
    const days = Number(source.config.days ?? 450);
    const body = JSON.stringify({ startDate: `${ctx.today}T00:00`, endDate: `${addDays(ctx.today, days)}T23:59` });
    const res = await ctx.fetch(`${base}/api/products/productionseasons`, {
      method: "POST",
      body,
      accept: "json",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", Origin: base, Referer: `${base}/events` },
    });
    if (!res.ok) throw new Error(`TNEW ${res.status} at ${base}`);
    const data = JSON.parse(res.text) as { productions?: TnewProduction[] };
    const events = (data.productions ?? []).map((p) => tnewToCollected(p, base)).filter((e) => e.performances.length);
    return {
      events: upcoming(filterTitles(events, source.config), ctx.today),
      warnings: [],
      contentHash: sha256(JSON.stringify((data.productions ?? []).map((p) => [p.productionSeasonId, p.productionTitle, p.performances.map((x) => [x.id, x.iso8601DateString, x.isOnSale, x.hasLimitedSeatingAvailable, x.performanceStatusMessage])]))),
    };
  },
};
