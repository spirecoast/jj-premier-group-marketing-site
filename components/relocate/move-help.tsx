"use client";

import { PlaceTabs, type PlaceTab } from "@/components/places/place-tabs";
import { HELP, QUESTIONS as Q } from "@/lib/relocate/copy";
import { usePlanner } from "./planner-context";
import { ExternalLink } from "@/components/ui/external-link";

const KINDS = ["movers", "painters", "handyman", "cleaners"] as const;

const SourceLink = ({ href, children }: { href: string; children: string }) => (
  <ExternalLink href={href} className="text-navy underline underline-offset-4">
    {children}
  </ExternalLink>
);

/**
 * Google-rated movers, painters, handyman services and house cleaners in
 * the county the plan is for, under the plan. Each list is fetched when its
 * tab opens. Off when the server has no Google key.
 */
export function MoveHelp({ enabled }: { enabled: boolean }) {
  const { mode, answers } = usePlanner();
  if (!enabled || mode !== "plan") return null;
  const county = answers.county;
  const where = county === "both" ? HELP.both : Q.county.options[county];
  const M = HELP.movers;

  const tabs: PlaceTab[] = KINDS.map((kind) => ({
    id: kind,
    label: HELP.tabs[kind],
    url: `/api/places/pros?${new URLSearchParams({ county, kind }).toString()}`,
    empty: HELP.empty,
    intro:
      kind === "movers" ? (
        <>
          <p>
            {M.interstate} <SourceLink href={M.interstateLink.url}>{M.interstateLink.label}</SourceLink>.
          </p>
          <p>
            {M.intrastate} <SourceLink href={M.intrastateLink.url}>{M.intrastateLink.label}</SourceLink>.
          </p>
        </>
      ) : undefined,
  }));

  return (
    <section className="border-t border-hairline bg-white print:hidden" aria-labelledby="move-help-title">
      <div className="container-site grid gap-8 py-section lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <h2 id="move-help-title" className="t-h1 text-navy">
            {HELP.title}
          </h2>
          <p className="t-body max-w-[440px] text-body">{HELP.intro(where)}</p>
        </div>
        <PlaceTabs key={county} tabs={tabs} label={HELP.title} note={HELP.note} askHref="#contact" />
      </div>
    </section>
  );
}
