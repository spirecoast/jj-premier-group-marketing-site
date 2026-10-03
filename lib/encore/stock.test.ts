import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import type { EventCategory } from "@/lib/content/types";
import manifest from "@/lib/content/encore/stock-photos.json";
import { stockPhoto } from "./stock";

const CATEGORIES: EventCategory[] = ["music", "theater", "gallery", "festival", "family", "market", "film", "talks"];
const SUBCATEGORIES = ["exhibition", "art-walk", "concert", "band", "chamber", "orchestra", "choral", "jazz", "opera", "play", "musical", "broadway", "cabaret", "comedy", "improv", "ballet", "dance", "circus", "gala", "festival", "market", "film", "talk", "family", "other"];

test("every stock photo file exists and has alt text", () => {
  for (const e of manifest) {
    assert.ok(existsSync(path.join(process.cwd(), "public/images/encore-stock", e.file)), e.file);
    assert.ok(e.alt.length > 10, e.file);
  }
});

test("every category and subcategory gets a stock photo", () => {
  for (const category of CATEGORIES) {
    assert.ok(stockPhoto({ category, seed: "x" }), category);
    for (const subcategory of SUBCATEGORIES) assert.ok(stockPhoto({ category, subcategory, seed: "x" }), `${category}/${subcategory}`);
  }
});

test("the subcategory decides the theme, and the slug varies the pick", () => {
  const picks = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((seed) => stockPhoto({ category: "music", subcategory: "chamber", seed })!.src));
  assert.ok([...picks].every((s) => s.includes("/chamber-")));
  assert.ok(picks.size > 1);
});
