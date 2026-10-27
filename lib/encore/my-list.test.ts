import assert from "node:assert/strict";
import { test } from "node:test";
import { addSlugs, parseList, toggleSlug } from "./my-list";

test("parseList keeps slug strings once each and drops everything else", () => {
  assert.deepEqual(parseList(null), []);
  assert.deepEqual(parseList(""), []);
  assert.deepEqual(parseList("not json"), []);
  assert.deepEqual(parseList('{"a":1}'), []);
  assert.deepEqual(parseList('["la-boheme", 3, null, "la-boheme", "Bad Slug", "the-nutcracker"]'), ["la-boheme", "the-nutcracker"]);
});

test("toggleSlug adds a new slug at the end and removes a saved one", () => {
  assert.deepEqual(toggleSlug([], "a"), ["a"]);
  assert.deepEqual(toggleSlug(["a", "b"], "c"), ["a", "b", "c"]);
  assert.deepEqual(toggleSlug(["a", "b", "c"], "b"), ["a", "c"]);
});

test("two toggles in a row both count (no stale copy)", () => {
  let list: string[] = [];
  list = toggleSlug(list, "a");
  list = toggleSlug(list, "b");
  assert.deepEqual(list, ["a", "b"]);
});

test("addSlugs merges a shared list without duplicates", () => {
  assert.deepEqual(addSlugs(["a", "b"], ["b", "c", "c"]), ["a", "b", "c"]);
});
