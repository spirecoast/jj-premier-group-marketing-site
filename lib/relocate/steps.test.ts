import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHANNELS } from "../channels/copy";
import { QUESTIONS } from "./copy";
import { MOVE_STEPS } from "./url";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = WORDS[MOVE_STEPS]!;

/**
 * Atlas Move asks MOVE_STEPS questions (components/relocate/questions.tsx).
 * Every sentence that says how many must agree with it: lib/channels/copy.ts
 * can't import the number (scripts/check-copy.mjs loads it without the app),
 * so this test holds the two together.
 */
describe("Atlas Move says the same number of questions everywhere", () => {
  it("the planner's own title", () => {
    assert.equal(QUESTIONS.title.toLowerCase(), `${word} questions`);
  });

  it("the channel pages", () => {
    const others = WORDS.filter((w) => w !== word && w !== "one");
    for (const c of Object.values(CHANNELS)) {
      for (const text of [c.description, c.line, c.cta.note]) {
        if (!/questions/i.test(text)) continue;
        assert.match(text, new RegExp(`\\b${word} questions\\b`, "i"), `${c.slug}: "${text}"`);
        for (const w of others) assert.doesNotMatch(text, new RegExp(`\\b${w} questions\\b`, "i"), `${c.slug}: "${text}"`);
      }
    }
  });
});
