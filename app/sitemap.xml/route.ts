import { SITEMAP_SECTIONS, latest, sitemapSection, sitemapSectionPath } from "@/lib/sitemap";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/**
 * /sitemap.xml: the index of the three parts (pages, neighborhoods, calendar), each with the latest
 * date among its own pages, so Search Console reports each part on its own. robots.txt points here.
 */
export async function GET() {
  const parts = await Promise.all(
    SITEMAP_SECTIONS.map(async (section) => {
      const entries = await sitemapSection(section);
      const lastmod = latest(entries.map((e) => (e.lastModified instanceof Date ? e.lastModified.toISOString() : e.lastModified)));
      return `<sitemap><loc>${absoluteUrl(sitemapSectionPath(section))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts.join("\n")}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } });
}
