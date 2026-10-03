import type { Event, Neighborhood, Post, Venue } from "@/lib/content/types";
import { guideStrings, type Guide } from "@/lib/guides";
import type { HubCopy } from "@/lib/hubs/copy";
import type { NeighborhoodRecord } from "@/lib/neighborhoods/types";
import type { IssueModel } from "@/lib/tide/issue";
import type { PageSummary } from "./copy";
import { clean, portableTextSections, toChunks } from "./text";
import type { Chunk } from "./types";

/**
 * The site's content, turned into search chunks. Pure functions over the
 * same data the pages render: the loader (lib/search/load.ts) fetches the
 * data, these shape it. Ids are readable and stable:
 *
 *   guide:<slug>, guide:<slug>#<section>, guide:<slug>#on-one-page
 *   place:<slug>, place:<slug>#faq
 *   post:<slug>, post:<slug>#<n>         (Tide posts at /blog)
 *   tide:<issue>, tide:<issue>#what       (Tide issues at /tide)
 *   event:<slug>, venue:<slug>
 *   page:<path>, page:<path>#<part>
 *
 * A chunk that runs long is split, and the later parts get "~2", "~3".
 * Nothing here adds a fact: every word comes from the page's own data.
 */

const MARKET_NAME: Record<string, string> = { "lakewood-ranch": "Lakewood Ranch", sarasota: "Sarasota", bradenton: "Bradenton" };
const marketName = (m: string) => MARKET_NAME[m] ?? m;

