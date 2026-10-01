import type { MetadataRoute } from "next";
import {
  getEventSlugs,
  getListingSlugs,
  getNeighborhoodSlugs,
  getPostSlugs,
  getVenueSlugs,
} from "@/lib/content";
import { MARKETS } from "@/lib/content/markets";
import { getGuideSlugs } from "@/lib/guides";
import { isRebuiltGuide } from "@/lib/guides/slugs";
import { getIndexableSlugs } from "@/lib/neighborhoods/data";
import { absoluteUrl } from "@/lib/seo";
import { TIDE_ISSUES } from "@/lib/tide/issues";

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  // The three market hubs: the first page to read for each place.
  ...MARKETS.map((m) => ({ path: `/${m.slug}`, priority: 0.9, changeFrequency: "weekly" as const })),
  { path: "/listings", priority: 0.9, changeFrequency: "daily" },
  { path: "/calendar", priority: 0.9, changeFrequency: "daily" },
  { path: "/calendar/plan", priority: 0.6, changeFrequency: "weekly" },
  { path: "/neighborhoods", priority: 0.8, changeFrequency: "weekly" },
  { path: "/neighborhoods/match", priority: 0.6, changeFrequency: "monthly" },
  { path: "/buy", priority: 0.7, changeFrequency: "monthly" },
  { path: "/relocate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sell", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sell/sold", priority: 0.6, changeFrequency: "weekly" },
  { path: "/sell/home-value", priority: 0.7, changeFrequency: "weekly" },
  { path: "/sell/net-proceeds", priority: 0.6, changeFrequency: "monthly" },
  { path: "/valuation", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/tide", priority: 0.6, changeFrequency: "monthly" },
  { path: "/guides", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  // /from/* are bio and post links: noindex and left out on purpose.
  { path: "/refer", priority: 0.4, changeFrequency: "yearly" },
  { path: "/reviews", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, events, venues, editorial, catalog, posts] = await Promise.all([
    getListingSlugs(),
    getEventSlugs(),
    getVenueSlugs(),
    getNeighborhoodSlugs(),
    getIndexableSlugs(),
    getPostSlugs(),
  ]);
  // Every researched place plus the editorial ones; county-registry names are noindex and stay out.
  const neighborhoods = [...new Set([...editorial, ...catalog])];
  const now = new Date();
  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    ...STATIC.map((s) => entry(s.path, s.priority, s.changeFrequency)),
    ...listings.map((s) => entry(`/listings/${s}`, 0.8, "weekly" as const)),
    ...events.map((s) => entry(`/calendar/${s}`, 0.6, "weekly" as const)),
    ...venues.map((s) => entry(`/venues/${s}`, 0.5, "monthly" as const)),
    ...neighborhoods.map((s) => entry(`/neighborhoods/${s}`, 0.7, "weekly" as const)),
    ...posts.filter((s) => !isRebuiltGuide(s)).map((s) => entry(`/blog/${s}`, 0.5, "monthly" as const)),
    ...getGuideSlugs().map((s) => entry(`/guides/${s}`, 0.7, "monthly" as const)),
    ...TIDE_ISSUES.map((e) => entry(`/tide/${e.issue}`, 0.6, "monthly" as const)),
  ];
}
