import type { NewsletterList } from "./lists";

/**
 * The unsubscribe links and headers in every email to a subscriber. Pure:
 * the site's origin and the signature (lib/unsubscribe.ts, HMAC with
 * UNSUBSCRIBE_SECRET over "sub:<subscription id>") come in.
 *
 * - The footer links open /unsubscribe, the existing two-step page (a GET
 *   shows a button, the POST does it, so a link scanner that opens every
 *   link unsubscribes nobody). `list=tide|encore` offers that list first;
 *   `list=all` offers everything.
 * - `List-Unsubscribe` points at /api/newsletter/unsubscribe, and
 *   `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058) tells a
 *   mail app it may POST there to unsubscribe from that list with one click,
 *   no page in between. A mailto is added when there's a reply-to address;
 *   a "stop" there is handled by a person (docs/ISSUES.md).
 */

export type UnsubscribeLinks = { list: string; all: string; oneClick: string };

/** The value the subscription id is signed as, so a subscription link and a contact link can't stand in for each other. */
export const subscriptionSigningId = (subscriptionId: string) => `sub:${subscriptionId}`;

export function unsubscribeLinks(siteUrl: string, subscriptionId: string, sig: string, list: NewsletterList): UnsubscribeLinks {
  const base = siteUrl.replace(/\/$/, "");
  const q = (l: string) => `s=${encodeURIComponent(subscriptionId)}&sig=${encodeURIComponent(sig)}&list=${l}`;
  return {
    list: `${base}/unsubscribe?${q(list)}`,
    all: `${base}/unsubscribe?${q("all")}`,
    oneClick: `${base}/api/newsletter/unsubscribe?${q(list)}`,
  };
}

export function listUnsubscribeHeaders(oneClickUrl: string, mailto?: string | null): Record<string, string> {
  const parts = [`<${oneClickUrl}>`];
  if (mailto) parts.push(`<mailto:${mailto}?subject=unsubscribe>`);
  return {
    "List-Unsubscribe": parts.join(", "),
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** The mailbox part of "Name <a@b.c>", or the string itself when it's a bare address. */
export function bareAddress(from: string): string {
  const m = /<([^>]+)>/.exec(from);
  return (m ? m[1]! : from).trim();
}

/** The RFC 8058 body a mail app POSTs. Anything else is still honored, but this is what the spec sends. */
export const ONE_CLICK_BODY = "List-Unsubscribe=One-Click";