const sentence = (s: string) => {
  const t = clean(s);
  return !t || /[.!?…:]["’”)]?$/.test(t) ? t : `${t}.`;
};
const list = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ---- Guides ---------------------------------------------------------------- */

/**
 * A guide as chunks: the cover (promise, how to use it, the three questions),
 * one or more per section (lead, paragraphs, definitions, tables, figures'
 * words; source lines left out), and the "On one page" summary. Built from
 * guideStrings(), the same strings the house-rule checks read.
 */
export function guideChunks(g: Guide): Chunk[] {
  const url = `/guides/${g.slug}`;
  const strings = guideStrings(g).filter((s) => !/\bsource\b/.test(s.where));
  const where = (s: { where: string }) => s.where.slice(g.slug.length + 2);

  const cover = strings.filter((s) => /^(promise|how to use \d+|question \d+)$/.test(where(s))).map((s) => s.text);
  const out: Chunk[] = toChunks({ id: `guide:${g.slug}`, kind: "guide", title: g.title, url }, cover);

  g.sections.forEach((section, i) => {
    const n = i + 1;
    // One unit per block: a table's cells or a figure's labels are joined so
    // each block reads as one run of text.
    const units = new Map<string, string[]>();
    for (const s of strings) {
      const w = where(s);
      const m = w.match(new RegExp(`^section ${n} (lead|block (\\d+))\\b`));
      if (!m) continue;
      const key = m[1] === "lead" ? "lead" : `block ${m[2]}`;
      const arr = units.get(key) ?? [];
      if (s.text.trim()) arr.push(sentence(s.text));
      units.set(key, arr);
    }
    const paragraphs = [...units.values()].map((parts) => parts.join(" ")).filter(Boolean);
    out.push(...toChunks({ id: `guide:${g.slug}#${section.id}`, kind: "guide", title: g.title, sectionTitle: section.title, url: `${url}#${section.id}` }, paragraphs));
  });

  const onePage = [g.onOnePage.reading, ...g.onOnePage.rows.map((r) => `${sentence(r.label)} ${r.value}`)];
  out.push(...toChunks({ id: `guide:${g.slug}#on-one-page`, kind: "guide", title: g.title, sectionTitle: g.onOnePage.title, url: `${url}#on-one-page` }, onePage));
  return out;
}

/* ---- Neighborhoods ----------------------------------------------------------- */

const WATER: Record<string, string> = {
  "gulf-front": "On the Gulf",
  bayfront: "On the bay",
  canal: "Canal access",
  river: "On the river",
  lake: "On a lake",
  none: "No water access",
};
const STATUS: Record<string, string> = {
  selling: "Homes are selling new.",
  "coming-soon": "Coming soon.",
  established: "Established.",
  "built-out": "Built out.",
};

/**
 * The facts a place page shows, as sentences. Zoned schools are left out of
 * the index on purpose (they belong on the place page, beside the district
 * locator and the zoning note), as are the research notes and anything
 * age-related.
 */
export function placeFacts(r: NeighborhoodRecord, parentName?: string): string[] {
  const kind = r.type ?? r.level;
  const where = [parentName, marketName(r.market)].filter(Boolean).join(", ");
  const facts = [
    `${r.name} is ${/^[aeiou]/i.test(kind) ? "an" : "a"} ${kind} in ${where}${r.county ? `, ${r.county} County` : ""}.`,
    r.aliases.length ? `Also known as ${list(r.aliases)}.` : "",
    r.description ?? "",
    r.jurisdiction ? `Jurisdiction: ${r.jurisdiction}.` : "",
    r.zips.length ? `ZIP code${r.zips.length > 1 ? "s" : ""}: ${list(r.zips)}.` : "",
    r.status ? STATUS[r.status] ?? "" : "",
    r.developer ? `Developer: ${r.developer}.` : "",
    r.activeBuilders.length ? `Builders selling there: ${list(r.activeBuilders)}.` : "",
    r.yearsBuilt ? `Built: ${r.yearsBuilt}.` : "",
    r.homeTypes.length ? `Home types: ${list(r.homeTypes)}.` : "",
    r.homeCount ? `About ${r.homeCount.toLocaleString("en-US")} homes.` : "",
    r.gated === true ? "Gated." : r.gated === false ? "Not gated." : "",
    r.hoa?.name ? `Association: ${r.hoa.name}.` : "",
    r.cdd?.name ? `Community development district: ${r.cdd.name}.` : "",
    r.amenities.length ? `Amenities: ${list(r.amenities)}.` : "",
    r.waterAccess ? `${WATER[r.waterAccess] ?? r.waterAccess}.` : "",
    r.evacuationZone === "none" ? "Outside every evacuation zone." : r.evacuationZone ? `Evacuation zone ${r.evacuationZone}.` : "",
  ];
  return facts.map(clean).filter(Boolean);
}

/**
 * A place: the researched record (Atlas) and, for the editorial places, the
 * overview, highlights and questions from the content layer. Either may be
 * missing. County-registry names aren't indexed: their pages are noindex.
 */
export function placeChunks(input: { slug: string; record?: NeighborhoodRecord; parentName?: string; editorial?: Neighborhood }): Chunk[] {
  const { slug, record, editorial } = input;
  if (record && record.research !== "full" && !editorial) return [];
  const name = editorial?.name ?? record?.name ?? slug;
  const url = `/neighborhoods/${slug}`;
  const what = record ? (record.type ?? record.level) : "neighborhood";
  const market = record?.market ?? editorial!.market;
  const sectionTitle = `${what.charAt(0).toUpperCase()}${what.slice(1)} in ${input.parentName ?? marketName(market)}`;
  const paragraphs = [
    editorial?.tagline ?? "",
    ...(editorial ? portableTextSections(editorial.overview).flatMap((s) => s.paragraphs) : []),
    ...(editorial?.highlights.map((h) => sentence(`${h.label}: ${h.description}`)) ?? []),
    ...(record ? [placeFacts(record, input.parentName).join(" ")] : []),
  ];
  const out = toChunks({ id: `place:${slug}`, kind: "neighborhood", title: name, sectionTitle, url }, paragraphs);
  if (editorial?.faqs?.length) {
    out.push(...toChunks({ id: `place:${slug}#faq`, kind: "neighborhood", title: name, sectionTitle: "Questions people ask", url: `${url}#nb-faq-title` }, editorial.faqs.map((f) => `${f.q} ${f.answer}`)));
  }
  return out;
}

/* ---- Tide ---------------------------------------------------------------------- */

/** A post at /blog/<slug> (the guides that moved to /guides are indexed there instead). */
export function postChunks(p: Post): Chunk[] {
  const url = `/blog/${p.slug}`;
  const sections = portableTextSections(p.body);
  const out: Chunk[] = [];
  sections.forEach((s, i) => {
    const paragraphs = i === 0 ? [p.excerpt, ...s.paragraphs] : s.paragraphs;
    const id = i === 0 && s.heading === null ? `post:${p.slug}` : `post:${p.slug}#${slugify(s.heading ?? String(i))}`;
    out.push(...toChunks({ id, kind: "post", title: p.title, sectionTitle: s.heading ?? undefined, url }, paragraphs));
  });
  if (!out.length) out.push(...toChunks({ id: `post:${p.slug}`, kind: "post", title: p.title, url }, [p.excerpt]));
  return out;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** A Tide issue: the cover note with each market's figures (computed, as on the page) and "What it means". */
export function tideChunks(m: IssueModel): Chunk[] {
  const url = `/tide/${m.issue}`;
  const markets = m.markets.map((x) => {
    const s = x.stats;
    const parts = [
      `${s.count.toLocaleString("en-US")} qualified home sales`,
      s.medianPrice !== null ? `median price ${usd(s.medianPrice)}` : "",
      s.medianPpsf !== null ? `median ${usd(s.medianPpsf)} per square foot` : "",
      s.newBuildPct !== null ? `${s.newBuildPct}% new builds or vacant on the roll` : "",
    ].filter(Boolean);
    return `${x.name} in ${m.dataLabel}: ${list(parts)}.`;
  });
  const out = toChunks({ id: `tide:${m.issue}`, kind: "post", title: m.title, sectionTitle: m.eyebrow, url }, [m.description, m.note, m.intro, ...markets]);
  if (m.commentary?.length) {
    out.push(...toChunks({ id: `tide:${m.issue}#what`, kind: "post", title: m.title, sectionTitle: "What it means", url: `${url}#what-title` }, m.commentary));
  }
  return out;
}

/* ---- Encore ------------------------------------------------------------------- */

const CATEGORY_LABEL: Record<string, string> = {
  music: "Music",
  theater: "Theater",
  gallery: "Galleries",
  festival: "Festivals",
  family: "Family",
  market: "Markets",
  film: "Film",
  talks: "Talks",
};

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
const day = (iso: string) => dayFmt.format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso));

