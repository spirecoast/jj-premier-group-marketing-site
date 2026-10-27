import { TOOLS } from "./index";
import type { Block, Guide, Inline, Source } from "./types";

/**
 * A guide as plain Markdown, for /llms-full.txt: the same words the page carries, in its order, with
 * every link and source. Figures give their title and their reading line (the sentence that says what
 * the drawing shows); their drawn data stays on the page. `url` turns a site path into an address.
 */
export function guideMarkdown(g: Guide, url: (path: string) => string): string {
  const abs = (href: string) => (href.startsWith("/") ? url(href) : href);
  const inline = (segs: Inline[]) => segs.map((s) => (typeof s === "string" ? s : `[${s.text}](${abs(s.href)})`)).join("");
  const source = (s: Source) => (s.href ? `[${s.label}](${abs(s.href)})` : s.label) + (s.note ? ` (${s.note})` : "");
  const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const block = (b: Block): string | null => {
    switch (b.kind) {
      case "paragraph":
        return inline(b.segs);
      case "definition":
        return `**${b.term}.** ${b.definition}`;
      case "pull-quote":
        return `> ${b.text}`;
      case "subhead":
        return `### ${b.text}`;
      case "table":
        return [`**${b.title}**`, "", `| ${b.columns.map(cell).join(" | ")} |`, `| ${b.columns.map(() => "---").join(" | ")} |`, ...b.rows.map((r) => `| ${r.map(cell).join(" | ")} |`), "", `Source: ${source(b.source)}`].join("\n");
      case "callout":
        return `${b.body} [${b.cta}](${url(TOOLS[b.tool].href)})`;
      case "figure":
        return [`**${b.title}.** ${b.reading}`, b.note ?? "", `Source: ${source(b.source)}`].filter(Boolean).join("\n\n");
    }
  };
  const out = [
    `## ${g.title}`,
    "",
    `${url(`/guides/${g.slug}`)} · By ${g.author.name} · Updated ${g.updatedAt}`,
    "",
    g.promise,
    "",
  ];
  for (const s of g.sections) {
    out.push(`### ${s.title}`, "", s.lead, "");
    for (const b of s.blocks) {
      const text = block(b);
      if (text) out.push(text.startsWith("### ") ? `#${text}` : text, "");
    }
    if (s.sources.length) out.push("Sources:", ...s.sources.map((src) => `- ${source(src)}`), "");
  }
  out.push(`### ${g.onOnePage.title}`, "", g.onOnePage.reading, "", ...g.onOnePage.rows.map((r) => `- ${r.label}: ${r.value}`), "");
  return out.join("\n");
}
