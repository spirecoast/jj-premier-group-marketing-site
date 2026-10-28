#!/usr/bin/env node
/**
 * Fair Housing and voice check over hand-written site copy.
 *
 *   node scripts/check-copy.mjs        (Node 22.18+ strips the TypeScript types itself)
 *
 * Runs lib/fair-housing.ts over every string in the copy files below, plus a
 * stricter list on top: nothing about people (demographics, income, schools,
 * safety, age), no prices or figures, no license numbers. Exits 1 on any flag
 * so it can gate a build.
 *
 * Sources: the market hubs (lib/hubs/copy.ts), the channel landing pages
 * (lib/channels/copy.ts), /refer (lib/refer/copy.ts, plus the referral box
 * and the plans from lib/leads/constants.ts) and /reviews (lib/reviews/copy.ts). A new
 * page with hand-written copy adds its own `<page>Strings()` here.
 *
 * The newsletter templates (lib/issues/copy.ts) get the same checker with
 * rules of their own: no superlatives and no license numbers. The subscriber
 * emails and pages (lib/newsletter/copy.ts: the confirmation, the welcome,
 * the unsubscribe line, the confirm and unsubscribe pages, the team's hold
 * and send page) get those rules and the places-not-people rules. They carry
 * figures, filled in from the data, so the no-figures rule doesn't apply.
 * The Tide web issue's templates and its "facts to write from" lines
 * (lib/tide/copy.ts) get the same rules, and so does the wording around the
 * private questionnaire (lib/questionnaire/copy.ts; the questions themselves
 * are the client's record and aren't checked), and so do the search page and
 * its page summaries (lib/search/copy.ts).
 *
 * Tide's hand-written words (lib/tide/issues.ts: each issue's opening, "If
 * you're buying", "If you're selling", what to watch, and the notes Joelyn
 * and Jessica sign) get the issue rules and the places-not-people rules.
 *
 * The voice rules (lib/voice.ts: "the read", "the mark", "delve", "let's",
 * "whether you're", a hook question answered straight after, …) run over all
 * of it, and over every other string a reader can see in app/, components/
 * and lib/ (scripts/copy-literals.mjs pulls them out of the source without
 * running it, JSX text with its entities decoded). Those strings also get the
 * Fair Housing list and the places-not-people rules, with a short list of
 * honest uses set aside (single-family homes, school taxes, the state's My
 * Safe Florida Home program, zoned schools on Atlas's own pages). lib/search is checked through its copy file, and its voice
 * flags are printed as warnings only: that directory belongs to the search
 * work, which fixes them there.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkFairHousing } from "../lib/fair-housing.ts";
import { cardStrings } from "../lib/cards/copy.ts";
import { channelStrings } from "../lib/channels/copy.ts";
import { hubStrings } from "../lib/hubs/copy.ts";
import { issueStrings } from "../lib/issues/copy.ts";
import { newsletterStrings } from "../lib/newsletter/copy.ts";
import { watchStrings } from "../lib/watch/copy.ts";
import { REFERRAL_CONSENT_WORDING, REFERRAL_PLANS, REVIEW_CONSENT_WORDING } from "../lib/leads/constants.ts";
import { questionnaireStrings } from "../lib/questionnaire/copy.ts";
import { roomStrings } from "../lib/room/copy.ts";
import { referStrings } from "../lib/refer/copy.ts";
import { reviewsStrings } from "../lib/reviews/copy.ts";
import { searchStrings } from "../lib/search/copy.ts";
import { tideWebStrings } from "../lib/tide/copy.ts";
import { tideNarrativeStrings } from "../lib/tide/issues.ts";
import { AI_TELLS } from "../lib/voice.ts";
import { siteLiterals } from "./copy-literals.mjs";
import { PEOPLE_RULES, peopleHits } from "./copy-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = [
  ...hubStrings(),
  ...channelStrings(),
  ...referStrings(),
  ...reviewsStrings(),
  { where: "lib/leads/constants.ts: REVIEW_CONSENT_WORDING", text: REVIEW_CONSENT_WORDING },
  { where: "lib/leads/constants.ts: REFERRAL_CONSENT_WORDING", text: REFERRAL_CONSENT_WORDING },
  ...REFERRAL_PLANS.map((p) => ({ where: `lib/leads/constants.ts: REFERRAL_PLANS ${p}`, text: p })),
];

/** Hub-specific rules on top of the brokerage list. Places, never people; no figures. */
const HUB_RULES = [
  ...PEOPLE_RULES,
  { pattern: /\b(median|average|per square foot|per foot|\$\s?\d)/i, reason: "a figure" },
  { pattern: /\d{1,3}(,\d{3})+/, reason: "a figure" },
  { pattern: /\b(SL|BK)\s?\d{5,}\b/i, reason: "a license number" },
];