/**
 * An event: what it is, who presents it, where, and the dates it runs. Only
 * stable facts, so the chunk changes when the production does, not as its
 * next date moves.
 */
export function eventChunk(e: Event): Chunk {
  const perfs = e.performances ?? [];
  const first = perfs[0]?.startsAt ?? e.firstDate ?? e.startsAt;
  const last = perfs[perfs.length - 1]?.startsAt ?? e.runsThrough ?? e.endsAt ?? first;
  const span = day(first) === day(last) ? `On ${day(first)}.` : `From ${day(first)} to ${day(last)}${perfs.length > 1 ? `, ${perfs.length} dates` : ""}.`;
  const place = [e.venue.name, e.venue.address?.city].filter(Boolean).join(", ");
  const category = CATEGORY_LABEL[e.category] ?? e.category;
  const body = [
    e.summary,
    e.presenter && e.presenter !== e.venue.name ? `Presented by ${e.presenter}.` : "",
    `${category}${e.subcategory ? `, ${e.subcategory}` : ""}, at ${place}${e.room ? `, ${e.room}` : ""}.`,
    span,
    e.status === "sold-out" ? "Sold out." : "",
  ];
  return { id: `event:${e.slug}`, kind: "event", title: e.title, sectionTitle: `${category} at ${e.venue.name}`, url: `/calendar/${e.slug}`, body: body.map(sentence).filter(Boolean).join(" ") };
}

