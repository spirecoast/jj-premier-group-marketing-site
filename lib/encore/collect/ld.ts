import { eachDay, isoToLocal } from "./dates";
import { clean, ldImage, typeIs } from "./html";
import type { Availability, CollectedEvent, CollectedPerformance, PerfStatus } from "./types";
import { num, str } from "./util";

/** schema.org Event (and its subtypes) to a CollectedEvent. */

const EVENT_TYPES = ["Event", "MusicEvent", "TheaterEvent", "DanceEvent", "ComedyEvent", "ExhibitionEvent", "Festival", "VisualArtsEvent", "ScreeningEvent", "EducationEvent", "ChildrensEvent", "LiteraryEvent", "SocialEvent"];

export function isLdEvent(o: Record<string, unknown>): boolean {
  return typeIs(o, ...EVENT_TYPES) && !typeIs(o, "EventSeries") ? Boolean(o.startDate) : false;
}

export function ldAvailability(v: unknown): Availability | undefined {
  const s = String(v ?? "");
  if (/SoldOut/i.test(s)) return "sold-out";
  if (/LimitedAvailability/i.test(s)) return "few-left";
  if (/InStock|OnlineOnly|InStoreOnly/i.test(s)) return "on-sale";
  if (/PreOrder|PreSale|OutOfStock|Discontinued/i.test(s)) return "not-on-sale";
  return undefined;
}

export function ldStatus(v: unknown): PerfStatus | undefined {
  const s = String(v ?? "");
  if (/Cancelled/i.test(s)) return "cancelled";
  if (/Postponed/i.test(s)) return "postponed";
  if (/Scheduled|Rescheduled|MovedOnline/i.test(s)) return "scheduled";
  return undefined;
}

function offersOf(o: Record<string, unknown>): Record<string, unknown>[] {
  const off = o.offers;
  if (!off) return [];
  const list = Array.isArray(off) ? off : [off];
  return list.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object");
}

function nameOf(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return clean(v) || undefined;
  if (Array.isArray(v)) return nameOf(v[0]);
  if (typeof v === "object") return str(clean(String((v as Record<string, unknown>).name ?? "")));
  return undefined;
}

export function ldEventToCollected(o: Record<string, unknown>, pageUrl: string): CollectedEvent | null {
  const title = nameOf(o.name);
  const start = isoToLocal(str(o.startDate));
  if (!title || !start) return null;
  const end = isoToLocal(str(o.endDate));
  const offers = offersOf(o);
  const prices = offers.flatMap((x) => [num(x.price), num(x.lowPrice), num(x.highPrice)]).filter((n): n is number => n !== undefined);
  const priceMin = prices.length ? Math.min(...prices) : undefined;
  const priceMax = prices.length ? Math.max(...prices) : undefined;
  const availability = offers.map((x) => ldAvailability(x.availability)).find(Boolean);
  const status = ldStatus(o.eventStatus);
  const ticketUrl = offers.map((x) => str(x.url)).find(Boolean);
  const perf = (date: string, time: string): CollectedPerformance => ({
    date,
    time,
    status,
    availability,
    priceMin,
    priceMax,
    currency: str(offers[0]?.priceCurrency),
  });
  const base: CollectedEvent = {
    sourceUrl: str(o.url) ?? pageUrl,
    title,
    presenter: nameOf(o.organizer),
    venueName: nameOf(o.location),
    performances: [],
    complete: false,
    priceMin,
    priceMax,
    ticketUrl,
    status: availability === "sold-out" ? "sold-out" : status,
    imageUrl: ldImage(o.image, pageUrl),
    sourceText: clean(String(o.description ?? "")).slice(0, 600),
  };
  if (end && end.date > start.date) {
    const days = eachDay(start.date, end.date, 15);
    // A festival open a few days running: one date each day (the start time is the first day's;
    // later days often open earlier, so they carry none). Anything longer, or not a festival, is a run.
    const festival = typeIs(o, "Festival") || days.length <= 3;
    if (start.time && festival && days.length <= 4 && days[days.length - 1] === end.date) return { ...base, performances: days.map((d, i) => perf(d, i === 0 ? start.time : "")) };
    return { ...base, startDate: start.date, endDate: end.date };
  }
  return { ...base, performances: [perf(start.date, start.time)] };
}
