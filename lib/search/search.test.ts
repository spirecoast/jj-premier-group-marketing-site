import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { NEIGHBORHOODS } from "../content/seed/neighborhoods";
import { POSTS } from "../content/seed/posts";
import { checkFairHousing } from "../fair-housing";
import { GUIDES } from "../guides";
import { HUBS } from "../hubs/copy";
import type { NeighborhoodRecord } from "../neighborhoods/types";
import { DIFFERENT, FAQS, FAQ_SECTION, FROM_AWAY } from "../relocate/copy";
import { PAGE_SUMMARIES, SUGGESTED_SEARCHES } from "./copy";
import { EMBED_DIMS, EmbedError, embedConfig, embedTexts } from "./embed";
import { highlight, keywordSearch, stem, tokenize } from "./fallback";
import { planReindex, reindex, type SearchStore, type StoredRow, type WriteRow } from "./indexer";
import { KEYWORD_ONLY_VECTOR, RateLimiter, TtlCache, cacheKey, clientIp, hybridSql, normalizeQuery, rowsToHits, vectorLiteral } from "./query";
import { excerpt, snippetParts, tidySnippet } from "./snippet";
import { assertUniqueIds, eventChunk, guideChunks, hubChunks, pageChunks, placeChunks, postChunks, relocateChunks, venueChunk } from "./sources";
import { CHUNK_WORDS, EMBED_MAX_CHARS, contentHash, embeddingText, packChunks, portableTextSections, sentences, toChunks, wordCount } from "./text";
import { HIGHLIGHT, MAX_PER_PAGE, resultsBucket, variedResults, type Chunk } from "./types";

const S = HIGHLIGHT.start;
const E = HIGHLIGHT.stop;
const words = (n: number, w = "word") => Array.from({ length: n }, (_, i) => `${w}${i}`).join(" ");

/** Every chunk the pure sources build from the repo's own content (no Atlas file, no Tide data, no Encore). */
function staticChunks(): Chunk[] {
  return [
    ...pageChunks(PAGE_SUMMARIES),
    ...Object.values(HUBS).flatMap(hubChunks),
    ...relocateChunks({ different: DIFFERENT, fromAway: FROM_AWAY, faqs: FAQS, faqTitle: FAQ_SECTION.title }),
    ...GUIDES.flatMap(guideChunks),
    ...NEIGHBORHOODS.flatMap((n) => placeChunks({ slug: n.slug, editorial: n })),
    ...POSTS.filter((p) => p.slug === "ask-us-about-the-water-table").flatMap(postChunks),
  ];
}

