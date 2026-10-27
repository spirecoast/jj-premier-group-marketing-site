import type { MetadataRoute } from "next";
import { SITEMAP_SECTIONS, sitemapSection, type SitemapSection } from "@/lib/sitemap";

export const revalidate = 3600;

/** The three parts of the sitemap; /sitemap.xml is their index (app/sitemap.xml/route.ts). */
export async function generateSitemaps() {
  return SITEMAP_SECTIONS.map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = (await props.id) as SitemapSection;
  return SITEMAP_SECTIONS.includes(id) ? sitemapSection(id) : [];
}
