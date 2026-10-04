import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONFIRM_TTL_SECONDS, ISSUE_ACTION_TTL_SECONDS, signToken, verifyToken, type ConfirmPayload, type IssueActionPayload } from "./token";

const SECRET = "a".repeat(40);
const OTHER = "b".repeat(40);
const NOW = new Date("2026-10-04T12:00:00Z");
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);
const SUB = "3f1c3c1e-4a8b-4c55-9a0e-0d7c2b8f6a11";

describe("signed links", () => {
  it("verifies a confirm token and returns its payload", () => {
    const t = signToken({ p: "confirm", s: SUB }, SECRET, CONFIRM_TTL_SECONDS, NOW);
    const v = verifyToken<ConfirmPayload>(t, SECRET, "confirm", later(60));
    assert.equal(v.ok, true);
    if (v.ok) {
      assert.equal(v.data.s, SUB);
      assert.equal(v.data.exp, Math.floor(NOW.getTime() / 1000) + CONFIRM_TTL_SECONDS);
    }
  });

  it("expires: a confirm link works for a week and not a second longer", () => {
    const t = signToken({ p: "confirm", s: SUB }, SECRET, CONFIRM_TTL_SECONDS, NOW);
    assert.equal(verifyToken(t, SECRET, "confirm", later(CONFIRM_TTL_SECONDS - 1)).ok, true);
    const v = verifyToken(t, SECRET, "confirm", later(CONFIRM_TTL_SECONDS));
    assert.deepEqual(v, { ok: false, reason: "expired" });
  });

  it("gives the team's links three weeks", () => {
    const t = signToken({ p: "issue", a: "hold", k: "tide", per: "2026-07" }, SECRET, ISSUE_ACTION_TTL_SECONDS, NOW);
    const ok = verifyToken<IssueActionPayload>(t, SECRET, "issue", later(20 * 86_400));
    assert.ok(ok.ok && ok.data.a === "hold" && ok.data.k === "tide" && ok.data.per === "2026-07");
    assert.equal(verifyToken(t, SECRET, "issue", later(21 * 86_400)).ok, false);
  });

  it("rejects another secret, a changed payload and a changed signature", () => {
    const t = signToken({ p: "confirm", s: SUB }, SECRET, CONFIRM_TTL_SECONDS, NOW);
    assert.deepEqual(verifyToken(t, OTHER, "confirm", NOW), { ok: false, reason: "signature" });

    const [body, sig] = t.split(".") as [string, string];
    const forged = Buffer.from(JSON.stringify({ p: "confirm", s: "00000000-0000-4000-8000-000000000000", exp: 9_999_999_999 })).toString("base64url");
    assert.deepEqual(verifyToken(`${forged}.${sig}`, SECRET, "confirm", NOW), { ok: false, reason: "signature" });

    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    assert.deepEqual(verifyToken(`${body}.${flipped}`, SECRET, "confirm", NOW), { ok: false, reason: "signature" });
  });

  it("can't be used for another purpose", () => {
    const t = signToken({ p: "confirm", s: SUB }, SECRET, CONFIRM_TTL_SECONDS, NOW);
    assert.deepEqual(verifyToken(t, SECRET, "issue", NOW), { ok: false, reason: "purpose" });
  });

  it("calls anything else malformed, without throwing", () => {
    for (const bad of [null, undefined, "", "abc", "a.b.c", ".", "x".repeat(3000)]) {
      const v = verifyToken(bad, SECRET, "confirm", NOW);
      assert.equal(v.ok, false, String(bad).slice(0, 20));
    }
    assert.equal(verifyToken("a.b", "", "confirm", NOW).ok, false, "no secret, no verification");
  });

  it("won't sign without a secret", () => {
    assert.throws(() => signToken({ p: "confirm", s: SUB }, "", 60, NOW));
  });

  it("is URL-safe", () => {
    const t = signToken({ p: "issue", a: "send", k: "encore", per: "2026-10-05" }, SECRET, ISSUE_ACTION_TTL_SECONDS, NOW);
    assert.match(t, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });
});
