/**
 * The places-not-people rules shared by scripts/check-copy.mjs and its tests (lib/copy-check.test.ts).
 * No imports, so plain Node and the unit tests can both load it.
 */

/** Places, never people. */
export const PEOPLE_RULES = [
  { pattern: /\bschools?\b/i, reason: "school reference (zoned schools live on Atlas pages only, with the district link)" },
  { pattern: /\b(safe|safety|unsafe|crime|low[- ]crime)\b/i, reason: "safety or crime reference" },
  { pattern: /\bfamil(y|ies)\b/i, reason: "familial-status reference" },
  { pattern: /\b(kids?|children)\b/i, reason: "familial-status reference" },
  { pattern: /\b(retire(e|es|d|ment)?|seniors?|55\s?\+|active adult|age[- ]restricted)\b/i, reason: "age reference" },
  { pattern: /\b(young professionals?|millennials|boomers|snowbirds?|empty nesters?)\b/i, reason: "people as a target, not places" },
  { pattern: /\b(best|perfect|ideal) for\b/i, reason: "steering (\"best for\")" },
  { pattern: /\b(demographics?|household income|income level|affluent|wealthy|upscale|luxury buyers?)\b/i, reason: "income or demographic reference" },
  // "Which end of the street is the good one": a judgment about part of a place is the subjective call Fair Housing
  // guidance warns agents off. Tie it to a fact instead (the end that floods first, the lake side).
  {
    pattern: /\b(?:good|bad|better|worse|right|wrong|nice|nicer|best|worst)\s+(?:end|side|part)\s+of\s+(?:the\s+)?(?:street|road|block|town|island|neighbou?rhood|community)\b|\b(?:end|side|part)\s+of\s+(?:the\s+)?(?:street|road|block|town|island|neighbou?rhood|community)\s+is\s+the\s+(?:good|better|right|nice|best)\s+one\b/i,
    reason: "steering (a judgment about part of a street or town; tie it to a fact)",
  },
];

/**
 * Honest uses of the people words in the site's source, taken out of a string before the people rules run
 * over it. Each is a kind of home, a name or a tax, never a description of who lives somewhere.
 */
const HONEST_USES = [
  /\b(?:single|multi)-family\b|\bfont-family\b|\bfamily members\b/gi, // a kind of home, a CSS property, transfers between relatives in the sales data
  /\bfor our own family\b/gi, // the team, a mother and daughter, speaking of itself
  /\bMy Safe Florida Home\b/g, // the state program's name
  /\bschool[- ](?:tax(?:es)?|district(?:['’]s)?)\b/gi, // the tax bill
  /\bchildren under (?:thirteen|sixteen|13|16)\b/gi, // the privacy policy's line on children's data
];
/** Atlas states each place's zoned schools as a fact with the district's link: the one part of the site where the word belongs. */
const ATLAS = /^(?:app\/\(site\)\/neighborhoods\/|components\/explorer\/|lib\/neighborhoods\/)/;
const SCHOOLS = PEOPLE_RULES[0];
export const peopleHits = (where, text) => {
  const plain = HONEST_USES.reduce((t, re) => t.replace(re, " "), text);
  return PEOPLE_RULES.filter((r) => !(r === SCHOOLS && ATLAS.test(where)) && r.pattern.test(plain));
};
