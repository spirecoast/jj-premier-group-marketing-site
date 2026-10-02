import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { TOKEN_HASHES, roleForToken, roleForTokenIn, type TokenTable } from "./access";
import { CSV_COLUMNS, compileCsv, compileMarkdown, csvField } from "./compile";
import { questionnaireStrings } from "./copy";
import { ALL_QUESTIONS, answersDiffer, canAnswer, progressFor, indexAnswers, sectionsFor, type Answer } from "./model";
import { SECTIONS } from "./questions";
import { clampTime, saveSchema, validEntries } from "./validate";

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

/** A small RFC 4180 reader, enough to round-trip what compileCsv writes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

describe("questionnaire links", () => {
  const table: TokenTable = [
    { role: "joelyn", sha256: sha("joelyn-test-token-000000") },
    { role: "jessica", sha256: sha("jessica-test-token-00000") },
    { role: "admin", sha256: sha("admin-test-token-0000000") },
  ];

  it("a good token opens its role", () => {
    assert.equal(roleForTokenIn(table, "joelyn-test-token-000000"), "joelyn");
    assert.equal(roleForTokenIn(table, "jessica-test-token-00000"), "jessica");
  });

  it("the admin token opens the compiled view", () => {
    assert.equal(roleForTokenIn(table, "admin-test-token-0000000"), "admin");
  });

  it("anything else opens nothing", () => {
    assert.equal(roleForTokenIn(table, "joelyn-test-token-000001"), null);
    assert.equal(roleForTokenIn(table, "JOELYN-TEST-TOKEN-000000"), null);
    assert.equal(roleForTokenIn(table, ""), null);
    assert.equal(roleForTokenIn(table, "short"), null);
    assert.equal(roleForTokenIn(table, "has spaces in it, not a token"), null);
    assert.equal(roleForTokenIn(table, "x".repeat(200)), null);
    assert.equal(roleForTokenIn(table, undefined), null);
    assert.equal(roleForTokenIn(table, 42), null);
    // The real table never matches a made-up token, or a stored hash passed as a token.
    assert.equal(roleForToken("aaaaaaaaaaaaaaaaaaaaaaaa"), null);
    assert.equal(roleForToken(TOKEN_HASHES[0].sha256), null);
  });

  it("the repo holds one SHA-256 per role and nothing else", () => {
    assert.deepEqual(TOKEN_HASHES.map((t) => t.role).sort(), ["admin", "jessica", "joelyn"]);
    for (const t of TOKEN_HASHES) assert.match(t.sha256, /^[0-9a-f]{64}$/);
    assert.equal(new Set(TOKEN_HASHES.map((t) => t.sha256)).size, 3);
  });
});

describe("the question list", () => {
  it("matches the source artifact: 121 questions in 10 sections", () => {
    assert.equal(ALL_QUESTIONS.length, 121);
    assert.deepEqual(
      SECTIONS.map((s) => [s.id, s.qs.length]),
      [
        ["joelyn", 14],
        ["jessica", 14],
        ["team", 12],
        ["promises", 16],
        ["faq", 18],
        ["facts", 11],
        ["tools", 20],
        ["photos", 7],
        ["issues", 7],
        ["else", 2],
      ],
    );
  });

  it("every id is unique", () => {
    const ids = ALL_QUESTIONS.map((n) => n.question.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(SECTIONS.map((s) => s.id)).size, SECTIONS.length);
  });

  it("every question has what its type needs", () => {
    for (const { question: q } of ALL_QUESTIONS) {
      assert.ok(q.q.trim(), q.id);
      if (q.type === "choice") assert.ok(q.options.length >= 2, q.id);
      if (q.type === "promise") assert.ok(q.body.trim(), q.id);
      if (q.type === "faq") assert.ok(q.current.trim(), q.id);
    }
  });

  it("each person sees their own section and the shared ones, never the other's", () => {
    assert.deepEqual(sectionsFor("joelyn").map((s) => s.id), ["joelyn", "team", "promises", "faq", "facts", "tools", "photos", "issues", "else"]);
    assert.deepEqual(sectionsFor("jessica").map((s) => s.id), ["jessica", "team", "promises", "faq", "facts", "tools", "photos", "issues", "else"]);
    assert.ok(canAnswer("joelyn", "joelyn.grew-up"));
    assert.ok(!canAnswer("joelyn", "jessica.grew-up"));
    assert.ok(canAnswer("jessica", "team.lead"));
    assert.ok(!canAnswer("jessica", "nope.nothing"));
    assert.equal(progressFor("joelyn", new Map()).total, 107);
  });
});

const at = "2026-10-02T15:00:00.000Z";
const ans = (respondent: "joelyn" | "jessica", questionId: string, value: string, choice: string | null = null): Answer => ({
  respondent,
  questionId,
  value,
  choice,
  updatedAt: at,
});

describe("compiling both sets of answers", () => {
  const answers = [
    ans("joelyn", "joelyn.grew-up", "Ohio, then Florida"),
    ans("joelyn", "team.lead", 'Whoever "picks up" first,\nusually me'),
    ans("jessica", "team.lead", "Whoever picks up first"),
    ans("joelyn", "promise.buy-video", "", "Yes"),
    ans("jessica", "promise.buy-video", "Keep it", "Yes"),
    ans("jessica", "tools.mailbox", "", "Gmail (Google)"),
    ans("jessica", "else.other", "=SUM(A1:A9)"),
  ];

  it("csv fields quote commas, quotes and line breaks", () => {
    assert.equal(csvField("plain"), "plain");
    assert.equal(csvField("a, b"), '"a, b"');
    assert.equal(csvField('say "yes"'), '"say ""yes"""');
    assert.equal(csvField("one\ntwo"), '"one\ntwo"');
    assert.equal(csvField("one\r\ntwo"), '"one\r\ntwo"');
    assert.equal(csvField(null), "");
    assert.equal(csvField(7), "7");
  });

  it("csv fields defuse a leading formula character", () => {
    assert.equal(csvField("=SUM(A1)"), "'=SUM(A1)");
    assert.equal(csvField("+1 941"), "'+1 941");
    assert.equal(csvField("@handle"), "'@handle");
    assert.equal(csvField("- a list item"), "- a list item");
  });

  it("the csv has one row per question, both answers on it, and survives a round trip", () => {
    const csv = compileCsv(answers);
    assert.ok(csv.startsWith("﻿"));
    const rows = parseCsv(csv.slice(1));
    assert.deepEqual(rows[0], [...CSV_COLUMNS]);
    assert.equal(rows.length, 1 + 121);
    const col = (name: (typeof CSV_COLUMNS)[number]) => CSV_COLUMNS.indexOf(name);
    const lead = rows.find((r) => r[col("question_id")] === "team.lead")!;
    assert.equal(lead[col("joelyn_answer")], 'Whoever "picks up" first,\nusually me');
    assert.equal(lead[col("jessica_answer")], "Whoever picks up first");
    assert.equal(lead[col("joelyn_updated_at")], at);
    const video = rows.find((r) => r[col("question_id")] === "promise.buy-video")!;
    assert.equal(video[col("joelyn_choice")], "Yes");
    assert.equal(video[col("jessica_answer")], "Keep it");
    assert.match(video[col("question")], /^For a buyer · Showings: “Video walk-throughs/);
    const other = rows.find((r) => r[col("question_id")] === "else.other")!;
    assert.equal(other[col("jessica_answer")], "'=SUM(A1:A9)");
    const first = rows[1];
    assert.equal(first[col("question_number")], "1");
    assert.equal(first[col("section")], "Joelyn, in your words");
  });

  it("the markdown has every section and question in order, both answers under each", () => {
    const md = compileMarkdown(answers, new Date(at));
    assert.match(md, /^# Website questionnaire/);
    assert.match(md, /- Joelyn: 3 of 107 answered, last updated October 2, 2026/);
    assert.match(md, /- Jessica: 4 of 107 answered/);
    let last = -1;
    for (const s of SECTIONS) {
      const i = md.indexOf(`. ${s.title}\n`);
      assert.ok(i > last, s.id);
      last = i;
    }
    assert.ok(md.includes("> Whoever \"picks up\" first,\n> usually me"));
    assert.ok(md.includes("*The two answers differ.*"));
    assert.ok(md.includes("*No answer yet*"));
    assert.equal((md.match(/^### /gm) ?? []).length, 121);
    // A personal section shows only its owner.
    const joelynSection = md.slice(md.indexOf("## 1. "), md.indexOf("## 2. "));
    assert.ok(!joelynSection.includes("**Jessica**"));
  });

  it("answers differ only when both said something different", () => {
    assert.ok(answersDiffer(ans("joelyn", "x", "a"), ans("jessica", "x", "b")));
    assert.ok(!answersDiffer(ans("joelyn", "x", "Same  thing"), ans("jessica", "x", "same thing")));
    assert.ok(!answersDiffer(ans("joelyn", "x", "a"), undefined));
    assert.ok(answersDiffer(ans("joelyn", "x", "", "Yes"), ans("jessica", "x", "", "Drop it")));
  });

  it("progress counts only questions that person is asked", () => {
    const p = progressFor("jessica", indexAnswers([...answers, ans("jessica", "joelyn.grew-up", "stray")]));
    assert.equal(p.answered, 4);
    assert.equal(p.lastUpdated, at);
  });
});

describe("what a save may write", () => {
  const now = new Date(at);
  const e = (questionId: string, value = "x", choice: string | null = null, updatedAt = at) => ({ questionId, value, choice, updatedAt });

  it("only the respondent's own questions", () => {
    assert.ok(validEntries("joelyn", [e("joelyn.grew-up")], now));
    assert.equal(validEntries("joelyn", [e("jessica.grew-up")], now), null);
    assert.equal(validEntries("joelyn", [e("made.up")], now), null);
  });

  it("only options the question offers, and no text where it takes none", () => {
    assert.ok(validEntries("joelyn", [e("promise.buy-video", "", "Change it")], now));
    assert.equal(validEntries("joelyn", [e("promise.buy-video", "", "Maybe")], now), null);
    assert.equal(validEntries("joelyn", [e("team.lead", "x", "Yes")], now), null);
    assert.equal(validEntries("joelyn", [e("tools.mailbox", "text", "Not sure")], now), null);
    assert.ok(validEntries("joelyn", [e("tools.mailbox", "", "Not sure")], now));
  });

  it("the latest copy of a repeated question wins", () => {
    const out = validEntries("joelyn", [e("team.lead", "old", null, "2026-10-02T14:00:00Z"), e("team.lead", "new", null, "2026-10-02T14:30:00Z")], now)!;
    assert.equal(out.length, 1);
    assert.equal(out[0].value, "new");
  });

  it("caps the length and the batch", () => {
    assert.ok(!saveSchema.safeParse({ token: "t", entries: [e("team.lead", "x".repeat(10_001))] }).success);
    assert.ok(saveSchema.safeParse({ token: "t", entries: [e("team.lead", "x".repeat(10_000))] }).success);
    assert.ok(!saveSchema.safeParse({ token: "t", entries: [] }).success);
  });

  it("a typed-at time in the future or unreadable becomes now", () => {
    assert.equal(clampTime("2030-01-01T00:00:00Z", now).toISOString(), at);
    assert.equal(clampTime("not a date", now).toISOString(), at);
    assert.equal(clampTime("2026-10-02T14:00:00.000Z", now).toISOString(), "2026-10-02T14:00:00.000Z");
  });
});

describe("questionnaire wording", () => {
  it("never says lands", () => {
    for (const { text } of questionnaireStrings()) assert.doesNotMatch(text, /\blands?\b/i);
  });
});
