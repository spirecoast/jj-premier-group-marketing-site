import { parseMonthDay } from "../dates";
import { clean, metaContent, metaImage, parseHtml } from "../html";
import type { Adapter, CollectedEvent } from "../types";
import { normUrl, sha256, upcoming } from "../util";

/**
 * TicketSpice (Webconnex) ticket pages. Each page embeds its form as JSON
 * with a `soldOut` flag; og:title starts with the date ("10/01/2026 The
 * Mammals"). Reads the known events' TicketSpice links plus any pages in
 * config.pages, and with config.index (a TicketSpice account's home page)
 * the links found there.
 *
 * config: { pages?: string[], index?: string, host?: string }
 */
export function readTicketSpice(html: string, url: string, today: string): CollectedEvent | null {
  const doc = parseHtml(html);
  const og = metaContent(doc, "og:title") ?? clean(doc.querySelector("title")?.innerHTML ?? "");
  if (!og) return null;
  const m = og.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(.*)$/);
  const date = m ? `${m[3]}-${m[1]!.padStart(2, "0")}-${m[2]!.padStart(2, "0")}` : parseMonthDay(og, today);
  const title = (m ? m[4]! : og).replace(/\s+/g, " ").trim();
  const soldOut = /\\?"soldOut\\?":\s*true/.test(html);
  const closed = /\\?"active\\?":\s*false/.test(html);
  const image = metaImage(doc, url);
  return {
    sourceUrl: url,
    title,
    performances: date ? [{ date, time: "", availability: soldOut ? "sold-out" : closed ? "not-on-sale" : "on-sale", ticketUrl: url }] : [],
    complete: false,
    ticketUrl: url,
    status: soldOut ? "sold-out" : undefined,
    // The account logo, not the event's art: leave the image to the presenter's own page.
    imageUrl: image && !/newlogo|logo/i.test(image) ? image : undefined,
  };
}

export const ticketspiceAdapter: Adapter = {
  name: "ticketspice",
  kind: "platform",
  async collect(source, ctx) {
    const host = String(source.config.host ?? "ticketspice.com");
    const urls = new Map<string, string>();
    for (const u of (source.config.pages as string[] | undefined) ?? []) urls.set(normUrl(u), u);
    for (const k of ctx.known) for (const u of [k.ticketUrl, ...k.urls]) if (u && u.includes(host) && (k.lastDate ?? "9999") >= ctx.today) urls.set(normUrl(u), u);
    if (typeof source.config.index === "string") {
      const res = await ctx.fetch(source.config.index);
      if (res.ok) for (const m of res.text.matchAll(/href="(https:\/\/[a-z0-9-]+\.ticketspice\.com\/[^"#?]+)"/gi)) urls.set(normUrl(m[1]!), m[1]!);
    }
    const events: CollectedEvent[] = [];
    const warnings: string[] = [];
    let hash = "";
    for (const url of urls.values()) {
      if (ctx.deadline && Date.now() > ctx.deadline) break;
      const res = await ctx.fetch(url).catch((e: Error) => ({ ok: false, status: 0, text: "", url, headers: {}, error: e.message }));
      if (!res.ok) {
        warnings.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      hash += sha256(res.text.replace(/\s+/g, " "));
      const e = readTicketSpice(res.text, url, ctx.today);
      if (e) events.push(e);
    }
    return { events: upcoming(events, ctx.today), warnings, contentHash: sha256(hash) };
  },
};
