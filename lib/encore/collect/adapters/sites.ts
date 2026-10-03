import { parseMonthDay, parseTime } from "../dates";
import { abs, clean, metaContent, metaImage, textOf, tidyTitle, type Page } from "../html";
import { priceFields } from "../price";
import type { AdapterContext, Availability, CollectedEvent, CollectedPerformance, SourceDef } from "../types";

/**
 * Per-site page readers for sources whose pages carry no usable JSON-LD.
 * Each returns null to fall back to the generic reader in pages.ts.
 */
export type SiteExtractor = {
  listing?: (page: Page, ctx: AdapterContext, source: SourceDef) => CollectedEvent[] | Promise<CollectedEvent[]>;
  page?: (page: Page, ctx: AdapterContext, source: SourceDef) => CollectedEvent[] | null | Promise<CollectedEvent[] | null>;
};

const soldOutText = (s: string): Availability | undefined => (/sold\s*-?\s*out/i.test(s) ? "sold-out" : /few|limited|almost gone|low/i.test(s) ? "few-left" : undefined);

/** McCurdy's Comedy Theatre: show.cfm pages list every date and time with a BUY button. */
const mccurdys: SiteExtractor = {
  page(page, ctx) {
    const title = textOf(page.doc.querySelector("h1.summary") ?? page.doc.querySelector("h1"));
    if (!title) return null;
    const priceText = textOf(page.doc.querySelector("em"))?.match(/tickets?\s+(.*)/i)?.[1];
    const performances: CollectedPerformance[] = [];
    for (const li of page.doc.querySelectorAll(".upcoming-shows-sidebar li")) {
      const when = textOf(li.querySelector("p"));
      const date = parseMonthDay(when, ctx.today);
      if (!date) continue;
      const button = li.querySelector("a.tickets, a.btn, span.btn");
      const label = button ? textOf(button) + " " + (button.getAttribute("class") ?? "") : textOf(li);
      performances.push({
        date,
        time: parseTime(when) ?? "",
        availability: soldOutText(label) ?? (button?.getAttribute("href") ? "on-sale" : undefined),
        ticketUrl: abs(button?.getAttribute("href"), page.url),
        ...(priceText ? { priceMin: priceFields(priceText).priceMin, priceMax: priceFields(priceText).priceMax } : {}),
      });
    }
    return [
      {
        sourceUrl: page.url,
        externalId: page.url.match(/shoid=(\d+)/i)?.[1],
        title: tidyTitle(title),
        performances,
        complete: performances.length > 0,
        ticketUrl: page.url,
        imageUrl: metaImage(page.doc, page.url),
        imagePageUrl: page.url,
        sourceText: textOf(page.doc.querySelector("p.description")).slice(0, 600),
        categoryHint: "comedy",
        ...(priceText ? priceFields(priceText) : {}),
      },
    ];
  },
};

/** WSLR + Fogartyville: "Date: Saturday, October 10, 2026 Time: 8:00 pm" and a TicketSpice link. */
const wslr: SiteExtractor = {
  page(page, ctx) {
    const text = page.doc.querySelectorAll(".qt-the-content").map((n) => textOf(n)).join(" | ") || textOf(page.doc.querySelector("body"));
    const cell = (label: string) =>
      page.doc
        .querySelectorAll(".qt-eventtable tr")
        .find((tr) => textOf(tr.querySelector("th")).toLowerCase().startsWith(label))
        ?.querySelector("td");
    const date = parseMonthDay(textOf(cell("date")), ctx.today);
    const time = parseTime(textOf(cell("time")));
    const title = tidyTitle(textOf(page.doc.querySelector("h1")) || metaContent(page.doc, "og:title") || "");
    if (!title) return null;
    const ticket = page.doc.querySelectorAll("a[href]").map((a) => a.getAttribute("href") ?? "").find((h) => /ticketspice\.com/i.test(h));
    const priceText = text.match(/Tickets?:\s*([^|]*?\$[^|]*?)(?:\s+Click|\s+FOGARTYVILLE|\s+\||$)/i)?.[1];
    return [
      {
        sourceUrl: page.url,
        title,
        venueName: /fogartyville/i.test(text) ? "Fogartyville Community Media and Arts Center" : undefined,
        performances: date ? [{ date, time: time ?? "", ...(priceText ? { priceMin: priceFields(priceText).priceMin, priceMax: priceFields(priceText).priceMax } : {}) }] : [],
        complete: Boolean(date),
        ticketUrl: ticket,
        imageUrl: metaImage(page.doc, page.url),
        imagePageUrl: page.url,
        sourceText: clean(metaContent(page.doc, "og:description") ?? "").slice(0, 600),
        categoryHint: "concert",
        ...(priceText ? priceFields(priceText) : {}),
      },
    ];
  },
};

export const SITE_EXTRACTORS: Record<string, SiteExtractor> = { mccurdys, wslr };
