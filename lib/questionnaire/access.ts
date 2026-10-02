import { createHash, timingSafeEqual } from "node:crypto";
import type { Role } from "./model";

/**
 * The three private questionnaire links, /q/<token>. Only the SHA-256 of each
 * token lives here; the raw links are kept outside the repo by whoever sends
 * them. To rotate one, see docs/SITE.md ("The questionnaire").
 *
 * Every lookup hashes the token and compares it against every entry in
 * constant time, so neither a match nor its position leaks through timing.
 */

export type TokenTable = ReadonlyArray<{ role: Role; sha256: string }>;

export const TOKEN_HASHES: TokenTable = [
  { role: "joelyn", sha256: "93e570e40ec515a7494e5eeb43ecfbdfd74644eaa35d123f98632696d0f705a5" },
  { role: "jessica", sha256: "c33086fa8bd0970f11a4c7abfbb956418d24330621acedec2056ef69c9eccc31" },
  { role: "admin", sha256: "e4e276930d384bd15f101af062333245febce54e2253890e6b8287a24cc7b2bf" },
];

/** Tokens are 24 base64url characters; anything far off that isn't one of ours. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

/** The role a token opens, or null. Pure: the table is a parameter so tests can supply their own. */
export function roleForTokenIn(table: TokenTable, token: unknown): Role | null {
  if (typeof token !== "string" || !TOKEN_SHAPE.test(token)) return null;
  const given = hashToken(token);
  let found: Role | null = null;
  for (const entry of table) {
    const stored = Buffer.from(entry.sha256, "hex");
    // Compare against every entry, no early exit.
    if (stored.length === given.length && timingSafeEqual(stored, given) && !found) found = entry.role;
  }
  return found;
}

export function roleForToken(token: unknown): Role | null {
  return roleForTokenIn(TOKEN_HASHES, token);
}
