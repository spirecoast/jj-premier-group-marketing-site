"use client";

import Link from "next/link";
import { useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ASK, PLAN } from "@/lib/relocate/copy";
import { usePlanner } from "./planner-context";

/**
 * The ask. The only place on the page that asks for an email. It appears
 * once there is a plan to send: the message arrives pre-filled with the
 * answers and the key dates, and the market travels as a hidden field only
 * when the county maps to one cleanly (Sarasota; Manatee is Bradenton or
 * Lakewood Ranch, so it stays blank). While the questions are still open,
 * one line points anyone who would rather talk at the contact page.
 */
export function Ask({ team }: { team: { slug: string; name: string; phone: string; phoneE164: string }[] }) {
  const { mode } = usePlanner();
  if (mode !== "plan") {
    return (
      <p id="contact" className="container-site scroll-mt-header flex flex-wrap items-baseline gap-x-2 border-t border-hairline py-8 t-body text-body print:hidden">
        {ASK.beforePlan}{" "}
        <Link href="/contact" className="link-rule">
          {ASK.beforePlanLink}
        </Link>
      </p>
    );
  }
  return <AskForm team={team} />;
}

function AskForm({ team }: { team: { slug: string; name: string; phone: string; phoneE164: string }[] }) {
  const { plan, shareUrl } = usePlanner();
  const market = plan.answers.county === "sarasota" ? "sarasota" : undefined;
  const message = `${plan.summary}\n${shareUrl}`;
  // The form keeps whatever has been typed across rebuilds; the message only
  // refreshes when asked, the way Encore Planner does it.
  const [sentMessage, setSentMessage] = useState(message);
  return (
    <section id="contact" className="scroll-mt-header bg-navy text-linen-200 print:hidden">
      <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <SectionHeading title={ASK.title} tone="dark" />
          <p className="t-body max-w-[440px] text-linen-200">{ASK.body}</p>
          {sentMessage !== message ? (
            <button type="button" onClick={() => setSentMessage(message)} className="link-rule self-start text-mist">
              {PLAN.useDates}
            </button>
          ) : null}
          <ul className="flex flex-col gap-3 border-t border-linen-200/40 pt-6">
            {team.map((m) => (
              <li key={m.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="t-h4 text-white">{m.name}</span>
                <a href={`tel:${m.phoneE164}`} className="t-record text-linen-200 transition-colors hover:text-white">
                  {m.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-linen-200/50 p-6 sm:p-8">
          <LeadForm
            key={sentMessage}
            form="buy"
            tone="dark"
            fields={["timing", "sellFirst", "name", "email", "phone", "message"]}
            submitLabel={ASK.submit}
            placeholderMessage={ASK.placeholder}
            defaultMessage={sentMessage}
            hidden={{ market }}
          />
        </div>
      </div>
    </section>
  );
}
