import type { Metadata, Route } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/buttons";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { Masthead } from "@/components/masthead";
import { TideIssueCard } from "@/components/tide/issue-card";
import { TideCover, TideWordmark } from "@/components/tide/tide-cover";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { loadIssueCards } from "@/lib/tide/load";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tide, the monthly market report",
  description: W.indexDescription,
  path: "/tide",
});

/**
 * /tide, Tide's home: the newest issue as a full cover beside its headline and
 * the sign-up, then every earlier issue as a cover. Issues only; the guides
 * have their own page.
 */
export default async function TideIndexPage() {
  const [latest, ...earlier] = await loadIssueCards();
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
        title={
          <>
            <span className="sr-only">Tide Market Report</span>
            <TideWordmark id="tide-masthead" decorative className="w-[min(420px,64vw)] text-white" />
          </>
        }
      >
        <p className="rise d3 -mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-light italic text-linen-200">{W.indexTitle}</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-linen-100/80">JJ Premier Group</span>
        </p>
        <p className="rise d3 t-lead max-w-[560px] text-linen-100 text-shadow-soft">{W.indexLead}</p>
      </Masthead>

      {latest ? (
        <section className="container-site grid items-center gap-12 py-section lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-20" aria-labelledby="latest-title">
          <Link href={latest.href as Route} className="card group sr block w-full max-w-[540px]" aria-label={`${latest.title}: ${latest.headline ?? ""}`}>
            <TideCover card={latest} priority sizes="(min-width: 1024px) 540px, 100vw" className="shadow-[0_40px_80px_-40px_rgb(20_37_48/0.6)]" />
          </Link>
          <div className="sr flex flex-col gap-7 [--sr-i:1]">
            <h2 id="latest-title" className="t-display text-balance text-navy">
              {latest.headline ?? latest.title}
            </h2>
            <p className="t-lead max-w-[560px] text-body">{latest.excerpt}</p>
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

      {earlier.length ? (
        <section className="bg-parchment" aria-labelledby="past-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <h2 id="past-title" className="t-h1 text-navy">
              Past issues
            </h2>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {earlier.map((c, i) => (
                <li key={c.issue} className="sr flex" style={{ ["--sr-i" as string]: i % 3 }}>
                  <TideIssueCard card={c} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
