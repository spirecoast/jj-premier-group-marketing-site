import { excerpt } from "./snippet";
import { HIGHLIGHT, variedResults, type Chunk, type SearchHit } from "./types";

/**
 * Keyword search in memory over the same chunks the index holds. It's the
 * fallback for when DATABASE_URL or the `embed` function isn't there (local
 * builds, previews, an outage), so /search always answers.
 *
 * BM25 over title, section and body as one field, with title and section
 * words counted extra, light English stemming, and a bonus when every query
 * word matches, the way the database ranks a chunk that matches the whole
 * query first. Snippets carry the same highlight markers as ts_headline.
 */

const STOP = new Set(
  "a an and are as at be but by can do does for from how i if in into is it its me my of on or our so than that the their them then there these they this to up us was we what when where which who why will with you your".split(" "),
);

/** Lowercase, accents off, a small suffix stemmer. Same function for the index and the query. */
export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("es") && /(ch|sh|x|z|ss)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) w = w.slice(0, -1);
  if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("e") && w.length > 4) w = w.slice(0, -1);
  if (w.endsWith("y") && w.length > 3) w = `${w.slice(0, -1)}i`;
  return w;
}

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function tokenize(text: string): string[] {
  return (fold(text).toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w)).map(stem);
}

type Doc = { chunk: Chunk; tf: Map<string, number>; len: number };
type Index = { docs: Doc[]; df: Map<string, number>; avgLen: number };

const indexes = new WeakMap<Chunk[], Index>();

function buildIndex(chunks: Chunk[]): Index {
  const docs: Doc[] = [];
  const df = new Map<string, number>();
  let total = 0;
  for (const chunk of chunks) {
    const tf = new Map<string, number>();
    const add = (text: string | undefined, weight: number) => {
      for (const t of tokenize(text ?? "")) tf.set(t, (tf.get(t) ?? 0) + weight);
    };
    add(chunk.title, 3);
    add(chunk.sectionTitle, 2);
    add(chunk.body, 1);
    const len = [...tf.values()].reduce((a, b) => a + b, 0);
    total += len;
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    docs.push({ chunk, tf, len });
  }
  return { docs, df, avgLen: docs.length ? total / docs.length : 1 };
}

function getIndex(chunks: Chunk[]): Index {
  let ix = indexes.get(chunks);
  if (!ix) {
    ix = buildIndex(chunks);
    indexes.set(chunks, ix);
  }
  return ix;
}

/** The body around the first matched word, with every matched word marked. */
export function highlight(body: string, terms: Set<string>, chars = 240): string {
  const text = body
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => {
      // Mark the word itself; leading and trailing punctuation stay outside the mark.
      const m = w.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
      const core = m?.[2] ?? "";
      if (!core || !tokenize(core).some((t) => terms.has(t))) return w;
      return `${m![1]}${HIGHLIGHT.start}${core}${HIGHLIGHT.stop}${m![3]}`;
    })
    .join(" ");
  const first = text.indexOf(HIGHLIGHT.start);
  if (first <= 80) return excerpt(text, chars);
  // Start a little before the first match, at a word boundary.
  const space = text.indexOf(" ", first - 60);
  return `…${excerpt(text.slice(space >= 0 && space < first ? space + 1 : first), chars)}`;
}

export function keywordSearch(chunks: Chunk[], query: string, limit = 10): SearchHit[] {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const ix = getIndex(chunks);
  const N = ix.docs.length;
  const k1 = 1.2;
  const b = 0.75;
  const phrase = fold(query).toLowerCase().replace(/\s+/g, " ").trim();
  const scored: { doc: Doc; score: number }[] = [];
  for (const doc of ix.docs) {
    let score = 0;
    let matched = 0;
    for (const t of terms) {
      const f = doc.tf.get(t);
      if (!f) continue;
      matched += 1;
      const df = ix.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * doc.len) / ix.avgLen));
    }
    if (!matched) continue;
    if (matched === terms.length && terms.length > 1) score *= 1.5;
    // A query that names the page beats a page that mentions it: "lake club"
    // is The Lake Club before the villages that say they're inside it.
    const titleTerms = new Set(tokenize(doc.chunk.title));
    const inTitle = terms.filter((t) => titleTerms.has(t)).length / terms.length;
    score *= 1 + inTitle;
    if (inTitle === 1 && titleTerms.size === terms.length) score *= 1.5;
    // …and the page itself before its sections.
    if (inTitle === 1 && !doc.chunk.url.includes("#")) score *= 1.25;
    if (phrase.length > 3 && fold(`${doc.chunk.title} ${doc.chunk.body}`).toLowerCase().includes(phrase)) score *= 1.3;
    scored.push({ doc, score });
  }
  scored.sort((a, b2) => b2.score - a.score || a.doc.chunk.id.localeCompare(b2.doc.chunk.id));
  // One hit per section and three per page, as on the database path.
  const keep = variedResults();
  const out: SearchHit[] = [];
  const termSet = new Set(terms);
  for (const { doc, score } of scored) {
    const c = doc.chunk;
    if (!keep(c)) continue;
    out.push({ id: c.id, kind: c.kind, title: c.title, section: c.sectionTitle ?? null, url: c.url, snippet: highlight(c.body, termSet), score });
    if (out.length >= limit) break;
  }
  return out;
}
