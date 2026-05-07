/**
 * Fair Housing checker per ARCHITECTURE.md §17 (CLAUDE.md hard rule).
 *
 * Banned-phrase regex check on any AI-generated or marketing content before
 * it leaves the system. Returns flags rather than throwing so callers can
 * decide policy: marketing email pipeline blocks the send; CRM admin UI may
 * surface flags for human review and override.
 *
 * The list errs on the side of catching too much — better a false positive
 * caught at draft time than a Fair Housing complaint. Maintainers should add
 * to this list as new patterns surface; never remove without legal review.
 */

type Flag = { pattern: string; reason: string };

const BLOCKED: { pattern: RegExp; reason: string }[] = [
  // Familial status
  { pattern: /\bperfect for families\b/i, reason: "familial-status reference" },
  { pattern: /\bgreat for kids\b/i, reason: "familial-status reference" },
  { pattern: /\bideal for (children|kids)\b/i, reason: "familial-status reference" },
  { pattern: /\bfamily home\b/i, reason: "familial-status reference (use 'home with X bedrooms')" },
  { pattern: /\bempty nesters?\b/i, reason: "familial-status / age reference" },
  { pattern: /\bbachelor pad\b/i, reason: "marital-status reference" },
  { pattern: /\bstarter home\b/i, reason: "familial-status / income reference" },
  { pattern: /\bno (children|kids)\b/i, reason: "familial-status exclusion" },

  // Steering / coded language
  { pattern: /\bexclusive (neighborhood|community|area)\b/i, reason: "steering language" },
  { pattern: /\b(safe|unsafe) (neighborhood|community|area)\b/i, reason: "steering language" },
  { pattern: /\b(good|bad|great|nice) (schools?|area|neighborhood)\b/i, reason: "coded steering language" },
  { pattern: /\bdesirable (neighborhood|community|area)\b/i, reason: "steering language" },
  { pattern: /\bup-and-coming (neighborhood|area)\b/i, reason: "potentially coded steering" },

  // Religion / national origin
  { pattern: /\b(christian|jewish|muslim|catholic|hindu|buddhist) (neighborhood|community)\b/i, reason: "religion reference" },
  { pattern: /\bquiet (christian|jewish|muslim) (neighborhood|community)\b/i, reason: "religion reference" },
  { pattern: /\bwalking distance to (church|temple|mosque|synagogue)\b/i, reason: "religion reference" },

  // Age
  { pattern: /\b(young|old) professionals?\b/i, reason: "age reference" },
  { pattern: /\b55\+ (only|community)\b/i, reason: "age reference (55+ communities are an exception but require explicit disclosure)" },

  // Disability
  { pattern: /\bable[- ]bodied\b/i, reason: "disability reference" },
  { pattern: /\bperfect for (active|able)\b/i, reason: "disability inference" },

  // Source-of-income / occupational restriction (FL housing protections)
  { pattern: /\bno (section[- ]?8|vouchers?)\b/i, reason: "source-of-income exclusion" },
  { pattern: /\bworking professionals? only\b/i, reason: "occupational/source-of-income exclusion" },

  // Smoking and pet exclusions are sometimes legitimate (HOA disclosures), so
  // they're flagged but should pass after manual review with appropriate context.
  { pattern: /\bno smokers?\b/i, reason: "review: lifestyle exclusion (allowed in HOA disclosures only)" },
];

export type FairHousingResult =
  | { passed: true }
  | { passed: false; flags: Flag[] };

export function checkFairHousing(content: string): FairHousingResult {
  const flags: Flag[] = [];
  for (const { pattern, reason } of BLOCKED) {
    if (pattern.test(content)) {
      flags.push({ pattern: pattern.source, reason });
    }
  }
  return flags.length === 0 ? { passed: true } : { passed: false, flags };
}
