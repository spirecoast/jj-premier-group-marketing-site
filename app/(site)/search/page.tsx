import type { Metadata, Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { SearchBox } from "@/components/search/search-box";
import { SearchGoal } from "@/components/search/search-goal";
import { GUIDES } from "@/lib/guides";
import { SEARCH_COPY as C, SUGGESTED_SEARCHES } from "@/lib/search/copy";
import { clientIp, normalizeQuery } from "@/lib/search/query";
import { searchSite, searchSiteKeywordOnly, pageLimiter } from "@/lib/search/search";
import { snippetParts } from "@/lib/search/snippet";
import { KIND_LABEL, type SearchHit } from "@/lib/search/types";
import { absoluteUrl } from "@/lib/seo";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = first((await searchParams).q).trim();
  return {
    title: q ? `${C.title}: ${q.slice(0, 60)}` : C.title,
    description: C.description,
    alternates: { canonical: absoluteUrl("/search") },
    // A page of results is a view, not a page: keep it out of the index, follow its links.
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

/** "Flood zones and flood insurance, explained" → the path a reader sees under it. */
const displayPath = (url: string) => url.replace(/#.*$/, "").replace(/^\//, "").replace(/\//g, " / ") || "home";

function Snippet({ text }: { text: string }) {
  return (
    <p className="t-small max-w-measure text-body">
      {snippetParts(text).map((p, i) =>
        p.mark ? (
          <mark key={i} className="search-mark">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

function Result({ hit }: { hit: SearchHit }) {
  return (
    <li className="border-t border-hairline">
      <Link href={hit.url as Route} className="group flex flex-col gap-2 py-6 md:flex-row md:gap-10">
        <p className="t-mono-sm w-36 shrink-0 pt-1 uppercase tracking-[0.12em] text-sky-700">{KIND_LABEL[hit.kind]}</p>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="t-h3 text-navy underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-harbor-300">{hit.title}</h2>
          {hit.section && hit.section !== hit.title ? <p className="t-label text-graphite-600">{hit.section}</p> : null}
          {hit.snippet ? <Snippet text={hit.snippet} /> : null}
          <p className="t-mono-sm truncate text-graphite-500">{displayPath(hit.url)}</p>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
      <div className="flex flex-col gap-4">
        <h2 className="t-eyebrow text-amber">{C.suggestionsHeading}</h2>
        <p className="t-body text-body">{C.emptyLead}</p>
        <ul className="flex flex-wrap gap-2">
          {SUGGESTED_SEARCHES.map((s) => (
            <li key={s}>
              <Link href={`/search?q=${encodeURIComponent(s)}` as Route} className="chip">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="t-eyebrow text-amber">{C.guidesHeading}</h2>
        <ul className="flex flex-col">
          {GUIDES.map((g) => (
            <li key={g.slug} className="border-t border-hairline">
              <Link href={`/guides/${g.slug}` as Route} className="t-body flex min-h-11 items-center py-2 text-navy underline decoration-transparent underline-offset-4 hover:decoration-harbor-300">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = first((await searchParams).q);
  const check = normalizeQuery(raw);
  const q = check.q;

  let results: SearchHit[] = [];
  let source = "";
  if (check.ok) {
    // Past the per-IP limit the page still answers, from the in-memory keyword index.
    const ip = clientIp(await headers());
    const res = pageLimiter.take(ip) ? await searchSite(q) : await searchSiteKeywordOnly(q);
    results = res.results;
    source = res.source;
  }

  return (
    <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="search-title">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">{C.eyebrow}</p>
          <h1 id="search-title" className="t-h1 text-navy">
            {C.heading}
          </h1>
        </div>
        <SearchBox initial={q} />
      </div>

      {!q ? (
        <EmptyState />
      ) : !check.ok ? (
        <p className="t-body text-body">{C.tooShort}</p>
      ) : results.length ? (
        <div className="flex flex-col gap-4" data-search-source={source}>
          <p className="t-mono-sm text-graphite-500" aria-live="polite">
            {results.length === 1 ? C.oneResult : C.manyResults.replace("{n}", String(results.length))} {C.resultsFor} “{q}”
          </p>
          <ol className="flex flex-col border-b border-hairline">
            {results.map((hit) => (
              <Result key={hit.id} hit={hit} />
            ))}
          </ol>
        </div>
      ) : (
        <div className="flex max-w-measure flex-col gap-4" data-search-source={source}>
          <p className="t-h3 text-navy" aria-live="polite">
            {C.noResults}
          </p>
          <p className="t-body text-body">{C.noResultsHelp}</p>
          <Link href="/contact" className="btn btn-outline self-start">
            {C.noResultsCta}
          </Link>
        </div>
      )}
      {check.ok ? <SearchGoal q={q} count={results.length} /> : null}
    </section>
  );
}
