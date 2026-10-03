/**
 * Phrases that make copy read as machine-written, and that the owner asked
 * never to see on the site: "We don't say 'the read', we don't say 'the mark',
 * none of that kind of nonsense. Very plain language, very direct, very warm."
 *
 * No imports, so scripts/check-copy.mjs (plain Node) and the unit tests can
 * both run it. Each rule uses word boundaries and, where a word has an honest
 * use on a real estate site, the context that makes it a tell: "the market"
 * and a person named Mark pass, "hit the mark" doesn't; "elevating or
 * rebuilding" a house in a flood zone passes, "elevate your search" doesn't.
 *
 * `aiTells(text)` returns the reasons, empty when the text is clean.
 */

export type VoiceRule = { pattern: RegExp; reason: string; test?: (text: string) => boolean };

// Straight and curly apostrophes alike.
const A = "['’]";

export const AI_TELLS: readonly VoiceRule[] = [
  { pattern: /\bthe read\b(?!\s+(?:on|of)\s+the\s+(?:meter|gauge))/i, reason: "“the read”" },
  { pattern: /\b(?:the|a|its|hit the|off the|miss the|near the) mark\b(?!et)/i, reason: "“the mark”" },
  { pattern: /\bthe takeaways?\b/i, reason: "“the takeaway”" },
  { pattern: /\bthe bottom line\b/i, reason: "“the bottom line”" },
  { pattern: /\bdelv(?:e|es|ed|ing)\b/i, reason: "“delve”" },
  { pattern: /\bdiv(?:e|ing) (?:in|into)\b/i, reason: "“dive in”" },
  { pattern: /\bdeep[- ]dive\b/i, reason: "“deep dive”" },
  { pattern: /\b(?:the|today['’]s|this|a changing|the real estate|the housing|the market) landscape\b/i, reason: "“landscape” as a figure of speech" },
  { pattern: /\bnavigat(?:e|es|ed|ing)\b/i, reason: "“navigate”" },
  { pattern: /\btapestry\b(?! conservation)/i, reason: "“tapestry”" },
  { pattern: /\btestament\b/i, reason: "“testament”" },
  { pattern: new RegExp(`\\bit${A}?s worth (?:noting|mentioning|remembering)\\b|\\bit is worth (?:noting|mentioning)\\b`, "i"), reason: "“it’s worth noting”" },
  { pattern: new RegExp(`\\bin today${A}s (?:market|world|economy|climate)\\b`, "i"), reason: "“in today’s market”" },
  { pattern: new RegExp(`\\bhere${A}s the thing\\b`, "i"), reason: "“here’s the thing”" },
  { pattern: new RegExp(`\\blet${A}s\\b`, "i"), reason: "“let’s”" },
  { pattern: /\bgame[- ]?changer/i, reason: "“game-changer”" },
  { pattern: /\bunlock(?:s|ed|ing)?\b(?! (?:the|a|your) (?:door|gate|lockbox|box|house|home)(?![’'\w]))/i, reason: "“unlock”" },
  { pattern: /\brobust\b/i, reason: "“robust”" },
  { pattern: /\bseamless(?:ly)?\b/i, reason: "“seamless”" },
  { pattern: /\belevat(?:e|es)\b(?! (?:the|a|your|their) (?:house|home|building|floor|structure)\b)/i, reason: "“elevate”" },
  { pattern: /\bnestled\b/i, reason: "“nestled”" },
  { pattern: /\bvibrant\b/i, reason: "“vibrant”" },
  { pattern: /\bbustling\b/i, reason: "“bustling”" },
  { pattern: /\ba whole new\b/i, reason: "“a whole new”" },
  { pattern: new RegExp(`\\b(?:is|are|was|were)n${A}?t just\\b|\\b(?:is|are|was|were) not just\\b`, "i"), reason: "“isn’t just” contrast" },
  { pattern: /\bnot (?:just|only|merely|simply)\b[^.?!]*\bbut\b/i, reason: "“not just X, but Y” contrast" },
  { pattern: new RegExp(`\\bwhether you${A}re\\b|\\bwhether you are\\b`, "i"), reason: "“whether you’re X or Y”" },
  { pattern: /\bat the end of the day\b/i, reason: "“at the end of the day”" },
  { pattern: /\bbuckle up\b/i, reason: "“buckle up”" },
  { pattern: /\bspoiler\b/i, reason: "“spoiler”" },
  {
    pattern: new RegExp(
      `^(?:the (?:answer|result|catch|upshot|short version|long version|good news|bad news|kicker|twist|truth|reality|verdict|lesson|secret|real story|fix)|here${A}s (?:why|how|what|the deal)|the bottom line|bottom line|the key|the point)\\s*:`,
      "i",
    ),
    reason: "a colon-led reveal (“The answer:”)",
  },
  { pattern: /\blands\b(?! (?:and|or) (?:buildings|water)\b)/i, reason: "“lands” as a verb (say comes out, arrives, falls)" },
  // A short hook question answered straight after ("Wondering what your home’s worth? Start with…"). A string that is
  // only questions (a heading, an FAQ, the questions an insurer asks) is fine, and so is a long, real question.
  { pattern: /\?\s+\S/, reason: "a rhetorical-question opener (“Wondering…? Start…”)", test: questionOpener },
];

/** The first sentence is a question of eleven words or fewer, and the next sentence answers it. */
export function questionOpener(text: string): boolean {
  const m = /^([^.?!]+)\?\s+([^?]+?[.!:]|[^.?!]+$)/.exec(text.trim());
  if (!m) return false;
  return m[1]!.split(/\s+/).filter(Boolean).length <= 11;
}

/** The reasons a string reads as machine-written; empty when it doesn't. */
export function aiTells(text: string): string[] {
  const t = text.trim();
  return AI_TELLS.filter((r) => (r.test ? r.test(t) : r.pattern.test(t))).map((r) => r.reason);
}