/** The newsletters' rules: figures are fine (they're computed), praise and license numbers are not. */
const ISSUE_RULES = [
  { pattern: /\b(best|finest|greatest|biggest|hottest|amazing|stunning|incredible|perfect|unbeatable|ultimate|world-class|must-see|exclusive|spectacular|breathtaking)\b/i, reason: "a superlative" },
  { pattern: /\b(SL|BK)\s?\d{5,}\b/i, reason: "a license number" },
];

/** Tide's story: county records have no list prices, days on market or inventory, so the words never imply them. */
const NARRATIVE_RULES = [
  ...ISSUE_RULES,
  ...PEOPLE_RULES,
  { pattern: /\b(days on (the )?market|list(ing)? prices?|asking prices? (rose|fell|dropped|climbed)|inventory|months of supply|price cuts?|bidding wars?)\b/i, reason: "a figure county records don't carry (not MLS)" },
  { pattern: /\?/, reason: "a question in the narrative" },
];

/** Every rule in lib/voice.ts, as the checker's { pattern, reason, test } shape. */
const VOICE = AI_TELLS.map((r) => ({ pattern: r.pattern, reason: `reads as machine-written: ${r.reason}`, test: r.test }));
const hits = (rules, text) => rules.filter((r) => (r.test ? r.test(text.trim()) : r.pattern.test(text.trim())));

const all = [
  ...SOURCES.map((s) => ({ ...s, rules: [...HUB_RULES, ...VOICE] })),
  ...issueStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...VOICE] })),
  // The subscriber emails and their pages: the issue rules and places, never people.
  ...newsletterStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...PEOPLE_RULES, ...VOICE] })),
  ...watchStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...PEOPLE_RULES, ...VOICE] })),
  ...tideWebStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...VOICE] })),
  ...tideNarrativeStrings().map((s) => ({ ...s, rules: [...NARRATIVE_RULES, ...VOICE] })),
  ...questionnaireStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...VOICE] })),
  ...roomStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...VOICE] })),
  // The cards to post and their captions (lib/cards/copy.ts): figures from the data, places never people.
  ...cardStrings().map((s) => ({ ...s, rules: [...ISSUE_RULES, ...PEOPLE_RULES, ...VOICE] })),
  ...searchStrings().map((s) => ({ ...s, rules: ISSUE_RULES, warn: VOICE })),
];

let flagged = 0;
let checked = 0;
let warned = 0;
const show = (mark, where, text, flags) => {
  console.error(`\n${mark} ${where}\n  "${text.slice(0, 160)}${text.length > 160 ? "…" : ""}"`);
  for (const f of flags) console.error(`  - ${f.reason}${f.test ? "" : `  (/${f.pattern}/)`}`);
};
for (const { where, text, rules, warn } of all) {
  checked += 1;
  const result = checkFairHousing(text);
  const flags = [...(result.passed ? [] : result.flags), ...hits(rules, text)];
  const soft = warn ? hits(warn, text) : [];
  if (soft.length) {
    warned += 1;
    show("!", `${where} (warning)`, text, soft);
  }
  if (!flags.length) continue;
  flagged += 1;
  show("✗", where, text, flags);
}

// Every other string a reader can see in app/, components/ and lib/: the voice rules, the brokerage's Fair Housing
// list and places, never people (with the honest uses above set aside).
const literals = siteLiterals(ROOT);
for (const { where, text } of literals) {
  checked += 1;
  const fair = checkFairHousing(text);
  const flags = [...(fair.passed ? [] : fair.flags), ...peopleHits(where, text), ...hits(VOICE, text)];
  if (!flags.length) continue;
  flagged += 1;
  show("✗", where, text, flags);
}

if (flagged) {
  console.error(`\n${flagged} of ${checked} strings flagged.`);
  process.exit(1);
}
console.log(`✓ ${checked} strings checked (${literals.length} of them pulled from the site's source), nothing flagged${warned ? `; ${warned} warning${warned === 1 ? "" : "s"} in lib/search` : ""}.`);
