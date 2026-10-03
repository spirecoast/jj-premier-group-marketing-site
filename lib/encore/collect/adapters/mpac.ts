import { parseDateRange } from "../dates";
import { abs, clean } from "../html";
import type { Adapter, CollectedEvent } from "../types";
import { sha256, upcoming } from "../util";

/**
 * Manatee Performing Arts Center: the home page is the season, one block per
 * show: the show's art, a Buy Tickets link to BoxOfficeCentral, a heading
 * with the date or run ("October 27, 2026 2 PM & 7 PM", "October 15 –
 * November 1, 2026") and a paragraph about it. There is no title text, so
 * blocks are matched to known events by their BoxOfficeCentral link; a new
 * block goes to review with the opening words of its paragraph as a working
 * title.
 *
 * config: { url? }
 */

export function readMpac(html: string, base: string, today: string): CollectedEvent[] {
  const out: CollectedEvent[] = [];
  const re = /<img[^>]+src="([^"]+\/uploads\/[^"]+)"[^>]*>[\s\S]*?href="(https:\/\/purchase\.boxofficecentral\.com\/(?:EventAvailability\?EventId=\d+|ChooseSeats\/\d+)[^"]*)"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<img[^>]+src="[^"]+\/uploads\/|$)/gi;
  for (const m of html.matchAll(re)) {
    const [, img, ticket, heading, after] = m;
    const when = clean(heading);
    const range = parseDateRange(when.replace(/\d{1,2}(?::\d{2})?\s*[AP]M.*$/i, ""), today);
    if (!range?.start) continue;
    const times = [...when.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/gi)].map((t) => {
      const h = (Number(t[1]) % 12) + (t[3]!.toUpperCase() === "P" ? 12 : 0);
      return `${String(h).padStart(2, "0")}:${t[2] ?? "00"}`;
    });
    const single = !range.end || range.end === range.start;
    const ticketUrl = clean(ticket).replace(/&ref=.*$/, "");
    const para = clean(after!.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").replace(/^MATURE CONTENT\s*/i, "");
    const fromFile = decodeURIComponent(img!.split("/").pop() ?? "")
      .replace(/\.[a-z]+$/i, "")
      .replace(/[-_](spektrix|banner|web|final|\d+x\d+|scaled)\b/gi, "")
      .replace(/[-_]+/g, " ")
      .trim();
    out.push({
      sourceUrl: base,
      externalId: ticketUrl.match(/(\d+)$/)?.[1],
      title: fromFile || para.split(/[.!]/)[0]!.slice(0, 80),
      venueName: "Manatee Performing Arts Center",
      performances: single ? (times.length ? times : [""]).map((time) => ({ date: range.start!, time })) : [range.start, range.end!].map((date) => ({ date, time: "" })),
      complete: single && times.length > 0,
      ticketUrl,
      imageUrl: abs(img, base),
      imagePageUrl: base,
      sourceText: para.slice(0, 600),
    });
  }
  return out;
}

export const mpacAdapter: Adapter = {
  name: "mpac",
  kind: "site",
  async collect(source, ctx) {
    const url = String(source.config.url ?? "https://www.manateeperformingartscenter.com/");
    const res = await ctx.fetch(url);
    if (!res.ok) throw new Error(`MPAC home page ${res.status}`);
    const events = readMpac(res.text, url, ctx.today);
    if (!events.length) throw new Error("MPAC home page had no show blocks (layout changed?)");
    return { events: upcoming(events, ctx.today), warnings: [], contentHash: sha256(events.map((e) => [e.ticketUrl, e.performances.map((p) => p.date + p.time).join()].join()).join("|")) };
  },
};