describe("chunking", () => {
  test("packs paragraphs up to the word cap and keeps their order", () => {
    const paras = [words(120, "a"), words(120, "b"), words(120, "c")];
    const chunks = packChunks(paras, { min: 150, max: 300 });
    assert.equal(chunks.length, 2);
    assert.ok(chunks[0]!.startsWith("a0") && chunks[0]!.includes("b119"));
    assert.ok(chunks[1]!.startsWith("c0"));
    for (const c of chunks) assert.ok(wordCount(c) <= 300);
  });

  test("splits a long paragraph at sentence ends, and words only when a sentence is longer than a chunk", () => {
    const para = Array.from({ length: 60 }, (_, i) => `Sentence ${i} has exactly eight words in it.`).join(" ");
    const chunks = packChunks([para], { min: 150, max: 300 });
    assert.ok(chunks.length >= 2);
    for (const c of chunks) {
      assert.ok(wordCount(c) <= 300 + 75, `chunk of ${wordCount(c)} words`);
      assert.match(c, /\.$/);
    }
    const giant = packChunks([words(700)], { min: 150, max: 300 });
    assert.deepEqual(
      giant.map((c) => wordCount(c)),
      [300, 300, 100],
    );
  });

  test("folds a short tail into the chunk before it", () => {
    const chunks = packChunks([words(280, "a"), words(40, "b")], { min: 150, max: 300 });
    assert.equal(chunks.length, 1);
    assert.equal(wordCount(chunks[0]!), 320);
  });

  test("ids: the first part keeps the id, later parts get ~2, ~3", () => {
    const chunks = toChunks({ id: "guide:x#y", kind: "guide", title: "T", url: "/guides/x#y" }, [words(300), words(300), words(300)]);
    assert.deepEqual(
      chunks.map((c) => c.id),
      ["guide:x#y", "guide:x#y~2", "guide:x#y~3"],
    );
    assert.ok(chunks.every((c) => c.url === "/guides/x#y"));
  });

  test("sentences keep their punctuation and closing quotes", () => {
    assert.deepEqual(sentences("It floods. Does it? “Yes.” Then"), ["It floods.", "Does it?", "“Yes.”", "Then"]);
  });

  test("the embedding text leads with the title and section and fits the function's limit", () => {
    const c: Chunk = { id: "x", kind: "guide", title: "Flood zones", sectionTitle: "The letters", url: "/", body: words(600) };
    const t = embeddingText(c);
    assert.ok(t.startsWith("Flood zones · The letters\n\n"));
    assert.ok(t.length <= EMBED_MAX_CHARS);
    assert.equal(embeddingText({ title: "Same", sectionTitle: "Same", body: "b" }), "Same\n\nb");
  });

  test("the content hash covers every stored field", () => {
    const c: Chunk = { id: "x", kind: "page", title: "T", url: "/a", body: "b" };
    const h = contentHash(c);
    assert.match(h, /^[0-9a-f]{64}$/);
    assert.equal(contentHash({ ...c }), h);
    for (const change of [{ title: "U" }, { url: "/b" }, { body: "c" }, { sectionTitle: "S" }, { kind: "guide" as const }]) {
      assert.notEqual(contentHash({ ...c, ...change }), h, JSON.stringify(change));
    }
    // The id isn't content: a moved chunk is a delete and an insert anyway.
    assert.equal(contentHash({ ...c, id: "y" }), h);
  });

  test("Portable Text splits into sections at each h2", () => {
    const post = POSTS.find((p) => p.slug === "ask-us-about-the-water-table")!;
    const sections = portableTextSections(post.body);
    assert.equal(sections[0]!.heading, null);
    assert.ok(sections.slice(1).every((s) => s.heading && s.paragraphs.length));
  });
});

