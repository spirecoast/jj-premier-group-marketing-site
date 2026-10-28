import { getSiteSettings, getTeam } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { guideMarkdown } from "@/lib/guides/markdown";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 86400;

/**
 * /llms-full.txt: the guides' full text in one Markdown file, the companion /llms.txt points at
 * (llmstxt.org). Built from the same guide data as the pages, so it never drifts from them.
 */
export async function GET() {
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()]);
  const head = [
    `# ${site.name}: the guides`,
    "",
    `> The full text of the ${GUIDES.length} guides on ${absoluteUrl("/guides")}, written by ${team.map((m) => m.name).join(" and ")}, licensed agents with ${settings.brokerageName} in Lakewood Ranch, Sarasota and Bradenton, Florida. Each section ends with the sources it was checked against. General information about places and rules, not legal, insurance or tax advice. The index of the whole site is ${absoluteUrl("/llms.txt")}.`,
    "",
  ];
  const body = GUIDES.map((g) => guideMarkdown(g, absoluteUrl));
  return new Response([...head, ...body].join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
