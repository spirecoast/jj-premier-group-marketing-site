import { z } from "zod";
import { MAX_VALUE_LENGTH, canAnswer, findQuestion, hasText, optionsFor, type Respondent } from "./model";

/**
 * The shape a save may take, checked on the server before anything is written.
 * Pure, so the rules are unit-tested.
 */

const entrySchema = z.object({
  questionId: z.string().min(1).max(80),
  value: z.string().max(MAX_VALUE_LENGTH),
  choice: z.string().max(200).nullable(),
  /** When the answer was typed, ISO 8601. */
  updatedAt: z.string().max(40),
});

export const saveSchema = z.object({
  token: z.string().min(1).max(100),
  entries: z.array(entrySchema).min(1).max(200),
});

export type SaveInput = z.input<typeof saveSchema>;
export type ValidEntry = { questionId: string; value: string; choice: string | null; updatedAt: Date };

/** A typed-at time from the browser, held to the last year and no later than now. */
export function clampTime(iso: string, now: Date = new Date()): Date {
  const t = Date.parse(iso);
  const latest = now.getTime();
  const earliest = latest - 365 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(t) || t > latest) return new Date(latest);
  return new Date(Math.max(t, earliest));
}

/**
 * The entries a respondent may write, deduplicated by question (the latest
 * wins), or null if any entry names a question they aren't asked, an option
 * the question doesn't offer, or text where the question takes none.
 */
export function validEntries(
  respondent: Respondent,
  entries: z.output<typeof entrySchema>[],
  now: Date = new Date(),
): ValidEntry[] | null {
  const out = new Map<string, ValidEntry>();
  for (const e of entries) {
    const n = findQuestion(e.questionId);
    if (!n || !canAnswer(respondent, e.questionId)) return null;
    const options = optionsFor(n.question);
    if (e.choice !== null && !(options && options.includes(e.choice))) return null;
    if (!hasText(n.question) && e.value !== "") return null;
    const entry = { questionId: e.questionId, value: e.value, choice: e.choice, updatedAt: clampTime(e.updatedAt, now) };
    const prev = out.get(e.questionId);
    if (!prev || prev.updatedAt <= entry.updatedAt) out.set(e.questionId, entry);
  }
  return [...out.values()];
}
