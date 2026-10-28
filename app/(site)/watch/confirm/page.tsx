import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RuleLink } from "@/components/buttons";
import { fill } from "@/lib/issues/copy";
import { WATCH_CONFIRM_PAGE_COPY as COPY } from "@/lib/watch/copy";
import { viewWatchConfirm } from "@/lib/watch/service";
import { WatchConfirmForm } from "./confirm-form";

/**
 * /watch/confirm?t=<token>: the link in a Street Watch confirmation email
 * (docs/ISSUES.md, "Street Watch"). The token is signed with
 * NEWSLETTER_SECRET and good for a week. The page shows one button; pressing
 * it records the opt-in. Opening the link alone does nothing, so a mail
 * scanner that opens every link can't confirm anyone.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your Street Watch",
  robots: { index: false, follow: false },
};

export default async function WatchConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.t === "string" ? params.t : "";
  const view = await viewWatchConfirm(token);

  let body: ReactNode;
  if (view.state === "ready") {
    body = <WatchConfirmForm token={token} label={view.label} path={view.path} />;
  } else if (view.state === "already" || view.state === "unsubscribed") {
    const already = view.state === "already";
    body = (
      <div className="flex flex-col gap-4">
        <h2 className="t-h2 text-navy">{fill(already ? COPY.alreadyTitle : COPY.unsubscribedTitle, { label: view.label })}</h2>
        <p className="t-body max-w-[520px] text-body">{already ? COPY.alreadyBody : COPY.unsubscribedBody}</p>
        {already ? (
          <a href={view.path} className="link-rule self-start">
            {COPY.doneLink}
          </a>
        ) : null}
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
    <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="watch-confirm-title">
      <h1 id="watch-confirm-title" className="t-display max-w-[640px] text-navy">
        {COPY.title}
      </h1>
      {body}
      <div className="border-t border-hairline pt-6">
        <RuleLink href="/">{COPY.home}</RuleLink>
      </div>
    </section>
  );
}
