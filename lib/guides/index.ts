import { FLOOD_GUIDE } from "./flood-zones-and-elevation-certificates-on-the-suncoast";
import type { Block, FigureSpec, Guide, Inline, Source, Tool } from "./types";

export * from "./types";
export { REBUILT_GUIDE_SLUGS, guideHref, isRebuiltGuide } from "./slugs";

/** Every rebuilt guide, in the order the index lists them. */
export const GUIDES: Guide[] = [FLOOD_GUIDE];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}

/** The site's tools, as a guide names them. */
export const TOOLS: Record<Tool, { href: string; name: string }> = {
  atlas: { href: "/neighborhoods", name: "Atlas" },
  "atlas-match": { href: "/neighborhoods/match", name: "Atlas match" },
  relocate: { href: "/relocate", name: "The relocation planner" },
  sold: { href: "/sell/sold", name: "Sold search" },
  "home-value": { href: "/sell/home-value", name: "Home value" },
  "net-proceeds": { href: "/sell/net-proceeds", name: "Net proceeds" },
  contact: { href: "/contact", name: "Contact" },
};

/* ---- Text, for counts and checks ---------------------------------------- */

const inlineText = (segs: Inline[]) => segs.map((s) => (typeof s === "string" ? s : s.text)).join("");

function figureStrings(f: FigureSpec): string[] {
  switch (f.type) {
    case "bar":
      return [...f.rows.flatMap((r) => [r.label, r.sub ?? "", ...r.segments.map((s) => s.label)]), ...f.legend.map((l) => l.label), f.unit];
    case "comparison":
      return [...f.columns, ...f.rows.flatMap((r) => [r.label, r.sub ?? "", ...r.cells.map((c) => (typeof c === "string" ? c : c.text))])];
    case "matrix":
      return [...f.columns, ...f.rows.flatMap((r) => [r.label, r.sub ?? ""]), f.legend.yes, f.legend.partial, f.legend.no];
    case "timeline":
      return [...f.ticks.map((t) => t.label), ...f.markers.map((m) => m.label), ...f.lanes.flatMap((l) => [l.label, l.sub ?? "", l.text ?? ""]), ...f.legend.map((l) => l.label), f.unit];
    case "worked-example":
      return [f.datum, f.zone, ...f.items.flatMap((i) => [i.code, i.label, i.value])];
    case "map-callout":
      return f.places.flatMap((p) => [p.name, p.covers, p.body, p.cta]);
    case "checklist":
      return f.items.flatMap((i) => [i.text, i.detail ?? ""]);
    case "ladder":
      return [f.columns.lender, f.columns.insurer, f.columns.building, ...f.steps.flatMap((s) => [s.code, s.name, s.means, s.lender, s.insurer, s.building])];
  }
}

function blockStrings(b: Block): { where: string; text: string }[] {
  switch (b.kind) {
    case "paragraph":
      return [{ where: "paragraph", text: inlineText(b.segs) }];
    case "definition":
      return [{ where: `definition ${b.term}`, text: `${b.term}. ${b.definition}` }];
    case "pull-quote":
      return [{ where: "pull quote", text: b.text }];
    case "subhead":
      return [{ where: "subhead", text: b.text }];
    case "table":
      return [{ where: `table ${b.title}`, text: b.title }, ...b.columns.map((c) => ({ where: `table ${b.title} column`, text: c })), ...b.rows.flat().map((c) => ({ where: `table ${b.title} cell`, text: c }))];
    case "callout":
      return [{ where: `callout ${b.tool}`, text: `${b.eyebrow}. ${b.body} ${b.cta}` }];
    case "figure":
      return [
        { where: `figure ${b.title}`, text: `${b.eyebrow}. ${b.title} ${b.reading}` },
        ...(b.note ? [{ where: `figure ${b.title} note`, text: b.note }] : []),
        { where: `figure ${b.title} source`, text: b.source.label },
        ...(b.tool ? [{ where: `figure ${b.title} tool`, text: b.tool.cta }] : []),
        ...figureStrings(b.figure).filter(Boolean).map((text) => ({ where: `figure ${b.title} data`, text })),
      ];
  }
}

/** Every string a guide puts on the page, with where it came from, for the Fair Housing and house-rule checks. */
export function guideStrings(g: Guide): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (where: string, text: string) => out.push({ where: `${g.slug}: ${where}`, text });
  add("title", g.title);
  add("promise", g.promise);
  add("cover alt", g.cover.alt);
  g.howToUse.forEach((t, i) => add(`how to use ${i + 1}`, t));
  g.questions.forEach((t, i) => add(`question ${i + 1}`, t));
  g.sections.forEach((s, i) => {
    add(`section ${i + 1} title`, s.title);
    add(`section ${i + 1} lead`, s.lead);
    s.blocks.forEach((b, j) => blockStrings(b).forEach((x) => add(`section ${i + 1} block ${j + 1} ${x.where}`, x.text)));
    s.sources.forEach((src, j) => add(`section ${i + 1} source ${j + 1}`, `${src.label} ${src.note ?? ""}`));
  });
  add("one page title", g.onOnePage.title);
  add("one page reading", g.onOnePage.reading);
  g.onOnePage.rows.forEach((r, i) => add(`one page row ${i + 1}`, `${r.label} ${r.value}`));
  add("next", `${g.next.eyebrow} ${g.next.title} ${g.next.body} ${g.next.cta}`);
  return out;
}

/** The running text a reader reads: paragraphs, leads, definitions, figures' text. Source lines are left out. */
export function guideWordCount(g: Guide): number {
  const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
  return guideStrings(g)
    .filter((s) => !/\bsource\b/.test(s.where))
    .reduce((n, s) => n + words(s.text), 0);
}

/** Reading time at 230 words a minute, rounded up, plus a minute for every two figures. */
export function guideReadingMinutes(g: Guide): number {
  const figures = g.sections.flatMap((s) => s.blocks).filter((b) => b.kind === "figure").length;
  return Math.ceil(guideWordCount(g) / 230 + figures / 2);
}

/** All distinct sources across a guide, in first-use order, for the foot. */
export function guideSources(g: Guide): Source[] {
  const seen = new Map<string, Source>();
  for (const s of g.sections) for (const src of s.sources) seen.set(src.label, src);
  return [...seen.values()];
}

/** The figures in page order with their running number, for the foot's figure-sources list. */
export function guideFigures(g: Guide): { number: number; sectionIndex: number; title: string; source: Source }[] {
  let n = 0;
  const out: { number: number; sectionIndex: number; title: string; source: Source }[] = [];
  g.sections.forEach((s, i) => {
    for (const b of s.blocks) if (b.kind === "figure") out.push({ number: (n += 1), sectionIndex: i, title: b.title, source: b.source });
  });
  return out;
}
