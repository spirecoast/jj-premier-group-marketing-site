-- ============================================================================
-- 0007_questionnaire.sql
--
-- The website questionnaire behind the private /q/<token> links: one row per
-- person ('joelyn' or 'jessica') per question id (lib/questionnaire/questions.ts).
--
-- IF NOT EXISTS because lib/questionnaire/store.ts runs the same statements
-- once per server process before its first read or write, so the table may
-- already be there when this migration runs.
--
-- RLS enabled, no policies: the anon/authenticated roles can read nothing.
-- The server writes through the postgres role (DATABASE_URL), as elsewhere.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "questionnaire_answers" (
	"respondent" text NOT NULL,
	"question_id" text NOT NULL,
	"value" text,
	"choice" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questionnaire_answers_respondent_question_id_pk" PRIMARY KEY("respondent","question_id")
);
--> statement-breakpoint
ALTER TABLE "questionnaire_answers" ENABLE ROW LEVEL SECURITY;
