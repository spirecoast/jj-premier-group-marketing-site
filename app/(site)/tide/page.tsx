import type { Metadata, Route } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/buttons";
import { Byline } from "@/components/byline";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { Masthead } from "@/components/masthead";
import { TideIssueCard } from "@/components/tide/issue-card";
import { TideCover, TideWordmark } from "@/components/tide/tide-cover";
import { fill } from "@/lib/issues/copy";
import { monthLabel } from "@/lib/issues/render";
import { addMonths } from "@/lib/issues/tide-monthly";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { getTeam } from "@/lib/content";
import { loadIssueCards } from "@/lib/tide/load";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tide, the monthly market report",
  description: W.indexDescription,
  path: "/tide",
});

/**
 * /tide, Tide's home: the newest issue as a full cover beside its headline and
 * the sign-up, then every earlier issue as a cover, once there is one (with
 * one issue out, the page ends on the next issue's month rather than on empty
 * frames). Issues only; the guides have their own page.
 */
export default async function TideIndexPage() {
  const [[latest, ...earlier], team] = await Promise.all([loadIssueCards(), getTeam()]);
  const showSamples = process.env.NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS === "true";
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tide", path: "/tide" },
        ])}
      />
      <Masthead
        route="/tide"
        titleId="tide-title"
      >
        <p className="rise d3 t-lead max-w-[560px] text-linen-100 text-shadow-soft">{W.indexLead}</p>
      </Masthead>

      {latest ? (
        <section className="container-site grid items-center gap-12 py-section lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-20" aria-labelledby="latest-title">
          <Link href={latest.href as Route} className="card group sr block w-full max-w-[540px]" aria-label={`${latest.title}: ${latest.headline ?? ""}`}>
            <TideCover card={latest} priority sizes="(min-width: 1024px) 540px, 100vw" />
          </Link>
          <div className="sr flex flex-col gap-7 [--sr-i:1]">
            <h2 id="latest-title" className="t-display text-balance text-navy">
              {latest.coverTitle ?? latest.headline ?? latest.title}
            </h2>
            <p className="t-lead max-w-[560px] text-body">{latest.coverKicker ?? latest.excerpt}</p>
            <Byline people={team.map((m) => ({ name: m.name, headshot: m.headshot }))} extras={["JJ Premier Group", latest.issueLabel ?? ""].filter(Boolean)} />
            <div>
              <ButtonLink href={latest.href} dash>
                Read the {latest.issueLabel} issue
              </ButtonLink>
            </div>
            <div className="flex flex-col gap-4 border-t border-hairline pt-8">
              <h3 className="t-h3 text-navy">{W.askHeading}</h3>
              <p className="t-body max-w-measure text-body">{W.askBody}</p>
              <LetterForm />
            </div>
          </div>
        </section>
      ) : null}

      {/* Past issues: the archive, only once there is one. Until then the page ends on the next issue's month. */}
      {earlier.length ? (
        <section className="bg-parchment" aria-labelledby="past-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <div className="flex flex-col gap-3">
              <h2 id="past-title" className="t-h1 text-navy">
                Past issues
              </h2>
              <p className="t-body max-w-measure text-body">Every issue stays here once the next one is out, newest first.</p>
            </div>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {earlier.map((c, i) => (
                <li key={c.issue} className="sr flex max-w-[400px]" style={{ ["--sr-i" as string]: i % 3 }}>
                  <TideIssueCard card={c} />
                </li>
              ))}
              {/* The empty slot, kept for sample previews and the print sheet; never on the public page. */}
              {showSamples
                ? Array.from({ length: Math.max(0, 3 - earlier.length) }, (_, i) => (
                    <li key={`slot-${i}`} className="flex max-w-[400px]" aria-hidden="true">
                      <div className="tide-slot flex aspect-[4/5] w-full flex-col items-center justify-center gap-4">
                        <TideWordmark id={`tide-slot-${i}`} decorative className="w-1/2 text-navy opacity-25" />
                        <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-navy/40">Market Report</span>
                      </div>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        </section>
      ) : latest ? (
        <section className="border-t border-hairline" aria-label="Next issue">
          <div className="container-site py-10">
            <p className="t-note" data-tide-next-issue="">
              {fill(W.nextIssue, { month: monthLabel(addMonths(latest.issue, 1)) })}
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
