import type { Metadata, Route } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { AtlasMatch } from "@/components/match/atlas-match";
import { DATASET_VERSION, getIndexEntries } from "@/lib/neighborhoods/data";
import { monthYear } from "@/lib/neighborhoods/format";
import { QUESTIONS, parseMatch } from "@/lib/neighborhoods/match";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getIndexEntries()).length;
  return pageMetadata({
    title: "Atlas match · Ten questions about the place, none about you",
    description: `Answer up to ten questions about the place and the home, from market and county to home type, gating, association, CDD, water, evacuation zone and distance, and Atlas narrows its ${count.toLocaleString()} places to the ones whose facts fit. No ranking, no score.`,
    path: "/neighborhoods/match",
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Atlas match. The questions are about the place and the home, each read
 * against one sourced field; the answer is an unranked list. The
 * questionnaire itself is client-side so the count moves as answers change.
 */
export default async function MatchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const initial = parseMatch(params);
  const count = (await getIndexEntries()).length;
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Atlas", path: "/neighborhoods" },
          { name: "Match", path: "/neighborhoods/match" },
        ])}
      />

      <section className="container-site flex flex-col gap-7 pt-10 pb-10 md:pt-14" aria-labelledby="match-title">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-2 text-graphite-500">
          <Link href="/neighborhoods" className="underline-offset-4 hover:text-navy hover:underline">
            Atlas
          </Link>
          <span aria-hidden="true">›</span>
          <span>Match</span>
        </nav>
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">01 · Atlas match</p>
          <h1 id="match-title" className="t-display max-w-[820px] text-navy">
            Ten questions about the place. None about you.
          </h1>
        </div>
        <p className="t-lead max-w-[600px] text-body">
          Answer what matters and skip the rest. Every answer narrows the {count.toLocaleString()} places in Atlas by one fact we hold from a county,
          district, association or builder source.
        </p>
        <p className="t-body max-w-measure text-body">
          We don’t rank the result and we don’t score it. You get the list of places that fit, the facts that made them fit, and an honest “not
          known yet” where we don’t hold the fact. Each question reads one field of the record, named under its number, so you can see exactly what’s
          being asked of the data.
        </p>
      </section>

      <section className="container-site pb-section" aria-label="The questions">
        <div className="border border-hairline bg-paper p-5 sm:p-8 lg:p-10">
          <AtlasMatch initial={initial} datasetVersion={DATASET_VERSION} asOf={asOf} />
        </div>
      </section>

      <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="match-how-title">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">02 · How it reads the catalog</p>
          <h2 id="match-how-title" className="t-h1 max-w-[760px] text-navy">
            One field per question, and nothing guessed.
          </h2>
        </div>
        <ol className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
          {QUESTIONS.map((q, i) => (
            <li key={q.id} className="flex flex-col gap-2 bg-white p-5">
              <span className="t-mono-sm text-graphite-500">
                {String(i + 1).padStart(2, "0")} · {q.field}
              </span>
              <span className="t-h4 text-navy">{q.title}</span>
            </li>
          ))}
        </ol>
        <p className="t-small max-w-measure text-body-muted">
          Catalog as of {asOf}. A field we don’t hold is “not known”, never inferred, and you choose per question whether those places stay in. The
          questions are about places and homes only: nothing here asks about, or describes, who lives anywhere.
        </p>
        <Link href={"/neighborhoods" as Route} className="link-rule self-start">
          Back to the map
        </Link>
      </section>
    </>
  );
}
