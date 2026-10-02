import {
  ALL_QUESTIONS,
  RESPONDENTS,
  RESPONDENT_NAME,
  answerKey,
  answersDiffer,
  hasContent,
  indexAnswers,
  isSharedSection,
  progressFor,
  questionLine,
  sectionRespondents,
  type Answer,
  type Respondent,
} from "./model";
import { SECTIONS } from "./questions";

/**
 * Both people's answers as one document: Markdown to read, CSV to sort.
 * Pure; the route handler at app/(questionnaire)/q/[token]/export does the I/O.
 */

/** The team works in Florida, so times read in Eastern time. */
export const TIME_ZONE = "America/New_York";

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

function answerText(a: Answer | undefined): string {
  if (!hasContent(a)) return "";
  const value = (a!.value ?? "").trim();
  return a!.choice ? (value ? `${a!.choice}. ${value}` : a!.choice) : value;
}

function quoteBlock(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n");
}

export function compileMarkdown(answers: Answer[], now: Date = new Date()): string {
  const index = indexAnswers(answers);
  const out: string[] = [];
  out.push("# Website questionnaire: both sets of answers", "");
  out.push(`Compiled ${formatTime(now.toISOString())}.`, "");
  for (const r of RESPONDENTS) {
    const p = progressFor(r, index);
    const last = p.lastUpdated ? `, last updated ${formatTime(p.lastUpdated)}` : "";
    out.push(`- ${RESPONDENT_NAME[r]}: ${p.answered} of ${p.total} answered${last}`);
  }
  out.push("");

  const nums = new Map(ALL_QUESTIONS.map((n) => [n.question.id, n.num]));
  SECTIONS.forEach((section, si) => {
    out.push(`## ${si + 1}. ${section.title}`, "");
    const who = sectionRespondents(section);
    for (const q of section.qs) {
      const tag = q.tag ? `${q.tag}: ` : "";
      out.push(`### ${nums.get(q.id)}. ${tag}${questionLine(q)}`, "");
      const pair = who.map((r) => index.get(answerKey(r, q.id)));
      if (isSharedSection(section) && answersDiffer(pair[0], pair[1])) out.push("*The two answers differ.*", "");
      who.forEach((r, i) => {
        const a = pair[i];
        out.push(`**${RESPONDENT_NAME[r]}**`, "");
        out.push(hasContent(a) ? quoteBlock(answerText(a)) : "*No answer yet*", "");
      });
    }
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/**
 * One CSV field. Quotes it when it holds a comma, quote or line break
 * (RFC 4180), and defuses a leading = + @ or tab so a spreadsheet reads a
 * formula-looking answer as text.
 */
export function csvField(raw: string | number | null | undefined): string {
  let s = raw == null ? "" : String(raw);
  if (/^[=+@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_COLUMNS = [
  "section",
  "question_number",
  "question_id",
  "question",
  "joelyn_choice",
  "joelyn_answer",
  "jessica_choice",
  "jessica_answer",
  "joelyn_updated_at",
  "jessica_updated_at",
] as const;

export function compileCsv(answers: Answer[]): string {
  const index = indexAnswers(answers);
  const rows: string[][] = [[...CSV_COLUMNS]];
  for (const { question, section, num } of ALL_QUESTIONS) {
    const who = sectionRespondents(section);
    const cell = (r: Respondent) => {
      const a = who.includes(r) ? index.get(answerKey(r, question.id)) : undefined;
      return {
        choice: a?.choice ?? "",
        value: (a?.value ?? "").trim(),
        updated: hasContent(a) ? a!.updatedAt : "",
      };
    };
    const j = cell("joelyn");
    const s = cell("jessica");
    const tag = question.tag ? `${question.tag}: ` : "";
    rows.push([section.title, String(num), question.id, `${tag}${questionLine(question)}`, j.choice, j.value, s.choice, s.value, j.updated, s.updated]);
  }
  // A byte-order mark so Excel reads the curly quotes as UTF-8; CRLF per RFC 4180.
  return "﻿" + rows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

export function exportFilename(ext: "md" | "csv", now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return `website-questionnaire-${day}.${ext}`;
}
