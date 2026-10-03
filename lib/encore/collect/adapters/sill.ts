import { addDays, parseMonthDay, parseTime } from "../dates";
import { clean, parseHtml } from "../html";
import { priceFields } from "../price";
import type { Adapter, CollectedEvent } from "../types";
import { normTitle, sha256, upcoming } from "../util";

/**
 * Sarasota Institute of Lifetime Learning: the "Season at a Glance" page.
 * Its first table says which weekday, venue and time each series meets
 * (Music Mondays at Church of the Palms, 10:30; Global Issues Series I on
 * Tuesday at First Methodist and Wednesday at Cornerstone…); the next
 * table lists each series' dates, titles and speakers. Every program
 * becomes one event per venue in our area. Venues outside the three
 * markets (Venice) are left out.
 *
 * config: { url, venues: { [lowercase venue text]: venueKey }, price? }
 */

type Slot = { weekday: number; venueKey: string; time: string };
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const seriesKey = (s: string) => normTitle(s).replace(/\bissues\b/g, "").replace(/\s+/g, " ").trim();

function cells(html: string): string[] {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]!);
}
const lines = (cell: string) =>
  cell
    .split(/<br\s*\/?>/i)
    .map((l) => clean(l))
    .filter(Boolean);

export function readSill(html: string, venues: Record<string, string>, today: string, price?: string): CollectedEvent[] {
  const doc = parseHtml(html);
  const tables = doc.querySelectorAll(".avia-pricing-table-container");
  const slots = new Map<string, Slot[]>();
  const programs: { series: string; html: string[] }[] = [];
  for (const t of tables) {
    for (const col of t.querySelectorAll("ul.pricing-table")) {
      const items = cells(col.innerHTML);
      const heading = clean(items[0] ?? "").replace(/\s+$/, "");
      const weekday = WEEKDAYS.indexOf(heading.toLowerCase());
      if (weekday >= 0) {
        const series = seriesKey(clean(items[1] ?? ""));
        for (const cell of items.slice(2)) {
          const ls = lines(cell.replace(/<span class='fallback-table-val'>|<\/span>/g, ""));
          const place = ls.slice(0, 2).join(" ").toLowerCase();
          const key = Object.entries(venues).find(([k]) => place.includes(k))?.[1];
          const time = parseTime(ls.join(" "));
          if (key && time && !/empty-table-cell/.test(cell)) slots.set(series, [...(slots.get(series) ?? []), { weekday, venueKey: key, time }]);
        }
      } else if (heading) {
        programs.push({ series: heading, html: items.slice(1) });
      }
    }
  }
  const out: CollectedEvent[] = [];
  for (const { series, html: items } of programs) {
    const key = seriesKey(series);
    const when = slots.get(key) ?? [...slots.entries()].find(([k]) => k.includes(key) || key.includes(k))?.[1] ?? [];
    const isMusic = /music/i.test(series);
    for (const cell of items) {
      const ls = lines(cell.replace(/<\/?p>/g, ""));
      const first = ls[0] ? parseMonthDay(ls[0], today) : undefined;
      if (!first) continue;
      const em = clean(cell.match(/<em>([\s\S]*?)<\/em>/i)?.[1] ?? "");
      const rest = ls.slice(1).filter((l) => l !== em);
      const title = isMusic ? `Music Mondays: ${em}${rest[0] ? `, ${rest[0]}` : ""}` : `${rest.join(" ")}${em ? ` – ${em}` : ""}`;
      for (const slot of when) {
        let date = first;
        for (let i = 0; i < 7 && new Date(`${date}T12:00:00Z`).getUTCDay() !== slot.weekday; i += 1) date = addDays(date, 1);
        out.push({
          sourceUrl: "https://sillsarasota.org/season-at-a-glance/",
          title: clean(title),
          presenter: "Sarasota Institute of Lifetime Learning (SILL)",
          venueKey: slot.venueKey,
          performances: [{ date, time: slot.time }],
          complete: true,
          ticketUrl: "https://sillsarasota.org/tickets/",
          categoryHint: isMusic ? "concert" : "lecture",
          ...priceFields(price),
        });
      }
    }
  }
  return out;
}

export const sillAdapter: Adapter = {
  name: "sill",
  kind: "site",
  async collect(source, ctx) {
    const url = String(source.config.url ?? "https://sillsarasota.org/season-at-a-glance/");
    const res = await ctx.fetch(url);
    if (!res.ok) throw new Error(`SILL season page ${res.status}`);
    const events = readSill(res.text, (source.config.venues as Record<string, string>) ?? {}, ctx.today, source.config.price as string | undefined);
    if (!events.length) throw new Error("SILL season page had no programs (layout changed?)");
    return { events: upcoming(events, ctx.today), warnings: [], contentHash: sha256(res.text.replace(/\s+/g, " ").replace(/ver=[\w.]+|nonce="[^"]*"/g, "")) };
  },
};
