import type { Metadata, Route } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { TideIssueCard } from "@/components/tide/issue-card";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { loadIssueCards } from "@/lib/tide/load";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tide, every issue",
  description: W.indexDescription,
  path: "/tide",
});

/** /tide: every issue in lib/tide/issues.ts the data can build, newest first. */
export default async function TideIndexPage() {
  const cards = await loadIssueCards();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tide", path: "/tide" },
        ])}
      />
      <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="tide-title">
        <div className="flex max-w-[820px] flex-col gap-4">
          <p className="t-eyebrow text-amber">{W.indexEyebrow}</p>
          <h1 id="tide-title" className="t-display text-navy">
            {W.indexTitle}
          </h1>
          <p className="t-lead text-body">{W.indexLead}</p>
          <Link href={"/blog" as Route} className="t-small self-start py-2 text-sky-700 underline underline-offset-4 hover:text-navy">
            {W.indexArchive}
          </Link>
        </div>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <li key={c.issue} className="flex">
              <TideIssueCard card={c} priority={i === 0} />
            </li>
          ))}
        </ul>
        <div className="grid gap-8 border border-hairline bg-white p-6 md:grid-cols-[1fr_1fr] md:items-center md:p-10">
          <div className="flex flex-col gap-3">
            <h2 className="t-h1 text-navy">{W.askHeading}</h2>
            <p className="t-body max-w-measure text-body">{W.askBody}</p>
          </div>
          <LetterForm />
        </div>
      </section>
    </>
  );
}
