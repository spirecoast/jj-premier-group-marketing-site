import "server-only";
import { inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import { questionnaireAnswers } from "@/lib/db/schema";
import type { Answer, Respondent } from "./model";

/**
 * Postgres storage for the questionnaire (table questionnaire_answers,
 * migration 0007, applied with the others in docs/LAUNCH.md 4.3).
 *
 * Without DATABASE_URL, or before migration 0007 is applied, nothing here
 * throws: callers get "missing" and the form keeps answers in the browser
 * until the database is ready.
 */

export type DbState = "ok" | "missing" | "error";

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** A failed query: "missing" when the table isn't there yet (logged once), otherwise "error". */
function failure(what: "load" | "save", err: unknown): DbState {
  if (isMissingTable(err)) {
    warnMissingTable("questionnaire_answers", "0007_questionnaire.sql");
    return "missing";
  }
  console.error(`[questionnaire] ${what} failed:`, err instanceof Error ? err.message : err);
  return "error";
}

function toAnswer(row: typeof questionnaireAnswers.$inferSelect): Answer {
  return {
    respondent: row.respondent as Respondent,
    questionId: row.questionId,
    value: row.value ?? "",
    choice: row.choice ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function loadAnswers(respondents: Respondent[]): Promise<{ state: DbState; answers: Answer[] }> {
  if (!dbConfigured()) return { state: "missing", answers: [] };
  try {
    const database = getDb();
    const rows = await database
      .select()
      .from(questionnaireAnswers)
      .where(inArray(questionnaireAnswers.respondent, respondents));
    return { state: "ok", answers: rows.map(toAnswer) };
  } catch (err) {
    return { state: failure("load", err), answers: [] };
  }
}

export type SaveEntry = { questionId: string; value: string; choice: string | null; updatedAt: Date };

/**
 * Upserts one person's answers. `updated_at` is when the answer was typed, so
 * an older copy pushed late from another device never overwrites a newer one.
 */
export async function saveAnswers(respondent: Respondent, entries: SaveEntry[]): Promise<DbState> {
  if (!dbConfigured()) return "missing";
  if (!entries.length) return "ok";
  try {
    const database = getDb();
    await database
      .insert(questionnaireAnswers)
      .values(entries.map((e) => ({ respondent, questionId: e.questionId, value: e.value, choice: e.choice, updatedAt: e.updatedAt })))
      .onConflictDoUpdate({
        target: [questionnaireAnswers.respondent, questionnaireAnswers.questionId],
        set: {
          value: sql`excluded.value`,
          choice: sql`excluded.choice`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`${questionnaireAnswers.updatedAt} <= excluded.updated_at`,
      });
    return "ok";
  } catch (err) {
    return failure("save", err);
  }
}
