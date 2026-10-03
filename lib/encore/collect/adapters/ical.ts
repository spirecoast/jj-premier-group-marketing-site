import { localParts } from "../dates";
import { clean } from "../html";
import type { Adapter, CollectedEvent } from "../types";
import { filterTitles, groupEvents, sha256, upcoming } from "../util";

/**
 * iCalendar feeds (Tribe's `?ical=1`, Squarespace `?format=ical`, any .ics).
 * config: { urls: string[], exclude? }
 */

type VEvent = Record<string, { value: string; params: Record<string, string> }>;

export function unfold(ics: string): string[] {
  return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
}

export function parseIcs(ics: string): VEvent[] {
  const out: VEvent[] = [];
  let cur: VEvent | null = null;
  for (const line of unfold(ics)) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur) out.push(cur);
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const [name, ...paramParts] = line.slice(0, i).split(";");
      const params: Record<string, string> = {};
      for (const p of paramParts) {
        const [k, v] = p.split("=");
        if (k && v) params[k.toUpperCase()] = v.replace(/^"|"$/g, "");
      }
      cur[name!.toUpperCase()] = { value: line.slice(i + 1), params };
    }
  }
  return out;
}

const unescape = (s: string) => s.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");

/** DTSTART to local date/time: VALUE=DATE, a UTC "Z" stamp, or local wall time (TZID or floating). */
export function icsDate(v: { value: string; params: Record<string, string> } | undefined): { date: string; time: string } | null {
  if (!v) return null;
  const m = v.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4] || v.params.VALUE === "DATE") return { date, time: "" };
  if (m[7]) return localParts(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])));
  return { date, time: `${m[4]}:${m[5]}` };
}

export function icsToCollected(ev: VEvent): CollectedEvent | null {
  const start = icsDate(ev.DTSTART);
  if (!start || !ev.SUMMARY) return null;
  const end = icsDate(ev.DTEND);
  const desc = unescape(ev.DESCRIPTION?.value ?? "");
  const allDay = !start.time;
  // An all-day event whose DTEND (exclusive) is more than a day later is a run.
  const runEnd = allDay && end && end.date > start.date ? new Date(Date.parse(`${end.date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10) : undefined;
  const base: CollectedEvent = {
    sourceUrl: ev.URL?.value ?? "",
    externalId: ev.UID?.value,
    title: clean(unescape(ev.SUMMARY.value)),
    venueName: ev.LOCATION ? clean(unescape(ev.LOCATION.value).split(",")[0]) : undefined,
    performances: [],
    complete: true,
    imageUrl: ev.ATTACH?.params.FMTTYPE?.startsWith("image/") ? ev.ATTACH.value : undefined,
    sourceText: clean(desc).slice(0, 600),
    // Prices in a description are anything from a raffle to a sponsor level: not read.
    status: ev.STATUS?.value === "CANCELLED" ? "cancelled" : undefined,
  };
  if (runEnd && runEnd > start.date) return { ...base, startDate: start.date, endDate: runEnd };
  return { ...base, performances: [{ date: start.date, time: start.time, status: base.status === "cancelled" ? "cancelled" : undefined }] };
}

export const icalAdapter: Adapter = {
  name: "ical",
  kind: "generic",
  async collect(source, ctx) {
    const urls = (source.config.urls as string[] | undefined) ?? [];
    const events: CollectedEvent[] = [];
    const warnings: string[] = [];
    let hashInput = "";
    for (const url of urls) {
      const res = await ctx.fetch(url, { headers: { Accept: "text/calendar,*/*;q=0.8" } });
      if (!res.ok || !res.text.includes("BEGIN:VCALENDAR")) {
        warnings.push(`${url}: HTTP ${res.status}${res.ok ? " (not a calendar)" : ""}`);
        continue;
      }
      hashInput += res.text.replace(/^DTSTAMP:.*$/gm, "");
      for (const ev of parseIcs(res.text)) {
        const c = icsToCollected(ev);
        if (c) events.push({ ...c, sourceUrl: c.sourceUrl || url });
      }
    }
    if (!events.length && warnings.length === urls.length) throw new Error(warnings.join("; "));
    return {
      events: upcoming(groupEvents(filterTitles(events, source.config)), ctx.today),
      warnings,
      contentHash: sha256(hashInput),
    };
  },
};
