import { createHash, timingSafeEqual } from "node:crypto";

/**
 * True when an `Authorization: Bearer <token>` header carries one of the given
 * secrets. Unset or empty secrets never match. The comparison hashes both sides
 * first, so it takes the same time whatever the token and leaks no length.
 */
export function bearerMatches(header: string | null | undefined, secrets: ReadonlyArray<string | undefined>): boolean {
  const m = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? "");
  if (!m) return false;
  const given = createHash("sha256").update(m[1]!).digest();
  let ok = false;
  for (const secret of secrets) {
    if (!secret) continue;
    const want = createHash("sha256").update(secret).digest();
    // No early exit: every configured secret is compared.
    if (timingSafeEqual(want, given)) ok = true;
  }
  return ok;
}
