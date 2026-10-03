import type { Route } from "next";
import Link from "next/link";
import { Photo } from "@/components/photo";
import type { IssueModel } from "@/lib/tide/issue";

/**
 * The issue's cover, set the way the guides set theirs: the month's photograph
 * full-bleed under the harbor wash, the eyebrow, the headline in the display
 * face, the dek, and the mono line with the data month and the reading time.
 * Along the foot, from lg up, the issue's contents as anchor links.
 */
export function TideCover({ model, contents }: { model: IssueModel; contents: { href: string; label: string; n: string }[] }) {
  return (
    <header data-header-overlay className="tide-cover guide-cover-ground relative -mt-header overflow-hidden text-white">
      <Photo image={model.cover} priority sizes="100vw" className="guide-cover-photo" />
      <div className="guide-cover-wash tide-cover-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-site relative flex min-h-[600px] flex-col justify-end pt-[calc(var(--header-h)+5rem)] pb-10 sm:min-h-[680px] lg:min-h-[780px] lg:pb-12">
        <div className="flex max-w-[980px] flex-col gap-6">
          <p className="rise d1 t-eyebrow text-mist text-shadow-soft">
            <Link href="/tide" className="-my-2 inline-block py-2 transition-colors hover:text-white">
              Tide
            </Link>
            <span aria-hidden="true"> · </span>
            <span>{model.issueLabel}</span>
          </p>
          <span className="block h-px w-14 bg-sky-300" aria-hidden="true" />
          <h1 className="rise d2 font-display text-[clamp(2.5rem,1.2rem+4.2vw,5.25rem)] leading-[1.02] font-extralight tracking-[-0.022em] text-balance text-white text-shadow-photo">
            {model.headline}
          </h1>
          <p className="rise d3 max-w-[640px] text-[1.1875rem] leading-[1.6] text-linen-100 text-shadow-soft sm:text-[1.3125rem]">{model.dek}</p>
          <p className="t-record text-linen-200">{model.coverLine}</p>
        </div>
        {contents.length ? (
          <nav aria-label="In this issue" className="mt-12 hidden border-t border-sky-300/25 pt-5 lg:block print:hidden">
            <ol className="flex flex-wrap gap-x-8 gap-y-2">
              {contents.map((c) => (
                <li key={c.href}>
                  <Link href={c.href as Route} className="t-mono-sm -my-2 inline-flex gap-2 py-2 text-linen-200 transition-colors hover:text-white">
                    <span className="text-sky-300">{c.n}</span>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
