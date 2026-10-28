import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { cardsTokenOk } from "./access";
import { cardStrings } from "./copy";

describe("the cards link", () => {
  const token = "abcdefghijklmnopqrstuvwx";
  const hash = createHash("sha256").update(token).digest("hex");
  test("opens with its token and nothing else", () => {
    assert.equal(cardsTokenOk(token, hash), true);
    assert.equal(cardsTokenOk(`${token}x`, hash), false);
    assert.equal(cardsTokenOk("short", hash), false);
    assert.equal(cardsTokenOk(undefined, hash), false);
    assert.equal(cardsTokenOk("../../etc/passwd/xxxxxxxx", hash), false);
    assert.equal(cardsTokenOk(token, "not-a-hash"), false);
  });
});

describe("the cards' words", () => {
  test("every caption passes the Fair Housing list", () => {
    for (const s of cardStrings()) assert.ok(checkFairHousing(s.text).passed, s.where);
  });
});
