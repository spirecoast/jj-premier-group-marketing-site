import "server-only";
import type { MetadataRoute } from "next";
import { getListingSlugs, getNeighborhoods, getPostSlugs, getSitemapEvents, getVenues } from "@/lib/content";
import { MARKETS } from "@/lib/content/markets";
import { GUIDES } from "@/lib/guides";
import { FOLDED_POSTS, isRebuiltGuide } from "@/lib/guides/slugs";
import { DATASET_VERSION, getAllRecords } from "@/lib/neighborhoods/data";
import { getSalesManifest } from "@/lib/sales";
import { absoluteUrl } from "@/lib/seo";
import { TIDE_ISSUES } from "@/lib/tide/issues";

/**
 * The sitemap, in three files under one index (/sitemap.xml) so Search Console reports each part on
 * its own: the pages, the neighborhoods and the calendar. A date only where the page has a real one
 * (a guide's last update, the day a place's sources were last checked, the collector's last read of
 * an event, the sales data's last refresh); a build time on every URL would tell search engines
 * nothing, and they learn to ignore it. Pictures are listed for the pages built around one.
 */
export const SITEMAP_SECTIONS = ["pages", "neighborhoods", "calendar"] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];
type Entry = MetadataRoute.Sitemap[number];

const entry = (path: string, priority: number, changeFrequency: Freq, lastModified?: string, images?: (string | undefined)[]): Entry => {
  const pics = (images ?? []).filter((i): i is string => Boolean(i)).map((i) => absoluteUrl(i));
  return {
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
    ...(pics.length ? { images: pics } : {}),
  };
};

/** The latest of some ISO dates (a date or a full timestamp), or undefined when there are none. */
export function latest(dates: (string | null | undefined)[]): string | undefined {
  return dates.filter((d): d is string => Boolean(d)).sort().at(-1);
}

async function pages(): Promise<Entry[]> {
  const [listings, posts, sales] = await Promise.all([getListingSlugs(), getPostSlugs(), getSalesManifest()]);
  const salesDate = sales?.generatedAt || undefined;
  const lastIssue = TIDE_ISSUES.map((e) => `${e.issue}-01`).sort().at(-1);
  const guidesDate = latest(GUIDES.map((g) => g.updatedAt));
  const s = (path: string, priority: number, freq: Freq, lastModified?: string) => entry(path, priority, freq, lastModified);
  return [
    s("/", 1, "daily"),
    // The three market hubs: the first page to read for each place.
    ...MARKETS.map((m) => s(`/${m.slug}`, 0.9, "weekly")),
    s("/listings", 0.9, "daily"),
    s("/calendar", 0.9, "daily"),
    s("/calendar/plan", 0.6, "weekly"),
    s("/tools", 0.7, "monthly"),
    s("/neighborhoods", 0.8, "weekly", DATASET_VERSION),
    s("/neighborhoods/match", 0.6, "monthly", DATASET_VERSION),
    s("/buy", 0.7, "monthly"),
    s("/relocate", 0.7, "monthly"),
    s("/sell", 0.7, "monthly"),
    // The sales lookups and the market report read the county sales files; their date is the last refresh.
    s("/sell/sold", 0.6, "weekly", salesDate),
    s("/sell/home-value", 0.7, "weekly", salesDate),
    s("/sell/net-proceeds", 0.6, "monthly"),
    s("/about", 0.6, "monthly"),
    s("/tide", 0.6, "monthly", latest([salesDate, lastIssue])),
    s("/guides", 0.7, "monthly", guidesDate),
    s("/contact", 0.5, "yearly"),
    // /from/* are bio and post links: noindex and left out on purpose.
    s("/refer", 0.4, "yearly"),
    s("/reviews", 0.4, "yearly"),
    s("/privacy", 0.2, "yearly"),
    s("/terms", 0.2, "yearly"),
    // The search page itself; result pages (?q=) are noindex and never listed.
    s("/search", 0.3, "monthly"),
    ...listings.map((slug) => s(`/listings/${slug}`, 0.8, "weekly")),
    ...posts.filter((slug) => !isRebuiltGuide(slug) && !FOLDED_POSTS[slug]).map((slug) => s(`/blog/${slug}`, 0.5, "monthly")),
    ...GUIDES.map((g) => entry(`/guides/${g.slug}`, 0.7, "monthly", g.updatedAt, [g.cover.src])),
    ...TIDE_ISSUES.map((e) => s(`/tide/${e.issue}`, 0.6, "monthly", `${e.issue}-01`)),
  ];
}

async function neighborhoods(): Promise<Entry[]> {
  const [records, editorial] = await Promise.all([getAllRecords(), getNeighborhoods()]);
  const hero = new Map(editorial.map((n) => [n.slug, n.hero.src]));
  // Every researched place plus the editorial ones; county-registry names are noindex and stay out.
  const full = records.filter((r) => r.research === "full");
  const slugs = [...new Set([...editorial.map((n) => n.slug), ...full.map((r) => r.slug)])];
  const bySlug = new Map(full.map((r) => [r.slug, r]));
  return slugs.map((slug) => {
    const r = bySlug.get(slug);
    // The day its sources were last checked, never later than the dataset itself.
    const checked = r ? latest(r.sources.map((src) => src.checked).filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d) && d <= DATASET_VERSION)) : undefined;
    return entry(`/neighborhoods/${slug}`, 0.7, "weekly", checked ?? DATASET_VERSION, [hero.get(slug)]);
  });
}

async function calendar(): Promise<Entry[]> {
  // Nothing that closes in the next day: by the time a crawler comes, it would be gone.
  const [events, venues] = await Promise.all([getSitemapEvents({ endingAfter: new Date(Date.now() + 24 * 3600_000) }), getVenues()]);
  const venueRead = new Map<string, string>();
  for (const e of events) {
    const at = e.live?.checkedAt;
    if (at && (!venueRead.has(e.venue.slug) || at > venueRead.get(e.venue.slug)!)) venueRead.set(e.venue.slug, at);
  }
  return [
    ...events.map((e) => entry(`/calendar/${e.slug}`, 0.6, "weekly", e.live?.checkedAt, [e.image?.src])),
    ...venues.map((v) => entry(`/venues/${v.slug}`, 0.5, "monthly", venueRead.get(v.slug), [v.image?.src])),
  ];
}

export function sitemapSection(section: SitemapSection): Promise<Entry[]> {
  return section === "neighborhoods" ? neighborhoods() : section === "calendar" ? calendar() : pages();
}

/** Where each part lives: Next serves a generateSitemaps id at /sitemaps/sitemap/<id>.xml. */
export function sitemapSectionPath(section: SitemapSection): string {
  return `/sitemaps/sitemap/${section}.xml`;
}
