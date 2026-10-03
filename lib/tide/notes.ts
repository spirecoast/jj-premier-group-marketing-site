import { NARRATIVE_FIELDS, TIDE_VOICES, type TideCommentary, type TideIssueEntry } from "./issues";

/**
 * The hand-written words on a Tide issue, read from its entry in
 * lib/tide/issues.ts: the unsigned narrative in the site's voice, and the two
 * notes Joelyn and Jessica sign. Nothing here writes a word; it only decides
 * what shows. The checks that tie the narrative to the figures are in
 * lib/tide/narrative.ts.
 */

export type Narrative = { opening: string[]; buyers: string[]; sellers: string[]; watch: string[] };

/** The narrative written for an entry, or null when there's no opening yet. Empty strings are dropped. */
export function narrativeOf(entry: Pick<TideIssueEntry, (typeof NARRATIVE_FIELDS)[number]>): Narrative | null {
  const clean = (xs?: string[]) => (xs ?? []).map((x) => x.trim()).filter(Boolean);
  const n = { opening: clean(entry.opening), buyers: clean(entry.buyers), sellers: clean(entry.sellers), watch: clean(entry.watch) };
  return n.opening.length ? n : null;
}

export type NoteSlot = {
  key: keyof TideCommentary;
  name: string;
  first: string;
  /** The note, as written; null for a slot that shows as a placeholder. */
  paragraphs: string[] | null;
};

/**
 * The signed notes to show. "public": only the ones written (an empty slot
 * doesn't show at all). "draft": both, an empty one as a placeholder for its
 * writer to fill: the email draft, and sample previews of the page.
 */
export function noteSlots(commentary: TideCommentary | undefined, mode: "public" | "draft"): NoteSlot[] {
  return TIDE_VOICES.map((v) => {
    const written = (commentary?.[v.key] ?? []).map((p) => p.trim()).filter(Boolean);
    return { key: v.key, name: v.name, first: v.first, paragraphs: written.length ? written : null };
  }).filter((s) => mode === "draft" || s.paragraphs !== null);
}

