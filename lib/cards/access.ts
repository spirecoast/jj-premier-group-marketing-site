import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The private cards link, /cards/<token>, for Joelyn and Jessica. Only the SHA-256 of the token
 * lives here; the raw link is kept outside the repo by whoever sends it. To rotate it, the same
 * steps as the questionnaire's (docs/SITE.md, "The questionnaire"), with this hash.
 *
 * CARDS_TOKEN_SHA256, when set, replaces the hash here, so the link can be rotated without a
 * code change.
 */
export const CARDS_TOKEN_SHA256 = "8c1777885b4334b0494f3f4f28e53d6a930c17593996df368382c03ec1739016";

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

/** True when the token opens the cards page. Constant time; pure, so the tests can pass their own hash. */
export function cardsTokenOk(token: unknown, sha256: string = process.env.CARDS_TOKEN_SHA256?.trim() || CARDS_TOKEN_SHA256): boolean {
  if (typeof token !== "string" || !TOKEN_SHAPE.test(token) || !/^[0-9a-f]{64}$/.test(sha256)) return false;
  const given = createHash("sha256").update(token, "utf8").digest();
  const stored = Buffer.from(sha256, "hex");
  return stored.length === given.length && timingSafeEqual(stored, given);
}