describe("chunk sources", () => {
  const chunks = staticChunks();

  test("ids are unique and every url is a site path", () => {
    assert.doesNotThrow(() => assertUniqueIds(chunks));
    assert.throws(() => assertUniqueIds([chunks[0]!, chunks[0]!]), /Duplicate/);
    for (const c of chunks) {
      assert.match(c.url, /^\/([^/]|$)/);
      assert.ok(c.body.trim(), c.id);
      assert.ok(embeddingText(c).length <= EMBED_MAX_CHARS, c.id);
    }
  });

  test("every guide section is a chunk that links to its own anchor", () => {
    for (const g of GUIDES) {
      const own = chunks.filter((c) => c.id.startsWith(`guide:${g.slug}`));
      assert.ok(own.some((c) => c.id === `guide:${g.slug}` && c.url === `/guides/${g.slug}`));
      assert.ok(own.some((c) => c.url === `/guides/${g.slug}#on-one-page`));
      for (const s of g.sections) {
        const c = own.find((x) => x.id === `guide:${g.slug}#${s.id}`);
        assert.ok(c, `${g.slug}#${s.id}`);
        assert.equal(c.url, `/guides/${g.slug}#${s.id}`);
        assert.equal(c.sectionTitle, s.title);
        assert.ok(c.body.includes(s.lead.slice(0, 30)), `${s.id} starts with its lead`);
      }
      for (const c of own) assert.ok(wordCount(c.body) <= CHUNK_WORDS.max + CHUNK_WORDS.min / 2, `${c.id}: ${wordCount(c.body)} words`);
    }
  });

  test("guide chunks leave the source lines out", () => {
    const g = GUIDES[0]!;
    const own = chunks.filter((c) => c.id.startsWith(`guide:${g.slug}`)).map((c) => c.body).join("\n");
    const labels = g.sections.flatMap((s) => s.sources.map((x) => x.label)).filter((l) => l.length > 40);
    assert.ok(labels.length > 0);
    for (const l of labels) assert.ok(!own.includes(l), `source line in the index: ${l}`);
  });

  test("the editorial places carry their overview, and their questions link to the FAQ", () => {
    const lake = chunks.find((c) => c.id === "place:the-lake-club")!;
    assert.match(lake.body, /chain of lakes/);
    const faq = chunks.find((c) => c.id === "place:the-lake-club#faq")!;
    assert.equal(faq.url, "/neighborhoods/the-lake-club#nb-faq-title");
  });

  test("the hand-written page summaries and the copy pass the Fair Housing check", () => {
    for (const c of chunks.filter((x) => x.kind === "page")) {
      const r = checkFairHousing(`${c.title} ${c.body}`);
      assert.ok(r.passed, `${c.id}: ${JSON.stringify(r)}`);
    }
    for (const s of SUGGESTED_SEARCHES) assert.ok(s.length >= 2);
  });

  const record = (over: Partial<NeighborhoodRecord>): NeighborhoodRecord =>
    ({
      _id: "neighborhood-x",
      slug: "x",
      name: "Palm Grove",
      aliases: [],
      level: "community",
      parentSlug: null,
      market: "sarasota",
      bradentonArea: false,
      jurisdiction: "Sarasota County",
      county: "Sarasota",
      zips: ["34238"],
      lat: null,
      lng: null,
      type: "gated community",
      developer: null,
      activeBuilders: ["Builder One"],
      yearsBuilt: "1998–2004",
      homeTypes: ["single-family", "villa"],
      homeCount: 1200,
      gated: true,
      ageRestricted: true,
      hoa: { name: "Palm Grove HOA", website: null },
      cdd: null,
      amenities: ["pool"],
      waterAccess: "lake",
      zonedSchools: { elementary: "Some Elementary", middle: null, high: null, checkedAddress: "1 Main St", sourceUrl: "https://example.org", note: "n" },
      evacuationZone: "B",
      status: "established",
      officialUrl: null,
      description: "A gated neighborhood off Clark Road.",
      research: "full",
      sources: [],
      notes: "INTERNAL do not show",
      ...over,
    }) as NeighborhoodRecord;

  test("a researched place reads as facts, without schools, notes or anything age-related", () => {
    const [c] = placeChunks({ slug: "x", record: record({}), parentName: "Palmer Ranch" });
    assert.ok(c);
    assert.equal(c.kind, "neighborhood");
    assert.equal(c.url, "/neighborhoods/x");
    assert.equal(c.sectionTitle, "Gated community in Palmer Ranch");
    assert.match(c.body, /Palm Grove is a gated community in Palmer Ranch, Sarasota, Sarasota County\./);
    assert.match(c.body, /Evacuation zone B\./);
    assert.match(c.body, /About 1,200 homes\./);
    assert.doesNotMatch(c.body, /Elementary|INTERNAL|age|55/i);
  });

  test("county-registry names aren't indexed", () => {
    assert.deepEqual(placeChunks({ slug: "x", record: record({ research: "registry-only" }) }), []);
  });

  const event = {
    _id: "event-x",
    title: "Tosca",
    slug: "tosca-2026",
    summary: "Puccini's opera in three acts.",
    startsAt: "2026-11-02T00:00:00.000Z",
    venue: { name: "Sarasota Opera House", slug: "sarasota-opera", market: "sarasota" as const, address: { street: "61 N Pineapple Ave", city: "Sarasota", state: "FL", zip: "34236" } },
    category: "theater" as const,
    featured: false,
    presenter: "Sarasota Opera",
    performances: [{ startsAt: "2026-11-01T00:00:00.000Z" }, { startsAt: "2026-11-08T00:00:00.000Z" }],
  };

  test("an event chunk carries stable facts only, so it doesn't change as dates pass", () => {
    const a = eventChunk(event);
    const b = eventChunk({ ...event, startsAt: "2026-11-08T00:00:00.000Z" });
    assert.equal(a.body, b.body);
    assert.equal(a.url, "/calendar/tosca-2026");
    assert.match(a.body, /Presented by Sarasota Opera\./);
    assert.match(a.body, /From October 31, 2026 to November 7, 2026, 2 dates\./);
  });

  test("a venue lists what it puts on the calendar", () => {
    const v = venueChunk({ _id: "v", name: "Sarasota Opera House", slug: "sarasota-opera", market: "sarasota", address: event.venue.address, website: "https://www.sarasotaopera.org/" }, [event]);
    assert.equal(v.body, "Sarasota Opera House, 61 N Pineapple Ave, Sarasota. On the Encore calendar: theater. Website: sarasotaopera.org.");
  });
});

