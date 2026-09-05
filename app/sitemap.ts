import type { MetadataRoute } from "next";
import {
  getEventSlugs,
  getListingSlugs,
  getNeighborhoodSlugs,
  getPostSlugs,
  getVenueSlugs,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/listings", priority: 0.9, changeFrequency: "daily" },
  { path: "/calendar", priority: 0.9, changeFrequency: "daily" },
  { path: "/neighborhoods", priority: 0.8, changeFrequency: "weekly" },
  { path: "/buy", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sell", priority: 0.7, changeFrequency: "monthly" },
  { path: "/valuation", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, events, venues, neighborhoods, posts] = await Promise.all([
    getListingSlugs(),
    getEventSlugs(),
    getVenueSlugs(),
    getNeighborhoodSlugs(),
    getPostSlugs(),
  ]);
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
    ...posts.map((s) => entry(`/blog/${s}`, 0.5, "monthly" as const)),
  ];
}
