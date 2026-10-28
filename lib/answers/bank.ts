import type { Neighborhood as EditorialPlace } from "../content/types";
import type { Guide } from "../guides/types";
import type { HubCopy } from "../hubs/copy";
import { publisherOf } from "../neighborhoods/sources";
import type { NeighborhoodRecord } from "../neighborhoods/types";
import type { AnswerBank, DefinitionEntry, FactField, FaqEntry, PlaceFacts, PlaceRef } from "./types";

/**
 * The answer bank: everything the answer card may say, built from the same
 * data the pages render and the search index reads. Pure, no I/O, so the
 * tests build it from the real content. Nothing here adds a word: every
 * answer is a question and answer already on a page, a guide's own
 * definition, or a field of an Atlas record with the source it cites.
 */

const MARKET_NAME: Record<string, string> = { "lakewood-ranch": "Lakewood Ranch", sarasota: "Sarasota", bradenton: "Bradenton" };

export const MARKETS: PlaceRef[] = [
  { key: "market:lakewood-ranch", name: "Lakewood Ranch", market: "lakewood-ranch", names: ["Lakewood Ranch", "LWR"], url: "/lakewood-ranch" },
  { key: "market:sarasota", name: "Sarasota", market: "sarasota", names: ["Sarasota"], url: "/sarasota" },
  { key: "market:bradenton", name: "Bradenton", market: "bradenton", names: ["Bradenton"], url: "/bradenton" },
];

/** The `supports` key each fact is cited under in the record's sources. */
const FIELD_KEY: Record<FactField, string> = {
  county: "county",
  gated: "gated",
  hoa: "hoa",
  cdd: "cdd",
  evacuation: "evacuationzone",
  zips: "zip",
  jurisdiction: "jurisdiction",
  water: "wateraccess",
};

/** The newest source that cites a field, skipping any the research marked unverified. */
function sourceFor(r: NeighborhoodRecord, field: FactField): PlaceFacts["sources"][FactField] {
  const key = FIELD_KEY[field];
  const cited = r.sources
    .filter((s) => !/not verified/i.test(s.supports))
    .filter((s) =>
      s.supports
        .toLowerCase()
        .split(",")
        .some((f) => f.trim().startsWith(key)),
    )
    .sort((a, b) => b.checked.localeCompare(a.checked));
  const s = cited[0];
  return s ? { label: publisherOf(s.url), url: s.url, checked: s.checked } : undefined;
}

export function placeFactsOf(r: NeighborhoodRecord): PlaceFacts {
  const sources: PlaceFacts["sources"] = {};
  for (const f of Object.keys(FIELD_KEY) as FactField[]) {
    const s = sourceFor(r, f);
    if (s) sources[f] = s;
  }
  return {
    key: `place:${r.slug}`,
    name: r.name,
    market: r.market,
    names: [r.name, ...r.aliases],
    url: `/neighborhoods/${r.slug}`,
    county: r.county,
    gated: r.gated,
    hoa: r.hoa?.name ?? null,
    cdd: r.cdd?.name ?? null,
    evacuation: r.evacuationZone,
    zips: r.zips,
    jurisdiction: r.jurisdiction,
    water: r.waterAccess,
    sources,
  };
}

export type BankInput = {
  hubs: HubCopy[];
  /** The editorial neighborhood pages (lib/content), with their written questions. */
  editorial: EditorialPlace[];
  /** Atlas records; only the researched ones are used, as on the search index. */
  records: NeighborhoodRecord[];
  relocate: { q: string; answer: string }[];
  home: { q: string; answer: string }[];
  guides: Guide[];
};

export function buildBank(input: BankInput): AnswerBank {
  const faqs: FaqEntry[] = [];
  for (const h of input.hubs) {
    h.faqs.forEach((f, i) =>
      faqs.push({ kind: "faq", id: `hub:${h.slug}#${i + 1}`, q: f.q, answer: f.answer, url: `/${h.slug}#hub-faq-title`, page: `the ${MARKET_NAME[h.slug] ?? h.slug} page`, pageKey: `market:${h.slug}` }),
    );
  }
  for (const n of input.editorial) {
    (n.faqs ?? []).forEach((f, i) =>
      faqs.push({ kind: "faq", id: `place:${n.slug}#${i + 1}`, q: f.q, answer: f.answer, url: `/neighborhoods/${n.slug}#nb-faq-title`, page: `${n.name} in Atlas`, pageKey: `place:${n.slug}` }),
    );
  }
  input.relocate.forEach((f, i) => faqs.push({ kind: "faq", id: `relocate#${i + 1}`, q: f.q, answer: f.answer, url: "/relocate#faq-title", page: "Atlas Move" }));
  input.home.forEach((f, i) => faqs.push({ kind: "faq", id: `home#${i + 1}`, q: f.q, answer: f.answer, url: "/#questions-title", page: "our common questions" }));

  // A term two guides define is answered once, by the first guide that defines it.
  const definitions: DefinitionEntry[] = [];
  const seen = new Set<string>();
  for (const g of input.guides) {
    for (const s of g.sections) {
      for (const b of s.blocks) {
        if (b.kind !== "definition") continue;
        const k = b.term.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        definitions.push({ kind: "definition", id: `guide:${g.slug}#${s.id}`, term: b.term, definition: b.definition, url: `/guides/${g.slug}#${s.id}`, page: g.title, section: s.title });
      }
    }
  }

  // Editorial pages without a record still name a place (the search index does the same).
  const records = input.records.filter((r) => r.research === "full");
  const places = records.map(placeFactsOf);
  const known = new Set(places.map((p) => p.key));
  for (const n of input.editorial) {
    if (known.has(`place:${n.slug}`)) continue;
    places.push({
      key: `place:${n.slug}`,
      name: n.name,
      market: n.market,
      names: [n.name],
      url: `/neighborhoods/${n.slug}`,
      county: null,
      gated: null,
      hoa: null,
      cdd: null,
      evacuation: null,
      zips: [],
      jurisdiction: null,
      water: null,
      sources: {},
    });
  }
  return { faqs, definitions, places, markets: MARKETS };
}
