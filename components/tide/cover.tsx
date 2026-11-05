import Link from "next/link";
import { TideWordmark } from "@/components/brand/marks";
import { Byline } from "@/components/byline";
import { Photo } from "@/components/photo";
import type { TeamMember } from "@/lib/content/types";
import type { IssueModel } from "@/lib/tide/issue";
import "@/components/guides/guides.css";

/**
 * The issue's cover: the month's photograph full-bleed under the harbor wash,
 * Tide's nameplate with the issue month beside it, the three places as a
 * dateline, the headline in the display face, the dek, and the byline with
 * the reading time. The cover is about now: the month the figures run
 * through, and how far each county's record reached, are said once under the
 * market overview, never here.
 */
export function TideCover({ model, team }: { model: IssueModel; team: Pick<TeamMember, "name" | "headshot">[] }) {
  return (
    <header data-header-overlay className="tide-cover guide-cover-ground relative -mt-header overflow-hidden text-white">
      <Photo image={model.cover} priority sizes="100vw" className="guide-cover-photo" />
      <div className="guide-cover-wash tide-cover-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-site relative flex min-h-[600px] flex-col justify-end pt-[calc(var(--header-h)+5rem)] pb-10 sm:min-h-[680px] lg:min-h-[780px] lg:pb-12">
        <div className="flex max-w-[980px] flex-col gap-6">
          <div className="rise d1 flex items-end gap-5">
            <Link href="/tide" aria-label="Tide Market Report" className="block w-[148px] text-white transition-opacity hover:opacity-85 sm:w-[184px]">
              <TideWordmark id="tide-issue-plate" decorative className="w-full" />
            </Link>
            <span className="mb-[0.55rem] flex flex-col gap-0.5 border-l border-white/30 pl-5">
              <span className="font-display text-[1.0625rem] font-light italic leading-none text-linen-200">Market Report · {model.issueLabel}</span>
              <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-linen-100">JJ Premier Group</span>
            </span>
          </div>
          <p className="rise d2 t-record text-tide text-shadow-soft">{model.dateline}</p>
          <h1 className="rise d2 t-hero text-white text-shadow-photo">{model.coverTitle ?? model.headline}</h1>
          <p className="rise d3 max-w-[640px] text-pretty text-[1.1875rem] leading-[1.6] text-linen-100 text-shadow-soft sm:text-[1.3125rem]">{model.coverKicker ?? model.dek}</p>
          <Byline people={team} extras={["JJ Premier Group", `${model.minutes} min read`]} tone="dark" className="rise d3 mt-2" />
        </div>
      </div>
    </header>
  );
}
