/**
 * Reading level for the guides. The client asked for guides a third grader
 * could follow: short sentences, everyday words, one idea at a time. This
 * measures it with the Flesch-Kincaid grade level, the same formula word
 * processors report:
 *
 *   grade = 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59
 *
 * Syllables are counted with a plain English heuristic (vowel groups, a
 * silent final e dropped), which lands within a syllable of a dictionary
 * count for nearly every word a guide uses. Official terms the guide has to
 * name (insurance, elevation certificate, FEMA) cost syllables the writer
 * can't avoid, so the limit in docs/GUIDES.md is set with that in mind.
 */

/** Syllables in one word. Numbers count as two, roughly how they're read aloud. */
export function syllables(word: string): number {
  if (/\d/.test(word)) return 2;
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m.slice(0, 1)).replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Words in a run of text: anything between spaces that has a letter or a digit in it. */
export function words(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
}

/**
 * Sentences in a run of text. A sentence ends at a full stop, question mark
 * or colon followed by a space or the end; a decimal point (0.99) doesn't
 * end one. Text with no end mark counts as one sentence (a heading, a label).
 */
export function sentences(text: string): string[] {
  return text
    .replace(/(\d)\.(\d)/g, "$1·$2")
    .split(/(?<=[.?:])\s+/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0);
}

export type Readability = { words: number; sentences: number; syllables: number; grade: number; longest: { words: number; text: string } };

/** Flesch-Kincaid grade over a set of texts, read as one passage, plus the longest sentence in it. */
export function readability(texts: string[]): Readability {
  let w = 0;
  let s = 0;
  let syl = 0;
  let longest = { words: 0, text: "" };
  for (const t of texts) {
    for (const sentence of sentences(t)) {
      const ws = words(sentence);
      w += ws.length;
      s += 1;
      syl += ws.reduce((n, x) => n + syllables(x), 0);
      if (ws.length > longest.words) longest = { words: ws.length, text: sentence };
    }
  }
  const grade = w && s ? 0.39 * (w / s) + 11.8 * (syl / w) - 15.59 : 0;
  return { words: w, sentences: s, syllables: syl, grade: Math.round(grade * 10) / 10, longest };
}
