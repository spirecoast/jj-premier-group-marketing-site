import { createHash } from "node:crypto";
import type { Chunk } from "./types";

/**
 * Text helpers for the search index: cleaning, chunking, hashing and the text
 * that gets embedded. Pure functions, tested in search.test.ts.
 */

/** Chunk size, in words. Big enough to carry an idea, small enough that gte-small (512 tokens) sees all of it. */
export const CHUNK_WORDS = { min: 150, max: 300 } as const;
/** The `embed` function refuses texts over 2,000 characters. */
export const EMBED_MAX_CHARS = 2000;

export const clean = (s: string): string =>
  s
    .replace(/[\uE000\uE001]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const wordCount = (s: string): number => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Sentences, keeping their punctuation. Good enough for prose; never splits mid-word. */
export function sentences(text: string): string[] {
  const out = clean(text).match(/[^.!?]+(?:[.!?]+["’”)]*|$)\s*/g);
  return (out ?? []).map((s) => s.trim()).filter(Boolean);
}

/** Cut one long run of text into pieces of at most `max` words, at sentence ends where it can. */
function splitLong(text: string, max: number): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let n = 0;
  const flush = () => {
    if (cur.length) out.push(cur.join(" "));
    cur = [];
    n = 0;
  };
  for (const s of sentences(text)) {
    const w = wordCount(s);
    if (w > max) {
      // A "sentence" longer than a chunk (a list, a table row run): cut by words.
      flush();
      const words = s.split(/\s+/);
      for (let i = 0; i < words.length; i += max) out.push(words.slice(i, i + max).join(" "));
      continue;
    }
    if (n + w > max) flush();
    cur.push(s);
    n += w;
  }
  flush();
  return out;
}

/**
 * Pack paragraphs, in order, into chunks of at most `max` words. A paragraph
 * longer than a chunk is split at sentence ends. A short tail is folded into
 * the chunk before it when the two still fit in `max` plus half of `min`, so
 * no chunk is a stray sentence.
 */
export function packChunks(paragraphs: string[], opts: { min?: number; max?: number } = {}): string[] {
  const min = opts.min ?? CHUNK_WORDS.min;
  const max = opts.max ?? CHUNK_WORDS.max;
  const units = paragraphs.map(clean).filter(Boolean).flatMap((p) => (wordCount(p) > max ? splitLong(p, max) : [p]));
  const chunks: string[] = [];
  let cur: string[] = [];
  let n = 0;
  for (const u of units) {
    const w = wordCount(u);
    if (n > 0 && n + w > max) {
      chunks.push(cur.join("\n"));
      cur = [];
      n = 0;
    }
    cur.push(u);
    n += w;
  }
  if (cur.length) {
    const tail = cur.join("\n");
    const prev = chunks[chunks.length - 1];
    if (prev !== undefined && n < min / 2 && wordCount(prev) + n <= max + min / 2) chunks[chunks.length - 1] = `${prev}\n${tail}`;
    else chunks.push(tail);
  }
  return chunks;
}

/**
 * Turn packed bodies into chunks. The first keeps `id`; the rest get "~2",
 * "~3" so every id is stable for as long as the text splits the same way.
 */
export function toChunks(base: Omit<Chunk, "body">, paragraphs: string[], opts?: { min?: number; max?: number }): Chunk[] {
  return packChunks(paragraphs, opts).map((body, i) => ({ ...base, id: i === 0 ? base.id : `${base.id}~${i + 1}`, body }));
}

/** What the model reads: the title and section in front of the body, cut to what `embed` accepts. */
export function embeddingText(c: Pick<Chunk, "title" | "sectionTitle" | "body">): string {
  const head = c.sectionTitle && c.sectionTitle !== c.title ? `${c.title} · ${c.sectionTitle}` : c.title;
  const text = `${head}\n\n${c.body}`;
  if (text.length <= EMBED_MAX_CHARS) return text;
  const cut = text.slice(0, EMBED_MAX_CHARS);
  const space = cut.lastIndexOf(" ");
  return space > EMBED_MAX_CHARS * 0.8 ? cut.slice(0, space) : cut;
}

/** Everything a row stores, hashed: a change to any of it re-embeds and rewrites the row. */
export function contentHash(c: Chunk): string {
  return createHash("sha256")
    .update(JSON.stringify([c.kind, c.title, c.sectionTitle ?? null, c.url, c.body, "gte-small/v1"]))
    .digest("hex");
}

/* ---- Portable Text ------------------------------------------------------- */

type PtSpan = { _type?: string; text?: string };
type PtBlock = { _type?: string; style?: string; children?: PtSpan[] };

/**
 * Portable Text (a post body) as sections: each h2 starts a new one, and the
 * text before the first h2 is the opening section (heading null).
 */
export function portableTextSections(body: unknown): { heading: string | null; paragraphs: string[] }[] {
  const blocks = Array.isArray(body) ? (body as PtBlock[]) : [];
  const out: { heading: string | null; paragraphs: string[] }[] = [{ heading: null, paragraphs: [] }];
  for (const b of blocks) {
    if (b?._type !== "block") continue;
    const text = clean((b.children ?? []).map((c) => c.text ?? "").join(""));
    if (!text) continue;
    if (b.style === "h2") out.push({ heading: text, paragraphs: [] });
    else out[out.length - 1]!.paragraphs.push(text);
  }
  return out.filter((s) => s.heading !== null || s.paragraphs.length > 0);
}

