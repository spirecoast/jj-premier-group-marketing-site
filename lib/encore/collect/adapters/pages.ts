import { parseDateRange, parseTime } from "../dates";
import { abs, jsonLd, metaImage, metaContent, parseHtml, textOf, tidyTitle, type Page } from "../html";
import { isLdEvent, ldEventToCollected } from "../ld";
import type { Adapter, AdapterContext, CollectedEvent, SourceDef } from "../types";
import { filterTitles, groupEvents, normTitle, normUrl, sha256, upcoming } from "../util";
import { SITE_EXTRACTORS } from "./sites";

/**
 * Event pages, one request each: schema.org Event JSON-LD where the page
 * has it, a per-site extractor where one is registered, otherwise the
 * page's title, og:image and the first date or date range printed after the
 * title. Pages come from listing pages (links matching `linkPattern`) and
 * from the known events' own pages, so a known event is revisited even when
 * a listing stops showing it.
 *
 * config: {
 *   listings?: string[]        pages whose links are followed
 *   linkPattern?: string       regex an event page URL must match
 *   pages?: string[]           fixed pages to read
 *   listingLd?: boolean        also read Event JSON-LD on the listing pages themselves
 *   extractor?: string         a key of SITE_EXTRACTORS
 *   maxPages?: number          default 60
 *   exclude?: string           title regex to leave out
 * }
 */

function visibleText(doc: Page["doc"]): string {
  const root = doc.querySelector("main") ?? doc.querySelector("article") ?? doc.querySelector("body") ?? doc;
  const clone = parseHtml(root.toString());
  for (const sel of ["script", "style", "nav", "header", "footer", "svg", "noscript", "form"]) clone.querySelectorAll(sel).forEach((n) => n.remove());
  return textOf(clone);
}

