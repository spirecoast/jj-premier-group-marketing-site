"use client";

import { useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ASK, PLAN } from "@/lib/relocate/copy";
import { usePlanner } from "./planner-context";

/**
 * 08 · The ask. The only place on the page that asks for an email. The
 * message arrives pre-filled with the answers and the key dates, and the
 * market travels as a hidden field only when the county maps to one cleanly
 * (Sarasota; Manatee is Bradenton or Lakewood Ranch, so it stays blank).
 */
export function Ask({ team }: { team: { slug: string; name: string; phone: string; phoneE164: string }[] }) {
  const { plan, mode, shareUrl } = usePlanner();
  const market = plan.answers.county === "sarasota" ? "sarasota" : undefined;
  const message = mode === "plan" ? `${plan.summary}\n${shareUrl}` : "";
  // The form keeps whatever has been typed across rebuilds; the message only
  // refreshes when asked, the way the Encore visit plan does it.
  const [sentMessage, setSentMessage] = useState(message);
  return (
    <section id="contact" className="container-site grid scroll-mt-header gap-10 border-t border-hairline py-section print:hidden lg:grid-cols-[1fr_1.4fr] lg:gap-20">
      <div className="flex flex-col gap-6">
        <SectionHeading eyebrow={ASK.eyebrow} title={ASK.title} />
        <p className="t-body max-w-[440px] text-body">{ASK.body}</p>
        {message && sentMessage !== message ? (
          <button type="button" onClick={() => setSentMessage(message)} className="link-rule self-start">
            {PLAN.useDates}
          </button>
        ) : null}
        <ul className="flex flex-col gap-3 border-t border-hairline pt-6">
          {team.map((m) => (
            <li key={m.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="t-h4 text-navy">{m.name}</span>
              <a href={`tel:${m.phoneE164}`} className="t-record text-navy transition-colors hover:text-harbor-700">
                {m.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border border-hairline bg-white p-6 sm:p-8">
        <LeadForm key={sentMessage} form="buy" fields={["name", "email", "phone", "message"]} submitLabel={ASK.submit} placeholderMessage={ASK.placeholder} defaultMessage={sentMessage || undefined} hidden={{ market }} />
      </div>
    </section>
  );
}
