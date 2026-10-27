/**
 * What the visitor just sent, carried from the form to /thanks/[form] in
 * sessionStorage (this tab only, gone when it closes), so the thank-you page
 * can say it back to them and prefill the booking page. Never in the URL:
 * an address or an email in a query string ends up in logs and analytics.
 * Read once, within half an hour, for the form that wrote it.
 */

import type { LeadForm } from "./leads/constants";

export const LAST_LEAD_KEY = "jj-last-lead";
const TTL_MS = 30 * 60 * 1000;

export type LastLead = {
  form: LeadForm;
  at: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  timing?: string;
  sellFirst?: string;
  /** The plan, match or list link a tool put in the message. */
  link?: string;
  /** The person referred, by first name. */
  referred?: string;
};

export function writeLastLead(lead: Omit<LastLead, "at">): void {
  try {
    window.sessionStorage.setItem(LAST_LEAD_KEY, JSON.stringify({ ...lead, at: Date.now() }));
  } catch {
    // Storage blocked: the thank-you page just doesn't echo.
  }
}

export function readLastLead(form: LeadForm, now: number = Date.now()): LastLead | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_LEAD_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as LastLead;
    if (!v || v.form !== form || typeof v.at !== "number" || now - v.at > TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

/** The first link to this site in a message (a tool's plan or match link), if any. */
export function linkIn(message: string | undefined, origin: string): string | undefined {
  if (!message) return undefined;
  for (const m of message.matchAll(/https?:\/\/\S+/g)) {
    try {
      const u = new URL(m[0]);
      if (u.origin === origin) return u.toString();
    } catch {
      // not a URL
    }
  }
  return undefined;
}

/**
 * The line the thank-you page shows: "For 9403 9th Ave NW, moving inside
 * three months." Plain text, made only of what the visitor typed or chose.
 */
export function echoLine(lead: LastLead): string | null {
  const parts: string[] = [];
  if (lead.referred) parts.push(`For ${lead.referred}`);
  else if (lead.address) parts.push(`For ${lead.address}`);
  if (lead.timing) parts.push(lead.timing === "Just watching the market" ? "just watching the market" : `moving ${lead.timing.charAt(0).toLowerCase()}${lead.timing.slice(1)}`);
  if (lead.sellFirst === "Yes") parts.push("with a house to sell first");
  if (!parts.length) return null;
  const line = parts.join(", ");
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
}