const DATE_START =
  /(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i;

/** The first printed date or range after the title, with a time when one sits right beside it. */
export function datesFromText(text: string, title: string, today: string): Pick<CollectedEvent, "performances" | "startDate" | "endDate"> | null {
  const at = title ? text.toLowerCase().indexOf(title.toLowerCase().slice(0, 40)) : -1;
  const tail = at >= 0 ? text.slice(at + Math.min(title.length, 40)) : text;
  const m = tail.match(DATE_START);
  if (!m || m.index === undefined || m.index > 2500) return null;
  const window = tail.slice(m.index, m.index + 90);
  const range = parseDateRange(window.replace(/\s+(?:at|@)\s+.*/, ""), today);
  if (!range?.start) return null;
  const time = parseTime(window.slice(0, 60));
  if (range.end && range.end !== range.start) return { performances: [], startDate: range.start, endDate: range.end };
  return { performances: [{ date: range.start, time: time ?? "" }] };
}

/** Parts of "Site - Event | Site" with the site's own name taken out. */
export function pageTitle(doc: Page["doc"]): string {
  const h1 = textOf(doc.querySelector("h1"));
  const og = metaContent(doc, "og:title");
  const tag = textOf(doc.querySelector("title"));
  const site = normTitle(metaContent(doc, "og:site_name") ?? "");
  const parts = (s: string) => s.split(/\s+[|–—-]\s+/).map((x) => x.trim()).filter(Boolean);
  const isSite = (s: string) => {
    const n = normTitle(s);
    return !n || n === site || (site.length > 3 && n.includes(site) && n.length - site.length < 4);
  };
  // A header logo in an h1 ("Sarasota Film Society") is the site, not the event, when the <title> starts with it.
  const h1IsSite = Boolean(h1) && (isSite(h1) || parts(tag)[0] === h1 && parts(tag).length > 1);
  const fromMeta = [og, tag]
    .filter((x): x is string => Boolean(x))
    .map((x) => parts(x).filter((p) => !isSite(p) && p !== h1).join(" – "))
    .find(Boolean);
  const pick = !h1 || h1IsSite || h1.length < 4 ? fromMeta : h1;
  return tidyTitle(pick ?? h1 ?? "");
}

/** The site's own name: og:site_name, else the last part of the <title>. */
export function siteName(doc: Page["doc"]): string {
  const og = metaContent(doc, "og:site_name");
  if (og) return og;
  const parts = textOf(doc.querySelector("title")).split(/\s+[|–—-]\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

/** "Take 6 — Jazz Club of Sarasota" → "Take 6" when the tail is the site's name. */
export function stripSite(title: string, site: string): string {
  const n = normTitle(site);
  if (!n) return title;
  const parts = title.split(/\s+[|–—-]\s+/);
  const kept = parts.filter((p, i) => i === 0 || normTitle(p) !== n);
  return kept.join(" – ") || title;
}

/** "2026-10-05-roomful-of-teeth" → { date: 2026-10-05, title: "Roomful Of Teeth" }. */
export function slugTitle(url: string): { title: string; date?: string } | null {
  let last = "";
  try {
    last = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return null;
  }
  const date = last.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
  const words = last.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.(html?|cfm|php)$/, "").replace(/[-_]+/g, " ").trim();
  if (!words || /^\d+$/.test(words)) return null;
  return { title: words.replace(/\b[a-z]/g, (c) => c.toUpperCase()), date };
}

export function genericPage(page: Page, today: string, opts: { listing?: boolean } = {}): CollectedEvent[] {
  const image = metaImage(page.doc, page.url);
  const here = normUrl(page.url);
  // An Event block that names another page is that page's event (some themes repeat one event's block site-wide).
  const ld = jsonLd(page.html)
    .filter(isLdEvent)
    .filter((o) => opts.listing || typeof o.url !== "string" || normUrl(o.url) === here || !normUrl(o.url).startsWith(here.split("/")[0]!));
  if (ld.length) {
    const site = siteName(page.doc);
    return ld
      .map((o) => ldEventToCollected(o, page.url))
      .filter((e): e is CollectedEvent => Boolean(e))
      .map((e) => ({
        ...e,
        title: stripSite(e.title, site),
        // Some sites put the ticket link in `url`; the page itself is the source.
        sourceUrl: opts.listing && normUrl(e.sourceUrl).split("/")[0] === here.split("/")[0] ? e.sourceUrl : page.url,
        imageUrl: e.imageUrl ?? image,
        imagePageUrl: page.url,
      }));
  }
  const title = pageTitle(page.doc);
  if (!title) return [];
  const dates = datesFromText(visibleText(page.doc), title, today);
  return [
    {
      sourceUrl: page.url,
      title,
      performances: dates?.performances ?? [],
      startDate: dates?.startDate,
      endDate: dates?.endDate,
      complete: false,
      heuristic: true,
      imageUrl: image,
      imagePageUrl: page.url,
      sourceText: metaContent(page.doc, "og:description") ?? metaContent(page.doc, "description"),
    },
  ];
}

export async function readPage(url: string, ctx: AdapterContext): Promise<Page | null> {
  const res = await ctx.fetch(url);
  if (!res.ok) return null;
  return { url: res.url || url, html: res.text, doc: parseHtml(res.text) };
}

export function linksIn(page: Page, pattern: RegExp): string[] {
  const out = new Set<string>();
  for (const a of page.doc.querySelectorAll("a[href]")) {
    const href = abs(a.getAttribute("href"), page.url);
    if (href && pattern.test(href)) out.add(href.split("#")[0]!);
  }
  // Card layouts that navigate with onclick="location.href='…'".
  for (const m of page.html.matchAll(/location\.href\s*=\s*['"]([^'"]+)['"]/g)) {
    const href = abs(m[1], page.url);
    if (href && pattern.test(href)) out.add(href);
  }
  return [...out];
}

export async function collectPages(source: SourceDef, ctx: AdapterContext) {
  const c = source.config;
  const pattern = typeof c.linkPattern === "string" ? new RegExp(c.linkPattern, "i") : null;
  const maxPages = Number(c.maxPages ?? 60);
  const extractor = typeof c.extractor === "string" ? SITE_EXTRACTORS[c.extractor] : undefined;
  const warnings: string[] = [];
  const events: CollectedEvent[] = [];
  const queue = new Map<string, string>();
  const add = (u: string) => {
    const k = normUrl(u);
    if (!queue.has(k)) queue.set(k, u);
  };
  let listed = 0;
  let hash = "";
  for (const url of (c.listings as string[] | undefined) ?? []) {
    const page = await readPage(url, ctx);
    if (!page) {
      warnings.push(`listing ${url} could not be read`);
      continue;
    }
    listed += 1;
    if (c.listingLd) for (const e of genericPage(page, ctx.today, { listing: true })) if (e.performances.length || e.startDate) events.push(e);
    if (pattern) for (const l of linksIn(page, pattern)) add(l);
    if (extractor?.listing) events.push(...(await extractor.listing(page, ctx, source)));
  }
  if ((c.listings as string[] | undefined)?.length && !listed) throw new Error("no listing page could be read");
  // Known pages first, so a run cut short by maxPages or the deadline still revisits them.
  const discovered = [...queue.values()];
  queue.clear();
  for (const url of (c.pages as string[] | undefined) ?? []) add(url);
  if (pattern) for (const k of ctx.known) if ((k.lastDate ?? "9999") >= ctx.today) for (const u of k.urls) if (pattern.test(u)) add(u);
  if (ctx.mode === "collect") for (const u of discovered) add(u);
  // A check run only revisits what is known; discovery waits for the weekly run.
  const urls = [...queue.values()];
  let read = 0;
  for (const url of urls.slice(0, maxPages)) {
    if (ctx.deadline && Date.now() > ctx.deadline) {
      warnings.push(`stopped at the deadline after ${read} pages`);
      break;
    }
    let page: Page | null = null;
    try {
      page = await readPage(url, ctx);
    } catch (err) {
      warnings.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!page) {
      warnings.push(`${url}: not readable`);
      continue;
    }
    read += 1;
    hash += sha256(page.html.replace(/\s+/g, " ").replace(/nonce="[^"]*"|ver=[\w.]+/g, ""));
    const found = (extractor?.page ? await extractor.page(page, ctx, source) : null) ?? genericPage(page, ctx.today);
    events.push(...found.map((e) => ({ ...e, sourceUrl: e.sourceUrl || page!.url })));
  }
  if (urls.length > maxPages) warnings.push(`${urls.length - maxPages} pages left for the next run`);
  // JS-rendered sites give every page the same title (the site's name): use the page's address instead.
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.title, (counts.get(e.title) ?? 0) + 1);
  for (const e of events) {
    // Most of the pages read share it: it is the site's name, not a recurring event's title.
    if ((counts.get(e.title) ?? 0) < Math.max(2, Math.ceil(read * 0.5))) continue;
    const st = slugTitle(e.sourceUrl);
    if (!st) continue;
    e.title = st.title;
    if (st.date && !e.performances.some((p) => p.date === st.date)) e.performances = [{ date: st.date, time: e.performances[0]?.time ?? "" }];
  }
  return {
    events: upcoming(groupEvents(filterTitles(events, c), (e) => normUrl(e.sourceUrl) + "|" + e.title.toLowerCase()), ctx.today),
    warnings,
    contentHash: sha256(hash),
  };
}

export const pagesAdapter: Adapter = { name: "pages", kind: "generic", collect: collectPages };
/** The same reader under the name the source audit used for JSON-LD sites. */
export const jsonLdAdapter: Adapter = { name: "jsonld", kind: "generic", collect: collectPages };
