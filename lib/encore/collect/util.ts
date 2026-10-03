import { createHash } from "node:crypto";
import type { CollectedEvent, CollectedPerformance } from "./types";

export const sha256 = (s: string | Uint8Array) => createHash("sha256").update(s).digest("hex");

/** Lowercase, accents and punctuation off, "&" as "and": for comparing titles. */
export function normTitle(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A URL without fragment, trailing slash, tracking params or `www.`: for comparing source links. */
export function normUrl(u: string | undefined | null): string {
  if (!u) return "";
  try {
    const url = new URL(u.trim());
    url.hash = "";
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|scroll$)/i.test(k)) url.searchParams.delete(k);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "").toLowerCase();
    const q = url.searchParams.toString().toLowerCase();
    return `${host}${path}${q ? `?${q}` : ""}`;
  } catch {
    return u.trim().toLowerCase();
  }
}

export function perfKey(p: { date: string; time: string }): string {
  return `${p.date}|${p.time}`;
}

export function dedupePerformances(perfs: CollectedPerformance[]): CollectedPerformance[] {
  const m = new Map<string, CollectedPerformance>();
  for (const p of perfs) {
    const k = perfKey(p);
    m.set(k, { ...(m.get(k) ?? {}), ...p });
  }
  // A dated performance with a time makes the same date without one redundant.
  const timed = new Set([...m.values()].filter((p) => p.time).map((p) => p.date));
  return [...m.values()].filter((p) => p.time || !timed.has(p.date)).sort((a, b) => perfKey(a).localeCompare(perfKey(b)));
}

/** A title without a trailing date in brackets: "This Murder Was Staged (Nov. 13)" → "This Murder Was Staged". */
export function stripDateSuffix(title: string): string {
  return title
    .replace(/\s*[([](?:[a-z]{3,9}\.?,?\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?(?:\s*(?:at|@)?\s*\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)?[)\]]\s*$/i, "")
    .trim();
}

/** Title filters from a source's config: `include` keeps only matches, `exclude` drops them. */
export function filterTitles<T extends { title: string }>(events: T[], config: Record<string, unknown>): T[] {
  const inc = typeof config.include === "string" && config.include ? new RegExp(config.include, "i") : null;
  const exc = typeof config.exclude === "string" && config.exclude ? new RegExp(config.exclude, "i") : null;
  return events.filter((e) => (!inc || inc.test(e.title)) && (!exc || !exc.test(e.title)));
}

/**
 * Fold occurrences of one production into one event: feeds that list each
 * date as its own item (Tribe recurrences, iCal, JSON-LD per date) become one
 * CollectedEvent with every date.
 */
export function groupEvents(events: CollectedEvent[], key: (e: CollectedEvent) => string = (e) => `${normTitle(e.title)}|${normTitle(e.venueName ?? "")}`): CollectedEvent[] {
  const m = new Map<string, CollectedEvent>();
  for (const raw of events) {
    const e = { ...raw, title: stripDateSuffix(raw.title) || raw.title };
    const k = key(e);
    const prev = m.get(k);
    if (!prev) {
      m.set(k, { ...e, performances: [...e.performances] });
      continue;
    }
    prev.performances.push(...e.performances);
    prev.complete = prev.complete && e.complete;
    prev.imageUrl ??= e.imageUrl;
    prev.price ??= e.price;
    prev.ticketUrl ??= e.ticketUrl;
    if (e.startDate && (!prev.startDate || e.startDate < prev.startDate)) prev.startDate = e.startDate;
    if (e.endDate && (!prev.endDate || e.endDate > prev.endDate)) prev.endDate = e.endDate;
  }
  return [...m.values()].map((e) => ({ ...e, performances: dedupePerformances(e.performances) }));
}

/** Leave out what ended before today. An event with no dates at all stays (its page may still give an image). */
export function upcoming(events: CollectedEvent[], today: string): CollectedEvent[] {
  return events
    .map((e) => {
      const undated = !e.performances.length && !e.startDate && !e.endDate;
      return { e: { ...e, performances: e.performances.filter((p) => p.date >= today) }, undated };
    })
    .filter(({ e, undated }) => undated || e.performances.length || (e.endDate ?? e.startDate ?? "") >= today)
    .map(({ e }) => e);
}


/** Ticket sellers and ticketing platforms: their pages are not the presenter's own. */
export const TICKETING_HOST =
  /ovationtix|(^|\.)tickets?\.|ticketspice|eventbrite|boxofficecentral|getcuebox|purplepass|ludus|thundertix|tix\.com|square\.site|qgiv|ticketapp|blackbaud|donorperfect|our\.show|onthestage|salesforce|^cart\.|^buy\.|^my\.|^event\.|tickets\.com/i;

export function isTicketingUrl(u: string | undefined | null): boolean {
  if (!u) return false;
  try {
    return TICKETING_HOST.test(new URL(u).hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

export const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
export const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[$,]/g, "")) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