describe("reindex", () => {
  const chunk = (id: string, body = `body of ${id}`): Chunk => ({ id, kind: "page", title: id, url: `/${id}`, body });

  class MemoryStore implements SearchStore {
    rows = new Map<string, WriteRow | { id: string; contentHash: string; embedding: null }>();
    removed: string[][] = [];
    async existing(): Promise<StoredRow[]> {
      return [...this.rows.values()].map((r) => ({ id: r.id, contentHash: r.contentHash, hasEmbedding: r.embedding !== null }));
    }
    async upsert(rows: WriteRow[]) {
      for (const r of rows) this.rows.set(r.id, r);
    }
    async remove(ids: string[]) {
      this.removed.push(ids);
      for (const id of ids) this.rows.delete(id);
    }
  }
  const fakeEmbed = (calls: string[][]) => async (texts: string[]) => {
    calls.push(texts);
    return texts.map(() => Array.from({ length: EMBED_DIMS }, () => 0.05));
  };

  test("plan: new, changed and unembedded rows are written; missing ids are deleted", () => {
    const a = chunk("a");
    const b = chunk("b");
    const existing: StoredRow[] = [
      { id: "a", contentHash: contentHash(a), hasEmbedding: true },
      { id: "b", contentHash: "stale", hasEmbedding: true },
      { id: "c", contentHash: contentHash(chunk("c")), hasEmbedding: false },
      { id: "test:flood", contentHash: "test", hasEmbedding: true },
    ];
    const plan = planReindex(existing, [a, b, chunk("c"), chunk("d")]);
    assert.equal(plan.unchanged, 1);
    assert.deepEqual(
      plan.toWrite.map((c) => c.id),
      ["b", "c", "d"],
    );
    assert.deepEqual(plan.toDelete, ["test:flood"]);
  });

  test("a run deletes the setup rows, embeds only what changed, and a second run does nothing", async () => {
    const store = new MemoryStore();
    for (const id of ["test:flood", "test:theater"]) store.rows.set(id, { id, contentHash: "test", embedding: null });
    const calls: string[][] = [];
    const chunks = ["a", "b", "c"].map((id) => chunk(id));
    const first = await reindex({ store, chunks, embed: fakeEmbed(calls), groupSize: 2 });
    assert.deepEqual({ ...first, ms: 0 }, { chunks: 3, unchanged: 0, written: 3, deleted: 2, remaining: 0, deletesSkipped: false, ms: 0 });
    assert.deepEqual([...store.rows.keys()].sort(), ["a", "b", "c"]);
    assert.equal(calls.length, 2);
    assert.ok(calls[0]![0]!.startsWith("a\n\n"));

    const again = await reindex({ store, chunks, embed: fakeEmbed(calls) });
    assert.equal(again.written, 0);
    assert.equal(again.unchanged, 3);
    assert.equal(calls.length, 2);

    const edited = await reindex({ store, chunks: [chunk("a", "new words"), chunks[1]!, chunks[2]!], embed: fakeEmbed(calls) });
    assert.equal(edited.written, 1);
    assert.deepEqual(calls[2], ["a\n\nnew words"]);
  });

  test("a run past its deadline keeps what it wrote and reports the rest", async () => {
    const store = new MemoryStore();
    const chunks = Array.from({ length: 10 }, (_, i) => chunk(`c${i}`));
    let now = 0;
    const embed = async (texts: string[]) => {
      now += 1;
      return texts.map(() => [1]);
    };
    const realNow = Date.now;
    Date.now = () => 1000 + now;
    try {
      const r = await reindex({ store, chunks, embed, groupSize: 3, deadline: 1001 });
      assert.equal(r.written, 6);
      assert.equal(r.remaining, 4);
      assert.equal(store.rows.size, 6);
    } finally {
      Date.now = realNow;
    }
  });

  test("deletes are held back when a source failed or the run shrank by half, unless forced", async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 10; i++) store.rows.set(`old${i}`, { id: `old${i}`, contentHash: "x", embedding: null });
    const calls: string[][] = [];
    const r1 = await reindex({ store, chunks: [chunk("a")], embed: fakeEmbed(calls) });
    assert.equal(r1.deletesSkipped, true);
    assert.equal(r1.deleted, 0);
    const r2 = await reindex({ store, chunks: [chunk("a")], embed: fakeEmbed(calls), allowDeletes: false, force: true });
    assert.equal(r2.deleted, 0);
    const r3 = await reindex({ store, chunks: [chunk("a")], embed: fakeEmbed(calls), force: true });
    assert.equal(r3.deleted, 10);
    assert.deepEqual([...store.rows.keys()], ["a"]);
  });
});

