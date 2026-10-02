"use server";

import { roleForToken } from "@/lib/questionnaire/access";
import { saveAnswers } from "@/lib/questionnaire/store";
import { saveSchema, validEntries, type SaveInput } from "@/lib/questionnaire/validate";

export type SaveResult = { ok: true } | { ok: false; reason: "invalid" | "missing" | "error" };

/**
 * Saves answers from a respondent's link. The token is checked again here
 * (a server action can be called directly), and a respondent can only write
 * their own rows, for questions they're asked.
 */
export async function saveQuestionnaireAnswers(input: SaveInput): Promise<SaveResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const role = roleForToken(parsed.data.token);
  if (role !== "joelyn" && role !== "jessica") return { ok: false, reason: "invalid" };
  const entries = validEntries(role, parsed.data.entries);
  if (!entries) return { ok: false, reason: "invalid" };
  const state = await saveAnswers(role, entries);
  return state === "ok" ? { ok: true } : { ok: false, reason: state };
}
