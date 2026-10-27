"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { ShareButton } from "@/components/share-button";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, STATUS_LABEL, TYPE_LABEL, titleCase } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { explorerHref } from "@/lib/neighborhoods/url";
import "./explorer.css";

/** The selected place, in the panel: the short facts and the ways out. */
export function PlaceCard({
  entry: e,
  ancestors,
  childCount,
  asOf,
  headingRef,
  onSelect,
  onClose,
}: {
  entry: IndexEntry;
  ancestors: IndexEntry[];
  childCount: number;
  asOf: string;
  /** The panel focuses the name when the card opens, so a keyboard or screen reader lands on the place. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onSelect: (slug: string) => void;
  onClose: () => void;
}) {
  const facts: [string, string][] = [];
  if (e.t) facts.push(["Type", TYPE_LABEL[e.t]]);
  if (e.st) facts.push([`Status · as of ${asOf}`, STATUS_LABEL[e.st]]);
  if (e.j) facts.push(["Jurisdiction", e.j]);
  if (e.c) facts.push(["County", `${e.c} County`]);
  if (e.z.length) facts.push([e.z.length > 1 ? "ZIPs" : "ZIP", e.z.join(", ")]);
  if (e.b.length) facts.push([`Builders selling · as of ${asOf}`, e.b.join(", ")]);
  if (e.h.length) facts.push(["Home types", e.h.map(titleCase).join(", ")]);
  if (e.g === true) facts.push(["Gated", "Yes"]);

  return (
    <article className="explorer-card" aria-label={e.n}>
      <div className="flex items-start justify-between gap-3">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-2 text-graphite-500">
          <span>{marketName(e.m)}</span>
          {ancestors.map((a) => (
            <span key={a.s} className="flex items-center gap-x-2">
              <span aria-hidden="true">›</span>
              <button type="button" className="underline-offset-4 hover:text-navy hover:underline" onClick={() => onSelect(a.s)}>
                {a.n}
              </button>
            </span>
          ))}
        </nav>
        <button type="button" onClick={onClose} className="explorer-quiet -mr-3 -mt-3" aria-label="Close">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="t-h1 explorer-card-title mt-2 text-navy">
        {e.n}
      </h2>
      <p className="t-note mt-1">
        {LEVEL_LABEL[e.l]}
        {e.a.length ? ` · also ${e.a.join(", ")}` : ""}
        {!e.r ? " · county registry name" : ""}
      </p>
      {facts.length ? (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="t-mono-sm text-graphite-500">{k}</dt>
              <dd className="t-small text-body">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {childCount ? (
        <p className="t-small mt-4 text-body">
          {childCount} {childCount === 1 ? "place" : "places"} inside, listed below.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href={`/neighborhoods/${e.s}`} className="btn btn-navy !min-h-11 !px-5 !text-[12px]">
          The full page
          <span className="btn-dash" aria-hidden="true" />
        </Link>
        <ShareButton title={`${e.n} · JJ Premier Group`} url={explorerHref({ place: e.s })} what="place" label="Share this place" />
      </div>
    </article>
  );
}
