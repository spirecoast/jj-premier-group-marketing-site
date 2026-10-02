import "server-only";
import { inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { questionnaireAnswers } from "@/lib/db/schema";
import type { Answer, Respondent } from "./model";

/**
 * Postgres storage for the questionnaire (table questionnaire_answers,
 * migration 0007). The table is created on first use in each server process,
 * so the links work even if nobody has run `npm run db:migrate`.
 *
 * Without DATABASE_URL nothing here throws: callers get "missing" and the
 * form keeps answers in the browser until the database is connected.
 */

export type DbState = "ok" | "missing" | "error";

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS "questionnaire_answers" (
    "respondent" text NOT NULL,
    "question_id" text NOT NULL,
    "value" text,
    "choice" text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "questionnaire_answers_respondent_question_id_pk" PRIMARY KEY("respondent","question_id")
  )`,
  `ALTER TABLE "questionnaire_answers" ENABLE ROW LEVEL SECURITY`,
];

let ready: Promise<void> | null = null;

async function db() {
  const database = getDb();
  if (!ready) {
    ready = (async () => {
      for (const statement of DDL) await database.execute(sql.raw(statement));
    })();
    // A failure (database asleep, a race with another process) is retried on the next call.
    ready.catch(() => {
      ready = null;
    });
  }
  await ready;
  return database;
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
    const database = await db();
    const rows = await database
      .select()
      .from(questionnaireAnswers)
      .where(inArray(questionnaireAnswers.respondent, respondents));
    return { state: "ok", answers: rows.map(toAnswer) };
  } catch (err) {
    console.error("[questionnaire] load failed:", err instanceof Error ? err.message : err);
    return { state: "error", answers: [] };
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
    const database = await db();
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
    console.error("[questionnaire] save failed:", err instanceof Error ? err.message : err);
    return "error";
  }
}
