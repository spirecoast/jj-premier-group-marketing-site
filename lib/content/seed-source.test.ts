import assert from "node:assert/strict";
import { test } from "node:test";
import { showSampleContent } from "./seed-source";

test("sample listings show only when asked for, and never on production", () => {
  assert.equal(showSampleContent({}), false);
  assert.equal(showSampleContent({ NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS: "true" }), true);
  assert.equal(showSampleContent({ NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS: "true", VERCEL_ENV: "preview" }), true);
  assert.equal(showSampleContent({ NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS: "true", VERCEL_ENV: "production" }), false);
  assert.equal(showSampleContent({ NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS: "yes", VERCEL_ENV: "preview" }), false);
});
