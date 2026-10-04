import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring links: the subscriber's confirm link and the team's
 * "Send it now" and "Hold this issue" links.
 *
 *   <base64url(JSON payload)>.<base64url(HMAC-SHA256)>
 *
 * The payload carries its purpose (`p`) and an expiry (`exp`, Unix seconds).
 * The HMAC is over a versioned prefix and the encoded payload, keyed with
 * NEWSLETTER_SECRET, so a token minted for one purpose can't be used for
 * another and nothing here can be forged without the secret. Pure: the
 * secret and the clock come in.
 */

export type TokenPurpose = "confirm" | "issue";

export type ConfirmPayload = { p: "confirm"; s: string; exp: number };
export type IssueActionPayload = { p: "issue"; a: "send" | "hold"; k: "tide" | "encore"; per: string; exp: number };
type Payload = ConfirmPayload | IssueActionPayload;

export type VerifyResult<T> = { ok: true; data: T } | { ok: false; reason: "malformed" | "signature" | "expired" | "purpose" };

const PREFIX = "jjpg.newsletter.v1.";

/** Confirm links: a week. */
export const CONFIRM_TTL_SECONDS = 7 * 24 * 3600;
/** The team's links: long enough to hold or release an issue any time in its window. */
export const ISSUE_ACTION_TTL_SECONDS = 21 * 24 * 3600;

function mac(body: string, secret: string): string {
  return createHmac("sha256", secret).update(PREFIX + body).digest("base64url");
}

export function signToken(payload: Omit<ConfirmPayload, "exp"> | Omit<IssueActionPayload, "exp">, secret: string, ttlSeconds: number, now: Date = new Date()): string {
  if (!secret) throw new Error("signToken: no secret");
  const exp = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp }), "utf8").toString("base64url");
  return `${body}.${mac(body, secret)}`;
}

export function verifyToken<T extends Payload>(token: string | null | undefined, secret: string, purpose: T["p"], now: Date = new Date()): VerifyResult<T> {
  if (!token || !secret || token.length > 2000) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [body, sig] = parts as [string, string];
  const expected = Buffer.from(mac(body, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "signature" };
  let data: Payload;
  try {
    data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!data || typeof data !== "object" || typeof data.exp !== "number") return { ok: false, reason: "malformed" };
  if (data.p !== purpose) return { ok: false, reason: "purpose" };
  if (Math.floor(now.getTime() / 1000) >= data.exp) return { ok: false, reason: "expired" };
  return { ok: true, data: data as T };
}