describe("query", () => {
  test("validation trims, folds whitespace and enforces 2 to 200 characters", () => {
    assert.deepEqual(normalizeQuery("  flood \n  zones "), { ok: true, q: "flood zones" });
    assert.equal(normalizeQuery("a").ok, false);
    assert.equal(normalizeQuery(" ").ok, false);
    assert.equal(normalizeQuery(undefined).ok, false);
    assert.equal(normalizeQuery(["x"]).ok, false);
    assert.equal(normalizeQuery("x".repeat(200)).ok, true);
    assert.equal(normalizeQuery("x".repeat(201)).ok, false);
    assert.deepEqual(normalizeQuery(`ab${S}c${E}\u0000d`), { ok: true, q: "ab c d" });
  });

  test("the hybrid SQL is fully parameterised", () => {
    const v = Array.from({ length: EMBED_DIMS }, (_, i) => i / 1000);
    const evil = "flood'); drop table search_documents; --";
    const { sql: text, params } = new PgDialect().sqlToQuery(hybridSql({ q: evil, embedding: v }));
    assert.match(text, /from public\.search_hybrid\(\$1, \$2::extensions\.vector\(384\), \$3::int, \$4::float, \$5::float, \$6::int, \$7::float\)/);
    assert.ok(!text.includes("drop table"));
    assert.deepEqual(params, [evil, vectorLiteral(v), 10, 1, 1, 50, 0.8, vectorLiteral(v), 0.83]);
    assert.match(text, /where exists \(select 1 from h where keyword_rank is not null\) or \(select max\(1 - \(d\.embedding operator\(extensions\.<=>\) \$8::extensions\.vector\(384\)\)\) from public\.search_documents d join h on h\.id = d\.id\) >= \$9::float order by score desc/);
  });

  test("without an embedding the call is keyword-only: semantic weight 0 and a similarity floor nothing reaches", () => {
    const { params } = new PgDialect().sqlToQuery(hybridSql({ q: "cdd", embedding: null, matchCount: 99 }));
    assert.deepEqual(params, ["cdd", vectorLiteral(KEYWORD_ONLY_VECTOR), 30, 1, 0, 50, 2, vectorLiteral(KEYWORD_ONLY_VECTOR), 0.83]);
  });

  test("vectors must be 384 finite numbers", () => {
    assert.throws(() => vectorLiteral([1, 2, 3]));
    assert.throws(() => vectorLiteral(Array.from({ length: EMBED_DIMS }, () => Number.NaN)));
    assert.equal(vectorLiteral(KEYWORD_ONLY_VECTOR).split(",").length, EMBED_DIMS);
  });

  test("rows become hits: unknown kinds and off-site urls dropped, later parts of a chunk folded", () => {
    const row = (id: string, over: object = {}) => ({ id, kind: "guide", title: "T", section_title: null, url: "/guides/x#a", snippet: `a ${S}flood${E} b`, score: "0.03", ...over });
    const hits = rowsToHits([row("guide:x#a"), row("guide:x#a~2"), row("bad", { kind: "listing" }), row("ext", { url: "//evil.example" }), row("guide:y")], (s) => s);
    assert.deepEqual(
      hits.map((h) => h.id),
      ["guide:x#a", "guide:y"],
    );
    assert.equal(hits[0]!.score, 0.03);
  });

  test("no more than three sections of one page", () => {
    const keep = variedResults();
    const hits = ["a", "b", "c", "d"].map((s) => ({ id: `guide:x#${s}`, url: `/guides/x#${s}` }));
    assert.deepEqual(
      [...hits, { id: "guide:y", url: "/guides/y" }].filter(keep).map((h) => h.id),
      ["guide:x#a", "guide:x#b", "guide:x#c", "guide:y"],
    );
    assert.ok(keywordSearch(staticChunks(), "flood").filter((h) => h.url.startsWith("/guides/flood-zones-and-elevation")).length <= MAX_PER_PAGE);
  });

  test("rate limit: a fixed window per key", () => {
    let t = 0;
    const rl = new RateLimiter(2, 1000, () => t);
    assert.equal(rl.take("ip"), true);
    assert.equal(rl.take("ip"), true);
    assert.equal(rl.take("ip"), false);
    assert.equal(rl.take("other"), true);
    assert.equal(rl.retryAfter("ip"), 1);
    t = 1000;
    assert.equal(rl.take("ip"), true);
  });

  test("cache: entries expire and the oldest goes first", () => {
    let t = 0;
    const c = new TtlCache<number>(100, 2, () => t);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    assert.equal(c.get("a"), undefined);
    assert.equal(c.get("b"), 2);
    t = 101;
    assert.equal(c.get("b"), undefined);
    assert.equal(cacheKey("Flood Zones"), "flood zones");
  });

  test("the client IP comes from the first forwarded address", () => {
    assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" })), "203.0.113.4");
    assert.equal(clientIp(new Headers({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
    assert.equal(clientIp(new Headers()), "unknown");
  });

  test("results buckets never carry the query", () => {
    assert.deepEqual([0, 1, 3, 4, 9, 10, 30].map(resultsBucket), ["0", "1-3", "1-3", "4-9", "4-9", "10+", "10+"]);
  });
});

describe("fallback keyword search", () => {
  const chunks = staticChunks();

  test("stemming folds the usual endings", () => {
    assert.equal(stem("zones"), stem("zone"));
    assert.equal(stem("insured"), stem("insure"));
    assert.equal(stem("policies"), stem("policy"));
    assert.deepEqual(tokenize("What is THE flood-zone?"), ["flood", "zone"]);
  });

  test("finds the flood guide for flood insurance, with the words marked", () => {
    const hits = keywordSearch(chunks, "flood insurance");
    assert.ok(hits.length > 0);
    assert.ok(hits.slice(0, 3).some((h) => h.url.startsWith("/guides/flood-zones") || h.url.startsWith("/guides/homeowners-wind-and-flood")), hits.map((h) => h.url).join(", "));
    assert.ok(hits[0]!.snippet.includes(`${S}`));
    assert.ok(hits.length <= 10);
  });

  test("finds a place by name and a guide by its subject", () => {
    const child: Chunk = { id: "place:the-vineyards", kind: "neighborhood", title: "The Vineyards", url: "/neighborhoods/the-vineyards", body: "The Vineyards is a neighborhood in The Lake Club, Lakewood Ranch." };
    assert.equal(keywordSearch([...chunks, child], "Lake Club")[0]!.url, "/neighborhoods/the-lake-club");
    assert.ok(keywordSearch(chunks, "community development district").slice(0, 3).some((h) => /cdd-fees/.test(h.url)));
    assert.match(keywordSearch(chunks, "homestead portability")[0]!.url, /homestead/);
  });

  test("shows one hit per section and nothing for stop words or nonsense", () => {
    const hits = keywordSearch(chunks, "flood");
    const bases = hits.map((h) => h.id.replace(/~\d+$/, ""));
    assert.equal(new Set(bases).size, bases.length);
    assert.deepEqual(keywordSearch(chunks, "the and of"), []);
    assert.deepEqual(keywordSearch(chunks, "qwxzv"), []);
  });

  test("highlight marks whole words, keeps punctuation outside, and opens near the first match", () => {
    assert.equal(highlight("Flood zones, explained.", new Set(tokenize("zone"))), `Flood ${S}zones${E}, explained.`);
    const long = `${words(60)} the flood map ${words(60)}`;
    const h = highlight(long, new Set(tokenize("flood")));
    assert.ok(h.startsWith("…"));
    assert.ok(h.includes(`${S}flood${E}`));
  });
});

describe("snippets", () => {
  test("snippetParts splits marked and plain runs", () => {
    assert.deepEqual(snippetParts(`a ${S}b${E} c`), [
      { text: "a ", mark: false },
      { text: "b", mark: true },
      { text: " c", mark: false },
    ]);
    assert.deepEqual(snippetParts("plain"), [{ text: "plain", mark: false }]);
  });

  test("excerpt cuts at a word and never leaves a mark open", () => {
    assert.equal(excerpt("short"), "short");
    const e = excerpt(`${words(10)} ${S}${words(80)}${E}`, 100);
    assert.ok(e.endsWith(`${E}…`));
  });

  test("tidySnippet adds a leading ellipsis to a mid-sentence fragment", () => {
    assert.equal(tidySnippet(`the ${S}flood${E} map`), `…the ${S}flood${E} map`);
    assert.equal(tidySnippet("A flood map"), "A flood map");
    assert.equal(tidySnippet(""), "");
  });
});

describe("embed client", () => {
  const config = { url: "https://example.supabase.co/functions/v1/embed", key: "anon" };
  const vec = (x: number) => Array.from({ length: EMBED_DIMS }, () => x);

  test("config comes from the public Supabase URL and anon key", () => {
    assert.deepEqual(embedConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co/", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" }), { url: "https://p.supabase.co/functions/v1/embed", key: "k" });
    assert.equal(embedConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co" }), null);
    assert.equal(embedConfig({}), null);
  });

  test("sends the rest again after a partial answer and retries a worker-limit error", async () => {
    const seen: string[][] = [];
    let calls = 0;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      calls += 1;
      const { texts } = JSON.parse(String(init.body)) as { texts: string[] };
      seen.push(texts);
      if (calls === 2) return new Response(JSON.stringify({ error: "WORKER_LIMIT" }), { status: 546 });
      // Two at a time, the way the function answers when it runs out of CPU budget.
      const n = Math.min(2, texts.length);
      return Response.json({ embeddings: texts.slice(0, n).map((t) => vec(Number(t) / 10)), complete: n === texts.length });
    }) as typeof fetch;
    const out = await embedTexts(["1", "2", "3", "4", "5"], { config, fetchImpl, concurrency: 1, batchSize: 8, retries: 2 });
    assert.deepEqual(
      out.map((v) => v[0]),
      [0.1, 0.2, 0.3, 0.4, 0.5],
    );
    assert.deepEqual(seen[0], ["1", "2", "3", "4", "5"]);
    assert.deepEqual(seen[1], ["3", "4", "5"]);
    assert.deepEqual(seen[2], ["3", "4", "5"]);
  });

  test("a 400 is not retried, and a wrong-sized vector is an error", async () => {
    let calls = 0;
    const bad = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ error: "At most 64 texts per call" }), { status: 400 });
    }) as typeof fetch;
    await assert.rejects(embedTexts(["a"], { config, fetchImpl: bad, retries: 3 }), (e: unknown) => e instanceof EmbedError && e.status === 400);
    assert.equal(calls, 1);
    const short = (async () => Response.json({ embeddings: [[1, 2, 3]] })) as typeof fetch;
    await assert.rejects(embedTexts(["a"], { config, fetchImpl: short, retries: 0 }), /384/);
  });
});
