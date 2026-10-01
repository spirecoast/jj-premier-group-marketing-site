import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { GUIDES, REBUILT_GUIDE_SLUGS, guideFigures, guideReadingMinutes, guideSources, guideStrings, guideWordCount } from "./index";

/** The house rules every guide string has to pass, on top of the brokerage list. */
const HOUSE_RULES: { pattern: RegExp; reason: string }[] = [
  { pattern: /!/, reason: "an exclamation mark" },
  { pattern: /\blands\b/i, reason: "“lands” as a verb" },
  { pattern: /\b(best|finest|greatest|amazing|stunning|incredible|perfect|unbeatable|ultimate|world-class|spectacular|breathtaking)\b/i, reason: "a superlative" },
  { pattern: /\bschools?\b/i, reason: "a school reference" },
  { pattern: /\b(safe|safety|unsafe|crime)\b/i, reason: "a safety or crime reference" },
  { pattern: /\bfamil(y|ies)\b|\b(kids?|children)\b/i, reason: "a familial-status reference" },
  { pattern: /\b(retire(e|es|d|ment)?|seniors?|55\s?\+|active adult|age[- ]restricted)\b/i, reason: "an age reference" },
  { pattern: /\b(SL|BK)\s?\d{5,}\b/i, reason: "a license number" },
  { pattern: /\$\s?\d/, reason: "a dollar figure (no premium figures in a guide)" },
];

describe("rebuilt guides", () => {
  test("every rebuilt slug has a guide and every guide is listed as rebuilt", () => {
    assert.deepEqual(
      GUIDES.map((g) => g.slug).sort(),
      [...REBUILT_GUIDE_SLUGS].sort(),
    );
  });

  for (const g of GUIDES) {
    describe(g.slug, () => {
      test("every section has a title, a lead and at least one source", () => {
        for (const s of g.sections) {
          assert.ok(s.title.trim().length > 0, `${s.id}: title`);
          assert.ok(s.lead.trim().length >= 40, `${s.id}: lead reads as a sentence`);
          assert.ok(s.sources.length > 0, `${s.id}: sources`);
        }
      });

      test("every figure has an eyebrow, a title, a reading line and a source line", () => {
        const figures = g.sections.flatMap((s) => s.blocks).filter((b) => b.kind === "figure");
        assert.ok(figures.length >= 5 && figures.length <= 7, `5 to 7 figures (${figures.length})`);
        for (const f of figures) {
          assert.ok(f.eyebrow && f.title && f.reading, `${f.title}: caption`);
          assert.ok(f.source.label.trim().length > 0, `${f.title}: source label`);
          assert.ok(f.source.href || f.source.note, `${f.title}: source href or note`);
        }
        assert.equal(guideFigures(g).length, figures.length);
      });

      test("every table carries a source and every paragraph with a source links to it", () => {
        for (const b of g.sections.flatMap((s) => s.blocks)) {
          if (b.kind === "table") assert.ok(b.source.href, `${b.title}: source href`);
          if (b.kind === "paragraph" && b.source) assert.ok(b.source.href || b.source.note, "paragraph source");
        }
      });

      test("section ids are unique anchors and three questions are set", () => {
        const ids = g.sections.map((s) => s.id);
        assert.equal(new Set(ids).size, ids.length);
        assert.equal(g.questions.length, 3);
        assert.ok(g.howToUse.length >= 2);
        assert.ok(g.onOnePage.rows.length >= 6);
      });

      test("the hypothetical figures say so", () => {
        for (const b of g.sections.flatMap((s) => s.blocks)) {
          if (b.kind !== "figure") continue;
          if (b.figure.type === "worked-example") assert.match(`${b.note ?? ""} ${b.source.label}`, /illustrative|hypothetical/i);
        }
      });

      test("length and reading time are in the range the template asks for", () => {
        const words = guideWordCount(g);
        assert.ok(words >= 3500 && words <= 6500, `3,500 to 6,500 words (${words})`);
        assert.ok(guideReadingMinutes(g) >= 12);
        assert.ok(guideSources(g).length >= 10);
      });

      test("every string passes Fair Housing and the house rules", () => {
        const flagged: string[] = [];
        for (const { where, text } of guideStrings(g)) {
          const fh = checkFairHousing(text);
          if (!fh.passed) flagged.push(`${where}: ${fh.flags.map((f) => f.reason).join(", ")}`);
          for (const r of HOUSE_RULES) if (r.pattern.test(text)) flagged.push(`${where}: ${r.reason}`);
        }
        assert.deepEqual(flagged, []);
      });
    });
  }
});
