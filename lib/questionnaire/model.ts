import { PROMISE_OPTIONS, SECTIONS, type Question, type Section } from "./questions";

/**
 * Who answers, which questions each of them sees, and how the questions are
 * numbered. Pure, shared by the form, the compiled view, the exports and tests.
 */

export const RESPONDENTS = ["joelyn", "jessica"] as const;
export type Respondent = (typeof RESPONDENTS)[number];
export type Role = Respondent | "admin";

export const RESPONDENT_NAME: Record<Respondent, string> = { joelyn: "Joelyn", jessica: "Jessica" };

/** Most a single answer may hold. The longest real answer is a client story. */
export const MAX_VALUE_LENGTH = 10_000;

/** The two personal sections each belong to one person; every other section is asked of both. */
const PERSONAL_SECTION: Record<string, Respondent> = { joelyn: "joelyn", jessica: "jessica" };

export function sectionRespondents(section: Section): Respondent[] {
  const owner = PERSONAL_SECTION[section.id];
  return owner ? [owner] : [...RESPONDENTS];
}

export function isSharedSection(section: Section): boolean {
  return !PERSONAL_SECTION[section.id];
}

/** The sections a respondent sees, in order: their own section, then the shared ones. */
export function sectionsFor(respondent: Respondent): Section[] {
  return SECTIONS.filter((s) => sectionRespondents(s).includes(respondent));
}

export type NumberedQuestion = { question: Question; section: Section; num: number };

/** Questions numbered 1..n in the order given. */
export function numberQuestions(sections: Section[]): NumberedQuestion[] {
  const out: NumberedQuestion[] = [];
  for (const section of sections) {
    for (const question of section.qs) out.push({ question, section, num: out.length + 1 });
  }
  return out;
}

/** Every question in the source order, numbered as the source numbers them (1..121). */
export const ALL_QUESTIONS: NumberedQuestion[] = numberQuestions(SECTIONS);

const BY_ID = new Map(ALL_QUESTIONS.map((n) => [n.question.id, n]));

export function findQuestion(id: string): NumberedQuestion | undefined {
  return BY_ID.get(id);
}

/** True when `respondent` is asked question `id`. */
export function canAnswer(respondent: Respondent, id: string): boolean {
  const n = BY_ID.get(id);
  return Boolean(n && sectionRespondents(n.section).includes(respondent));
}

/** The radio options a question offers, or null for a text-only question. */
export function optionsFor(q: Question): readonly string[] | null {
  if (q.type === "promise") return PROMISE_OPTIONS;
  if (q.type === "choice") return q.options;
  return null;
}

/** Whether a question has a free-text box (a choice question without `note` has none). */
export function hasText(q: Question): boolean {
  return !(q.type === "choice" && !q.note);
}

/** The question line as it's shown: promises and site answers are quotes. */
export function questionLine(q: Question): string {
  return q.type === "promise" || q.type === "faq" ? `“${q.q}”` : q.q;
}

/** One person's answer to one question. */
export type Answer = {
  respondent: Respondent;
  questionId: string;
  value: string;
  choice: string | null;
  /** ISO timestamp. */
  updatedAt: string;
};

export function hasContent(a: { value?: string | null; choice?: string | null } | undefined | null): boolean {
  return Boolean(a && ((a.value && a.value.trim()) || a.choice));
}

/** Two answers that say different things (both must have content). */
export function answersDiffer(a: Answer | undefined, b: Answer | undefined): boolean {
  if (!hasContent(a) || !hasContent(b)) return false;
  const norm = (s: string | null | undefined) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return norm(a!.choice) !== norm(b!.choice) || norm(a!.value) !== norm(b!.value);
}

export type AnswerIndex = Map<string, Answer>;

export function answerKey(respondent: Respondent, questionId: string): string {
  return `${respondent}:${questionId}`;
}

export function indexAnswers(answers: Answer[]): AnswerIndex {
  return new Map(answers.map((a) => [answerKey(a.respondent, a.questionId), a]));
}

export type Progress = { answered: number; total: number; lastUpdated: string | null };

/** Answered / total over the questions a respondent sees, and their latest save. */
export function progressFor(respondent: Respondent, index: AnswerIndex): Progress {
  const qs = numberQuestions(sectionsFor(respondent));
  let answered = 0;
  let lastUpdated: string | null = null;
  for (const { question } of qs) {
    const a = index.get(answerKey(respondent, question.id));
    if (hasContent(a)) answered += 1;
    if (a && (!lastUpdated || a.updatedAt > lastUpdated)) lastUpdated = a.updatedAt;
  }
  return { answered, total: qs.length, lastUpdated };
}
