import { getSiteSettings, getTeam } from "@/lib/content";
import { MARKETS } from "@/lib/content/markets";
import { GUIDES, guideHref } from "@/lib/guides";
import { getAllRecords } from "@/lib/neighborhoods/data";
import { TYPE_LABEL } from "@/lib/neighborhoods/format";
import { absoluteUrl } from "@/lib/seo";
import { productFamilies, site } from "@/lib/site";
import { TIDE_ISSUES } from "@/lib/tide/issues";

export const revalidate = 86400;

/**
 * /llms.txt: the site in plain Markdown for AI assistants and answer engines
 * (llmstxt.org). Who the team is, the three places, every neighborhood Atlas
 * has researched, the tools and the guides, each with its address, built from the same data as the pages so it never
 * drifts from them.
 */
export async function GET() {
  const [settings, team, records] = await Promise.all([getSiteSettings(), getTeam(), getAllRecords()]);
  // Every place researched in full (the ones in the sitemap), by market, areas first, then A to Z.
  const researched = records.filter((r) => r.research === "full");
  const placeLine = (r: (typeof researched)[number]) =>
    link(r.name, `/neighborhoods/${r.slug}`, [r.type ? TYPE_LABEL[r.type] : r.level === "area" ? "Area" : null, r.jurisdiction].filter(Boolean).join(", ") || undefined);
  const link = (label: string, path: string, note?: string) => `- [${label}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.name} is a real estate team in ${MARKETS.map((m) => m.name).join(", ").replace(/, ([^,]*)$/, " and $1")}, Florida: ${team.map((m) => m.name).join(" and ")}, licensed agents with ${settings.brokerageName}. They help people buy and sell homes on Florida's Gulf Coast. Phone ${settings.primaryPhoneDisplay}.`,
    "",
    "The site's figures come from public records (the Manatee and Sarasota County property appraisers, FEMA, the State of Florida) and say where each comes from. The tools give estimates for planning, not quotes or appraisals.",
    "",
    "## Places",
    ...MARKETS.map((m) => link(m.name, `/${m.slug}`, m.blurb)),
    "",
    "## Neighborhoods",
    `Atlas (${absoluteUrl("/neighborhoods")}) has a page for each place below: jurisdiction, ZIPs, evacuation zone, HOA and CDD on record, builders and water, each from a county, district or association source with the day it was checked.`,
    ...MARKETS.flatMap((m) => [
      "",
      `### ${m.name}`,
      ...researched
        .filter((r) => r.market === m.slug)
        .sort((a, b) => Number(b.level === "area") - Number(a.level === "area") || a.name.localeCompare(b.name))
        .map(placeLine),
    ]),
    "",
    "## Tools",
    ...productFamilies.flatMap((f) => f.items.map((i) => link(i.label, i.href, i.line))),
    "",
    "## Guides",
    ...GUIDES.map((g) => link(g.title, guideHref(g.slug), g.promise)),
    "",
    "## Market reports",
    ...TIDE_ISSUES.map((e) => link(`Tide Market Report, ${e.issue}`, `/tide/${e.issue}`)),
    "",
    "## The team",
    link(`About ${team.map((m) => m.name).join(" and ")}`, "/about"),
    link("Contact", "/contact"),
    link("Buyer's guide", "/buy"),
    link("Seller's guide", "/sell"),
    "",
    "## Optional",
    link("The guides in full", "/llms-full.txt", "every guide's text in one Markdown file, with its sources"),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
