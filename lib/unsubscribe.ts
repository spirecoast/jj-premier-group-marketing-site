import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Marketing-email unsubscribe tokens.
 *
 * HMAC-SHA256 over the contact UUID with a server-only secret. Tokens have no
 * expiry — any sent email's unsubscribe link works indefinitely (best practice
 * for CAN-SPAM, since some users archive emails for years before unsubscribing).
 *
 * Two-step flow: GET /unsubscribe?id=&sig= renders a "Confirm" button; POST
 * (form action) actually sets unsubscribed_email=true. This is mandatory —
 * Microsoft Defender, Gmail safe-browsing, etc. pre-fetch all links and would
 * trigger one-click unsubscribes.
 */

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "UNSUBSCRIBE_SECRET must be set to at least 32 characters in production",
    );
  }
  // Dev fallback so local form testing works without a secret configured.
  return "dev-insecure-default-do-not-use-in-prod-32chars";
}

export function signUnsubscribe(contactId: string): string {
  return createHmac("sha256", getSecret()).update(contactId).digest("base64url");
}

export function verifyUnsubscribe(contactId: string, sig: string): boolean {
  try {
    const expected = signUnsubscribe(contactId);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unsubscribeUrl(contactId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sig = signUnsubscribe(contactId);
  return `${base}/unsubscribe?id=${contactId}&sig=${sig}`;
}
