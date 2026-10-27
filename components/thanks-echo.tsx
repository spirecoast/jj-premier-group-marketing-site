"use client";

import { useEffect, useState } from "react";
import { ShareButton } from "@/components/share-button";
import { ExternalLink } from "@/components/ui/external-link";
import { track } from "@/lib/analytics";
import { echoLine, readLastLead, type LastLead } from "@/lib/last-lead";
import type { LeadForm } from "@/lib/leads/constants";

/** The visitor's own lead, read once on the page from sessionStorage (lib/last-lead.ts). */
function useLastLead(form: LeadForm): LastLead | null {
  const [lead, setLead] = useState<LastLead | null>(null);
  useEffect(() => setLead(readLastLead(form)), [form]);
  return lead;
}

/**
 * Under the thank-you heading: what they sent, said back in a line ("For
 * 9403 9th Ave NW, moving inside three months."), and on a tool's thank-you
 * the plan they sent, ready to share. Plain text, only what the visitor
 * typed or chose; nothing when there's nothing to say.
 */
export function ThanksEcho({ form }: { form: LeadForm }) {
  const lead = useLastLead(form);
  if (!lead) return null;
  const line = echoLine(lead);
  if (!line && !lead.link) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
      {line ? <p className="t-body text-navy">{line}</p> : null}
      {lead.link ? <ShareButton title="My plan" url={lead.link} label="Share your plan" what="thanks-plan" /> : null}
    </div>
  );
}

/**
 * "Book 15 minutes", when NEXT_PUBLIC_BOOKING_URL is set: the booking page
 * with the visitor's name and email filled in (Cal.com and Calendly both read
 * `name` and `email`), never the message. Fires Explore with action "book".
 */
export function ThanksBooking({ form, url, primary }: { form: LeadForm; url: string; primary: boolean }) {
  const lead = useLastLead(form);
  let href = url;
  try {
    const u = new URL(url);
    const name = [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim();
    if (name) u.searchParams.set("name", name);
    if (lead?.email) u.searchParams.set("email", lead.email);
    href = u.toString();
  } catch {
    // Not a URL: link to it as it is.
  }
  return (
    <ExternalLink
      href={href}
      onClick={() => track("Explore", { action: "book", form })}
      className={primary ? "btn btn-navy self-start" : "link-rule self-start"}
    >
      Book 15 minutes ↗
    </ExternalLink>
  );
}
