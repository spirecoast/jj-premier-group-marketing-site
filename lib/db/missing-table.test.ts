import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMissingTable, warnMissingTable } from "./missing-table";

describe("isMissingTable", () => {
  it("recognises Postgres undefined_table, directly or wrapped", () => {
    assert.equal(isMissingTable(Object.assign(new Error('relation "places_usage" does not exist'), { code: "42P01" })), true);
    const wrapped = new Error("Failed query: select …", { cause: Object.assign(new Error("relation does not exist"), { code: "42P01" }) });
    assert.equal(isMissingTable(wrapped), true);
  });
  it("ignores every other failure", () => {
    assert.equal(isMissingTable(Object.assign(new Error("permission denied"), { code: "42501" })), false);
    assert.equal(isMissingTable(new Error("connect ETIMEDOUT")), false);
    assert.equal(isMissingTable(null), false);
    assert.equal(isMissingTable("42P01"), false);
  });
});

describe("warnMissingTable", () => {
  it("logs once per table", () => {
    const lines: string[] = [];
    const log = (l: string) => lines.push(l);
    assert.equal(warnMissingTable("t_once", "0099_x.sql", log), true);
    assert.equal(warnMissingTable("t_once", "0099_x.sql", log), false);
    assert.equal(warnMissingTable("t_other", "0098_y.sql", log), true);
    assert.equal(lines.length, 2);
    assert.match(lines[0]!, /t_once.*0099_x\.sql/);
  });
});