/** A venue: where it is and what it puts on the calendar (by category, which changes slowly). */
export function venueChunk(v: Venue, events: Event[]): Chunk {
  const cats = [...new Set(events.filter((e) => e.venue.slug === v.slug).map((e) => (CATEGORY_LABEL[e.category] ?? e.category).toLowerCase()))].sort();
  const address = [v.address.street, v.address.city].filter(Boolean).join(", ");
  const body = [
    `${v.name}${address ? `, ${address}` : ""}${v.address.city === marketName(v.market) ? "" : `, in the ${marketName(v.market)} area`}.`,
    cats.length ? `On the Encore calendar: ${list(cats)}.` : "",
    v.website ? `Website: ${v.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}.` : "",
  ];
  return { id: `venue:${v.slug}`, kind: "venue", title: v.name, sectionTitle: `Venue in ${marketName(v.market)}`, url: `/venues/${v.slug}`, body: body.filter(Boolean).join(" ") };
}

/* ---- Pages ---------------------------------------------------------------------- */

export function pageChunks(pages: PageSummary[]): Chunk[] {
  return pages.flatMap((p) => toChunks({ id: `page:${p.url}`, kind: "page", title: p.title, url: p.url }, p.summary));
}

/** A market hub (/lakewood-ranch, /sarasota, /bradenton): orientation, buying and selling here, and its questions. */
export function hubChunks(h: HubCopy): Chunk[] {
  const url = `/${h.slug}`;
  const title = marketName(h.slug);
  return [
    ...toChunks({ id: `page:${url}`, kind: "page", title, sectionTitle: "The market", url }, [h.description, ...h.orientation]),
    ...toChunks({ id: `page:${url}#buying`, kind: "page", title, sectionTitle: "Buying here", url: `${url}#buysell-title` }, h.buying),
    ...toChunks({ id: `page:${url}#selling`, kind: "page", title, sectionTitle: "Selling here", url: `${url}#buysell-title` }, h.selling),
    ...toChunks({ id: `page:${url}#faq`, kind: "page", title, sectionTitle: "Questions people ask first", url: `${url}#hub-faq-title` }, h.faqs.map((f) => `${f.q} ${f.answer}`)),
  ];
}

/** The relocation page's three written sections. */
export function relocateChunks(input: {
  different: { title: string; cards: { title: string; body: string }[] };
  fromAway: { title: string; items: { title: string; body: string }[] };
  faqs: { q: string; answer: string }[];
  faqTitle: string;
}): Chunk[] {
  const title = "Moving to the Suncoast";
  return [
    ...toChunks({ id: "page:/relocate#different", kind: "page", title, sectionTitle: input.different.title, url: "/relocate#different-title" }, input.different.cards.map((c) => `${sentence(c.title)} ${c.body}`)),
    ...toChunks({ id: "page:/relocate#away", kind: "page", title, sectionTitle: input.fromAway.title, url: "/relocate#away-title" }, input.fromAway.items.map((c) => `${sentence(c.title)} ${c.body}`)),
    ...toChunks({ id: "page:/relocate#faq", kind: "page", title, sectionTitle: input.faqTitle, url: "/relocate#faq-title" }, input.faqs.map((f) => `${f.q} ${f.answer}`)),
  ];
}

/** Ids must be unique; a duplicate means two chunks would overwrite each other. Throws with the ids. */
export function assertUniqueIds(chunks: Chunk[]): void {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const c of chunks) (seen.has(c.id) ? dupes : seen).add(c.id);
  if (dupes.size) throw new Error(`Duplicate search chunk ids: ${[...dupes].slice(0, 10).join(", ")}`);
}
