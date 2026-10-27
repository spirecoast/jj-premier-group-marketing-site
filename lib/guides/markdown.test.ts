import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GUIDES } from "./index";
import { guideMarkdown } from "./markdown";

describe("a guide as Markdown, for /llms-full.txt", () => {
  const url = (p: string) => `https://example.com${p}`;
  test("every guide renders with its title, address, sections and sources, and nothing undefined", () => {
    for (const g of GUIDES) {
      const md = guideMarkdown(g, url);
      assert.ok(md.startsWith(`## ${g.title}`), g.slug);
      assert.ok(md.includes(`https://example.com/guides/${g.slug}`), g.slug);
      for (const s of g.sections) assert.ok(md.includes(`### ${s.title}`), `${g.slug}: ${s.title}`);
      assert.ok(md.includes("Sources:"), g.slug);
      assert.doesNotMatch(md, /undefined|\[object Object\]/, g.slug);
      assert.doesNotMatch(md, /\]\(\//, `${g.slug}: a site link left relative`);
    }
  });
});
