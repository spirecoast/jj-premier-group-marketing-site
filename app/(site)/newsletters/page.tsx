import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RuleLink } from "@/components/buttons";
import { ProductLockup } from "@/components/brand/emblem";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { EncoreLetterTile } from "@/components/newsletters/encore-cover";
import { TideIssueCard } from "@/components/tide/issue-card";
import { MAX_PICKS } from "@/lib/issues/encore-weekly";
import { fill } from "@/lib/issues/copy";
import { addDays, dayLong, monthLabel } from "@/lib/issues/render";
import { addMonths } from "@/lib/issues/tide-monthly";
import { NEWSLETTERS_COPY as C } from "@/lib/newsletters/copy";
import { encoreLetterWeeks, loadEncoreLetter } from "@/lib/newsletters/encore";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { loadIssueCards } from "@/lib/tide/load";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: C.metaTitle,
  description: C.description,
  path: "/newsletters",
  fileImage: true, // opengraph-image.tsx beside this page
});

/** Hourly, like the calendar: the week's Encore issue turns over on Monday morning. */
export const revalidate = 3600;

/**
 * /newsletters: the site's two emails on one page, in the family of /guides.
 * Each letter says what it is and how often it comes, has its sign-up, and
 * lays out its issues as covers, newest first: Tide's issues with their own
 * covers (lib/tide), Encore's Monday issues with a cover drawn from the week
 * (lib/newsletters). Encore lists the weeks the database has as sent, or this
 * week's alone when nothing is on record.
 */
export default async function NewslettersPage() {
  const [tide, { current, listed }] = await Promise.all([loadIssueCards(), encoreLetterWeeks()]);
  const encore = (await Promise.all(listed.map((m) => loadEncoreLetter(m)))).map((l) => l.card);
  const latestTide = tide[0];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: C.metaTitle, path: "/newsletters" },
        ])}
      />
      <section className="container-site flex flex-col gap-5 pt-section" aria-labelledby="newsletters-title">
        <h1 id="newsletters-title" className="t-display max-w-[820px] text-balance text-navy">
          {C.heading}
        </h1>
        <p className="t-lead max-w-[600px] text-body">{C.lead}</p>
      </section>

      <Letter
        id="tide"
        first
        lockup={<ProductLockup family="tide" tone="light" size="md" decorative />}
        name="Tide"
        often={C.tideOften}
        what={C.tideWhat}
        link={latestTide ? { href: latestTide.href, label: C.tideLink } : { href: "/tide", label: C.tideLink }}
        next={latestTide?.issue ? fill(C.tideNext, { month: monthLabel(addMonths(latestTide.issue, 1)) }) : undefined}
        ask={{ heading: C.tideAskHeading, body: C.tideAskBody, form: <LetterForm /> }}
      >
        {tide.map((c, i) => (
          <li key={c.issue} className="flex">
            <TideIssueCard card={c} priority={i === 0} />
          </li>
        ))}
      </Letter>

      <Letter
        id="encore"
        className="bg-parchment"
        lockup={<ProductLockup family="encore" tone="light" size="md" decorative />}
        name="Encore"
        often={C.encoreOften}
        what={fill(C.encoreWhat, { max: MAX_PICKS })}
        link={{ href: "/calendar", label: C.encoreLink }}
        next={fill(C.encoreNext, { day: dayLong(addDays(current, 7)) })}
        ask={{ heading: C.encoreAskHeading, body: C.encoreAskBody, form: <LetterForm form="calendar" label={`Send me ${site.calendarShort}`} /> }}
      >
        {encore.map((c) => (
          <li key={c.monday} className="flex">
            <EncoreLetterTile card={c} />
          </li>
        ))}
      </Letter>
    </>
  );
}

/**
 * One letter: its lockup with how often it comes, what it is and a link on
 * the left; its issues as covers on the right; the sign-up under the words
 * on a desktop and after the covers on a phone.
 */
function Letter({
  id,
  first,
  className,
  lockup,
  name,
  often,
  what,
  link,
  next,
  ask,
  children,
}: {
  id: string;
  /** The first letter follows the page's heading, so it starts closer. */
  first?: boolean;
  className?: string;
  lockup: ReactNode;
  name: string;
  often: string;
  what: string;
  link: { href: string; label: string };
  next?: string;
  ask: { heading: string; body: string; form: ReactNode };
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-header", className)} aria-labelledby={`${id}-title`}>
      <div className={cn("container-site grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]", first ? "pb-section pt-12 lg:pt-16" : "py-section")}>
        <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1">
          <h2 id={`${id}-title`} className="flex flex-wrap items-end gap-x-4 gap-y-2">
            {lockup}
            <span className="sr-only">{name}, </span>
            <span className="t-mono-sm pb-[0.35em] text-graphite-500">{often}</span>
          </h2>
          <p className="t-body max-w-[46ch] text-body">{what}</p>
          <RuleLink href={link.href} className="self-start">
            {link.label}
          </RuleLink>
        </div>
        <div className="flex flex-col gap-8 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2">{children}</ul>
          {next ? <p className="t-note">{next}</p> : null}
        </div>
        <div className="flex flex-col gap-4 border-t border-hairline pt-8 lg:col-start-1 lg:row-start-2 lg:self-start">
          <h3 className="t-h3 text-navy">{ask.heading}</h3>
          <p className="t-small max-w-[46ch] text-body">{ask.body}</p>
          {ask.form}
        </div>
      </div>
    </section>
  );
}
