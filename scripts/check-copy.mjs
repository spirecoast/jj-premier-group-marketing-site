#!/usr/bin/env node
/**
 * Fair Housing check over hand-written page copy.
 *
 *   node scripts/check-copy.mjs        (Node 22.18+ strips the TypeScript types itself)
 *
 * Runs lib/fair-housing.ts over every string in the copy files below, plus a
 * stricter list on top: nothing about people (demographics, income, schools,
 * safety, age), no prices or figures, no license numbers. Exits 1 on any flag
 * so it can gate a build.
 *
 * Sources: the market hubs (lib/hubs/copy.ts), the channel landing pages
 * (lib/channels/copy.ts), /refer (lib/refer/copy.ts) and /reviews
 * (lib/reviews/copy.ts). A new page with hand-written copy adds its own
 * `<page>Strings()` here.
 *
 * The newsletter templates (lib/issues/copy.ts) get the same checker with
 * rules of their own: no superlatives and no license numbers. They carry
 * figures, filled in from the data, so the no-figures rule doesn't apply.
 * The Tide web issue's templates (lib/tide/copy.ts) get the same rules.
 */
import { checkFairHousing } from "../lib/fair-housing.ts";
import { channelStrings } from "../lib/channels/copy.ts";
import { hubStrings } from "../lib/hubs/copy.ts";
import { issueStrings } from "../lib/issues/copy.ts";
import { REVIEW_CONSENT_WORDING } from "../lib/leads.ts";
import { referStrings } from "../lib/refer/copy.ts";
import { reviewsStrings } from "../lib/reviews/copy.ts";
import { tideWebStrings } from "../lib/tide/copy.ts";

const SOURCES = [
  ...hubStrings(),
  ...channelStrings(),
  ...referStrings(),
  ...reviewsStrings(),
  { where: "lib/leads.ts: REVIEW_CONSENT_WORDING", text: REVIEW_CONSENT_WORDING },
];

/** Hub-specific rules on top of the brokerage list. Places, never people; no figures. */
const HUB_RULES = [
  { pattern: /\bschools?\b/i, reason: "school reference (zoned schools live on Atlas pages only, with the district link)" },
  { pattern: /\b(safe|safety|unsafe|crime|low[- ]crime)\b/i, reason: "safety or crime reference" },
  { pattern: /\bfamil(y|ies)\b/i, reason: "familial-status reference" },
  { pattern: /\b(kids?|children)\b/i, reason: "familial-status reference" },
  { pattern: /\b(retire(e|es|d|ment)?|seniors?|55\s?\+|active adult|age[- ]restricted)\b/i, reason: "age reference" },
  { pattern: /\b(best|perfect|ideal) for\b/i, reason: "steering (\"best for\")" },
  { pattern: /\b(demographics?|household income|income level|affluent|wealthy|upscale|luxury buyers?)\b/i, reason: "income or demographic reference" },
  { pattern: /\b(median|average|per square foot|per foot|\$\s?\d)/i, reason: "a figure" },
  { pattern: /\d{1,3}(,\d{3})+/, reason: "a figure" },
  { pattern: /\b(SL|BK)\s?\d{5,}\b/i, reason: "a license number" },
];

/** The newsletters' rules: figures are fine (they're computed), praise and license numbers are not. */
const ISSUE_RULES = [
  { pattern: /\b(best|finest|greatest|biggest|hottest|amazing|stunning|incredible|perfect|unbeatable|ultimate|world-class|must-see|exclusive|spectacular|breathtaking)\b/i, reason: "a superlative" },
  { pattern: /\b(SL|BK)\s?\d{5,}\b/i, reason: "a license number" },
  { pattern: /\blands\b/i, reason: "\"lands\" as a verb (say comes out, arrives, falls)" },
];

let flagged = 0;
let checked = 0;
const all = [...SOURCES.map((s) => ({ ...s, rules: HUB_RULES })), ...issueStrings().map((s) => ({ ...s, rules: ISSUE_RULES })), ...tideWebStrings().map((s) => ({ ...s, rules: ISSUE_RULES }))];
for (const { where, text, rules } of all) {
  checked += 1;
  const result = checkFairHousing(text);
  const extra = rules.filter((r) => r.pattern.test(text)).map((r) => ({ pattern: r.pattern.source, reason: r.reason }));
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
console.log(`✓ ${checked} strings checked, nothing flagged.`);
