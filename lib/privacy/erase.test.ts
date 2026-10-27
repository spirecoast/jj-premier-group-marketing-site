import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eraseReceipt, normalizeEmail, normalizePhone, parseEraseArgs, sha256 } from "./erase";

describe("normalizing the request", () => {
  it("lowercases an email and refuses anything that isn't one", () => {
    assert.equal(normalizeEmail("  Jane.Doe@Example.COM "), "jane.doe@example.com");
    assert.equal(normalizeEmail("jane"), null);
    assert.equal(normalizeEmail(undefined), null);
  });
  it("keeps the last ten digits of a phone number, however it was typed", () => {
    assert.equal(normalizePhone("(941) 555-0100"), "9415550100");
    assert.equal(normalizePhone("+1 941.555.0100"), "9415550100");
    assert.equal(normalizePhone("555-0100"), null);
  });
  it("hashes the normalized value", () => {
    assert.equal(sha256("jane@example.com"), sha256("jane@example.com"));
    assert.match(sha256("jane@example.com"), /^[0-9a-f]{64}$/);
  });
});

describe("parseEraseArgs", () => {
  it("reads --email and --phone, either form", () => {
    assert.deepEqual(parseEraseArgs(["--email", "Jane@Example.com", "--phone=941-555-0100"]), { email: "jane@example.com", phone: "9415550100", confirm: false });
    assert.equal(parseEraseArgs(["--email=jane@example.com", "--confirm"]).confirm, true);
  });
  it("is a dry run unless --confirm is given", () => {
    assert.equal(parseEraseArgs(["--email", "jane@example.com"]).confirm, false);
  });
  it("says what's wrong with bad input", () => {
    assert.throws(() => parseEraseArgs([]), /Give --email, --phone or both/);
    assert.throws(() => parseEraseArgs(["--email", "jane"]), /isn't an email address/);
    assert.throws(() => parseEraseArgs(["--phone", "12345"]), /ten digits/);
  });
});

describe("eraseReceipt", () => {
  const counts = { leads: 2, referrals: 1, contacts: 1, events: 0, subscriptions: 1, deliveries: 3 };
  it("lists what was removed and what is held elsewhere", () => {
    const r = eraseReceipt({ email: "jane@example.com", phone: "9415550100", confirm: true }, counts, new Date("2026-10-27T12:00:00Z"));
    assert.match(r, /^Erased from the site database on 2026-10-27T12:00:00.000Z: jane@example.com and phone ending 0100\./);
    assert.match(r, /\s2 {2}form submissions/);
    assert.match(r, /\s3 {2}newsletter email records/);
    assert.match(r, /SHA-256/);
    assert.match(r, /Home Platform/);
    assert.match(r, /Zapier/);
  });
  it("says a dry run changed nothing", () => {
    const r = eraseReceipt({ email: "jane@example.com", phone: null, confirm: false }, counts, new Date("2026-10-27T12:00:00Z"));
    assert.match(r, /^Dry run .* Nothing was changed; add --confirm to erase\./);
    assert.doesNotMatch(r, /SHA-256/);
  });
});
