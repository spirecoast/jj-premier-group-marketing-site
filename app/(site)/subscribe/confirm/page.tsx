import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RuleLink } from "@/components/buttons";
import { fill } from "@/lib/issues/copy";
import { latestTidePath } from "@/lib/issues/load";
import { CONFIRM_PAGE_COPY as COPY, WELCOME_COPY } from "@/lib/newsletter/copy";
import { LIST_NAME } from "@/lib/newsletter/lists";
import { viewConfirm } from "@/lib/newsletter/service";
import { ConfirmForm } from "./confirm-form";

/**
 * /subscribe/confirm?t=<token> — the link in the confirmation email
 * (docs/ISSUES.md). The token is signed with NEWSLETTER_SECRET and good for
 * a week. The page shows one button; pressing it records the opt-in and sends
 * the welcome. Opening the link alone does nothing, so a mail scanner that
 * opens every link can't subscribe anyone.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your subscription",
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.t === "string" ? params.t : "";
  const view = await viewConfirm(token);

  let body: ReactNode;
  if (view.state === "ready") {
    const list = view.list;
    body = (
      <ConfirmForm
        token={token}
        list={list}
        nextHref={list === "tide" ? latestTidePath() : "/calendar"}
        nextLabel={WELCOME_COPY[list].button}
      />
    );
  } else if (view.state === "already" || view.state === "unsubscribed") {
    const product = LIST_NAME[view.list];
    const already = view.state === "already";
    body = (
      <div className="flex flex-col gap-4">
        <h2 className="t-h2 text-navy">{already ? COPY.alreadyTitle : COPY.unsubscribedTitle}</h2>
        <p className="t-body max-w-[520px] text-body">{fill(already ? COPY.alreadyBody : COPY.unsubscribedBody, { product })}</p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        <h2 className="t-h2 text-navy">{COPY.invalidTitle}</h2>
        <p className="t-body max-w-[520px] text-body">{COPY.invalidBody}</p>
      </div>
    );
  }

  return (
    <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="confirm-title">
      <div className="flex flex-col gap-3.5">
        <p className="t-eyebrow text-amber">{COPY.eyebrow}</p>
        <h1 id="confirm-title" className="t-display max-w-[640px] text-navy">
          {COPY.title}
        </h1>
      </div>
      {body}
      <div className="border-t border-hairline pt-6">
        <RuleLink href="/">{COPY.home}</RuleLink>
      </div>
    </section>
  );
}
