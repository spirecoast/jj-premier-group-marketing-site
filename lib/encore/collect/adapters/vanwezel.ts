import { parseDateRange } from "../dates";
import { abs, clean, parseHtml, textOf } from "../html";
import type { Adapter, Availability, CollectedEvent } from "../types";
import { filterTitles, sha256, upcoming } from "../util";

/**
 * Van Wezel Performing Arts Hall (Carbonhouse CMS). The events page renders
 * nine items; /events/events_ajax/<offset> returns the next nine as a
 * JSON-encoded HTML fragment. Detail pages answer 406 to anything but a
 * real browser, so everything comes from the cards: title, presenter,
 * date or date range, the card image and the ticket button (its class says
 * onsalenow / soldout / cancelled). Times are not on the cards, so the
 * performance list is not complete.
 *
 * config: { base?, perPage? (9), maxPages? (12), delayMs? (5000 between ajax pages: the WAF counts) }
 */

export function readVanWezelCards(html: string, base: string, today: string): CollectedEvent[] {
  const doc = parseHtml(html);
  const out: CollectedEvent[] = [];
  for (const item of doc.querySelectorAll(".eventItem")) {
    const link = item.querySelector(".title a") ?? item.querySelector("a");
    const title = textOf(item.querySelector(".title"));
    const url = abs(link?.getAttribute("href"), base);
    if (!title || !url) continue;
    const dateText = textOf(item.querySelector(".date"));
    const range = parseDateRange(dateText, today);
    const button = item.querySelector(".buttons a.tickets");
    const cls = button?.getAttribute("class") ?? "";
    const label = textOf(button);
    const availability: Availability | undefined = /soldout|sold-out/i.test(cls) || /sold out/i.test(label)
      ? "sold-out"
      : /cancel/i.test(cls + label)
        ? "not-on-sale"
        : /onsalenow/i.test(cls)
          ? "on-sale"
          : /onsalesoon|comingsoon/i.test(cls)
            ? "not-on-sale"
            : undefined;
    const status = /cancel/i.test(cls + label) ? ("cancelled" as const) : /postpon/i.test(cls + label + dateText) ? ("postponed" as const) : undefined;
    const ticketHref = abs(button?.getAttribute("href"), base);
    const img = item.querySelector(".thumb img")?.getAttribute("src");
    const days = range?.start ? (range.end && range.end !== range.start ? [range.start, range.end] : [range.start]) : [];
    out.push({
      sourceUrl: url,
      externalId: url.split("/").pop(),
      title: clean(title),
      presenter: textOf(item.querySelector(".presented-by")) || undefined,
      venueName: "Van Wezel Performing Arts Hall",
      // First and last day of a run; the days between are not printed.
      performances: days.map((date) => ({ date, time: "", availability, status })),
      complete: false,
      ticketUrl: ticketHref && !ticketHref.includes("/events/detail/") ? ticketHref : url,
      status: availability === "sold-out" ? "sold-out" : status,
      imageUrl: abs(img, base),
      imagePageUrl: `${base}/events`,
    });
  }
  return out;
}

export const vanWezelAdapter: Adapter = {
  name: "vanwezel",
  kind: "site",
  async collect(source, ctx) {
    const base = String(source.config.base ?? "https://www.vanwezel.org");
    const perPage = Number(source.config.perPage ?? 9);
    const maxPages = Number(source.config.maxPages ?? 12);
    const delay = Number(source.config.delayMs ?? 5000);
    const first = await ctx.fetch(`${base}/events`);
    if (!first.ok) throw new Error(`Van Wezel events page ${first.status}`);
    const html: string[] = [first.text];
    const warnings: string[] = [];
    for (let page = 1; page < maxPages; page += 1) {
      if (ctx.deadline && Date.now() > ctx.deadline) break;
      if (delay) await new Promise((r) => setTimeout(r, delay));
      const offset = page * perPage;
      const res = await ctx.fetch(
        `${base}/events/events_ajax/${offset}?category=0&venue=0&team=0&exclude=&per_page=${perPage}&came_from_page=event-list-page`,
        { headers: { Accept: "*/*", "X-Requested-With": "XMLHttpRequest", Referer: `${base}/events`, "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty", "Sec-Fetch-Site": "same-origin" } },
      );
      if (!res.ok) {
        warnings.push(`ajax page at offset ${offset}: HTTP ${res.status}`);
        break;
      }
      let fragment = res.text;
      try {
        fragment = JSON.parse(res.text) as string;
      } catch {
        /* plain HTML */
      }
      if (!fragment.includes("eventItem")) break;
      html.push(fragment);
    }
    const events = html.flatMap((h) => readVanWezelCards(h, base, ctx.today));
    const seen = new Set<string>();
    const unique = events.filter((e) => (seen.has(e.sourceUrl) ? false : (seen.add(e.sourceUrl), true)));
    return { events: upcoming(filterTitles(unique, source.config), ctx.today), warnings, contentHash: sha256(html.join("").replace(/\s+/g, " ")) };
  },
};
