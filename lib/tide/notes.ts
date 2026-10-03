import { TIDE_MARKET_KEYS, TIDE_VOICES, type NarrativeField, type TideCommentary, type TideIssueEntry, type TideMarketKey, type TideMove } from "./issues";

/**
 * The hand-written words on a Tide issue, read from its entry in
 * lib/tide/issues.ts: the unsigned narrative in the site's voice, and the two
 * notes Joelyn and Jessica sign. Nothing here writes a word; it only decides
 * what shows. The checks that tie the narrative to the figures are in
 * lib/tide/narrative.ts.
 */

export type Narrative = {
  headline: string | null;
  dek: string | null;
  /** The story: the paragraphs under the cover. */
  opening: string[];
  /** Per market, its paragraphs; a market with none written is left out. */
  markets: Partial<Record<TideMarketKey, string[]>>;
  /** Per market, the one thing to do there; a market with none written is left out. */
  marketMoves: Partial<Record<TideMarketKey, string>>;
  /** The three moves for a buyer and for a seller (the current format). */
  buying: TideMove[];
  selling: TideMove[];
  /** The first format's single paragraphs, kept for the issues written that way: read only when `buying` / `selling` are empty. */
  buyers: string[];
  sellers: string[];
  watch: string[];
};

const clean = (xs?: string[]) => (xs ?? []).map((x) => x.trim()).filter(Boolean);
const one = (x?: string) => (x && x.trim() ? x.trim() : null);
const moves = (xs?: TideMove[]) =>
  (xs ?? [])
    .map((m) => ({
      move: m.move.trim(),
      why: m.why.trim(),
      ...(m.link && m.link.href.trim() && m.link.label.trim() ? { link: { href: m.link.href.trim(), label: m.link.label.trim() } } : {}),
    }))
    .filter((m) => m.move);

/**
 * The narrative written for an entry, or null when nothing is written yet.
 * Empty strings are dropped, so a half-written entry shows only what's there.
 */
export function narrativeOf(entry: Partial<Pick<TideIssueEntry, NarrativeField>>): Narrative | null {
  const markets: Narrative["markets"] = {};
  const marketMoves: Narrative["marketMoves"] = {};
  for (const k of TIDE_MARKET_KEYS) {
    const ps = clean(entry.markets?.[k]);
    if (ps.length) markets[k] = ps;
    const mv = one(entry.marketMoves?.[k]);
    if (mv) marketMoves[k] = mv;
  }
  const n: Narrative = {
    headline: one(entry.headline),
    dek: one(entry.dek),
    opening: clean(entry.opening),
    markets,
    marketMoves,
    buying: moves(entry.buying),
    selling: moves(entry.selling),
    buyers: clean(entry.buyers),
    sellers: clean(entry.sellers),
    watch: clean(entry.watch),
  };
  const written =
    n.headline || n.dek || n.opening.length || Object.keys(markets).length || Object.keys(marketMoves).length || n.buying.length || n.selling.length || n.buyers.length || n.sellers.length || n.watch.length;
  return written ? n : null;
}

/** The unsigned paragraphs of a narrative in page order, as plain text: for search, the reading time and the Fair Housing check. */
export function narrativeParagraphs(n: Narrative | null): string[] {
  if (!n) return [];
  const advice = (ms: TideMove[], legacy: string[]) => (ms.length ? ms.flatMap((m) => [m.move, m.why]) : legacy);
  return [
    ...(n.headline ? [n.headline] : []),
    ...(n.dek ? [n.dek] : []),
    ...n.opening,
    ...TIDE_MARKET_KEYS.flatMap((k) => [...(n.markets[k] ?? []), ...(n.marketMoves[k] ? [n.marketMoves[k]!] : [])]),
    ...advice(n.buying, n.buyers),
    ...advice(n.selling, n.sellers),
    ...n.watch,
  ];
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

