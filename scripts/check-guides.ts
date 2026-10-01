/**
 * Fair Housing check over the Tide guides in the seed.
 *
 *   npx tsx scripts/check-guides.ts              every guide in the seed
 *   npx tsx scripts/check-guides.ts <slug> ...   only those guides
 *
 * Runs lib/fair-housing.ts over every string a guide renders (title, excerpt,
 * cover alt, every paragraph, heading, list item and quote), plus the
 * places-not-people rules the hubs use: nothing about demographics, income,
 * safety, schools or age, and no "best for". Figures are allowed here, unlike
 * the hubs, because a guide may quote a statute or a brochure, so
 * scripts/check-copy.mjs cannot simply be pointed at this content. The one
 * school reference a guide may make is to school taxes, which the homestead
 * statute itself distinguishes. Exits 1 on any flag.
 */
import { checkFairHousing } from "../lib/fair-housing";
import { POSTS } from "../lib/content/seed/posts";

const PEOPLE_RULES: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bschools?\b(?!\s+(district(’|')?s?\s+)?(tax|taxes|levy|levies))/i, reason: "school reference (only school taxes may be named, in the homestead guide)" },
  { pattern: /\b(safe|safety|unsafe|crime|low[- ]crime)\b/i, reason: "safety or crime reference" },
  { pattern: /\bfamil(y|ies)\b/i, reason: "familial-status reference" },
  { pattern: /\b(kids?|children)\b/i, reason: "familial-status reference" },
  { pattern: /\b(retire(e|es|d|ment)?|seniors?|55\s?\+|active adult|age[- ]restricted)\b/i, reason: "age reference" },
  { pattern: /\b(best|perfect|ideal) for\b/i, reason: 'steering ("best for")' },
  { pattern: /\b(demographics?|household income|income level|affluent|wealthy|upscale|luxury)\b/i, reason: "income or demographic reference" },
  { pattern: /!/, reason: "an exclamation mark (house rule)" },
];

/**
 * Proper names that carry a rule word without making the claim. "My Safe
 * Florida Home" is the state's wind mitigation grant program; the guides
 * have to call it by name. Scrubbed before the people rules run; the
 * brokerage check in lib/fair-housing.ts still sees the raw text.
 */
const PROPER_NAMES: RegExp[] = [/My Safe Florida Home/g];

/** Every string a guide puts on the page, with where it came from. */
function guideStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const only = new Set(process.argv.slice(2));
  for (const post of POSTS) {
    if (post.categories.includes("Market report")) continue;
    if (only.size && !only.has(post.slug)) continue;
    const add = (where: string, text: string) => out.push({ where: `${post.slug}: ${where}`, text });
    add("title", post.title);
    add("excerpt", post.excerpt);
    add("cover alt", post.cover.alt);
    post.body.forEach((blk, i) => {
      if (blk._type !== "block") return;
      const children = (blk.children ?? []) as { text?: unknown }[];
      const text = children.map((c) => (typeof c.text === "string" ? c.text : "")).join("");
      add(`${blk.style ?? "block"} ${i + 1}`, text);
    });
  }
  return out;
}

let flagged = 0;
let checked = 0;
for (const { where, text } of guideStrings()) {
  checked += 1;
  const result = checkFairHousing(text);
  const scrubbed = PROPER_NAMES.reduce((t, re) => t.replace(re, "the program"), text);
  const extra = PEOPLE_RULES.filter((r) => r.pattern.test(scrubbed)).map((r) => ({ pattern: r.pattern.source, reason: r.reason }));
  const flags = [...(result.passed ? [] : result.flags), ...extra];
  if (!flags.length) continue;
  flagged += 1;
  console.error(`\n✗ ${where}\n  "${text.slice(0, 160)}${text.length > 160 ? "…" : ""}"`);
  for (const f of flags) console.error(`  - ${f.reason}  (/${f.pattern}/)`);
}

if (flagged) {
  console.error(`\n${flagged} of ${checked} strings flagged.`);
  process.exit(1);
}
console.log(`✓ ${checked} guide strings checked, nothing flagged.`);
