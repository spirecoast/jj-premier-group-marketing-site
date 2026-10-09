import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailList } from "./recipients";

describe("emailList", () => {
  it("reads one address or several, separated by commas or semicolons", () => {
    assert.deepEqual(emailList("jessica@example.com"), ["jessica@example.com"]);
    assert.deepEqual(emailList(" joelyn@example.com, jessica@example.com ;team@example.com "), ["joelyn@example.com", "jessica@example.com", "team@example.com"]);
  });
  it("drops blanks and repeats, whatever their case", () => {
    assert.deepEqual(emailList("a@example.com,, A@Example.com ,b@example.com,"), ["a@example.com", "b@example.com"]);
  });
  it("is empty when the setting is unset or blank", () => {
    assert.deepEqual(emailList(undefined), []);
    assert.deepEqual(emailList(null), []);
    assert.deepEqual(emailList(" , ; "), []);
  });
});
