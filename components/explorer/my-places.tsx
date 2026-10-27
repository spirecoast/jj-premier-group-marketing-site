"use client";

import type { Route } from "next";
import Link from "next/link";
import { BookmarkGlyph } from "@/components/atlas/save-place";
import { useMyPlaces } from "@/components/atlas/use-my-places";
import { ShareButton } from "@/components/share-button";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { COMPARE_MAX, compareSet, savedCount } from "@/lib/neighborhoods/my-places";
import { pathOf } from "@/lib/neighborhoods/search";
import { compareHref, explorerHref } from "@/lib/neighborhoods/url";
import "@/components/atlas/atlas-save.css";

/** The message the buy form opens with when it comes from a saved list. */
export function walkMeThroughHref(slugs: readonly string[], origin: string): Route {
  const list = `${origin}${explorerHref({ list: [...slugs] })}`;
  const message = `From Atlas, my saved places: ${list}\nCould you walk me through these?`;
  return `/contact?message=${encodeURIComponent(message)}` as Route;
}

function useActions(slugs: string[]) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const compare = compareSet(slugs);
  return {
    canCompare: slugs.length >= 2,
    compare: compareHref(compare),
    compareLabel: slugs.length > COMPARE_MAX ? `Compare the first ${COMPARE_MAX}` : "Compare",
    share: explorerHref({ list: slugs }),
    ask: walkMeThroughHref(slugs, origin),
  };
}

/**
 * My places on the explorer. On a desktop, a rail at the top right of the
 * map: the count, one row per saved place (its name opens it, a 44px Remove
 * takes it off), then Compare, Share and the ask. On a phone, a 44px navy bar
 * docked to the top of the sheet with the same three ways on. Both read the
 * one list kept in this browser; nothing shows until something is saved.
 */
export function MyPlacesRail({ by, onSelect }: { by: Map<string, IndexEntry>; onSelect: (slug: string) => void }) {
  const my = useMyPlaces();
  const a = useActions(my.list);
  if (!my.list.length) return null;
  return (
    <aside className="my-places-rail" aria-label="My places">
      <div className="my-places-rail-head">
        <div className="flex flex-col gap-0.5">
          <span className="t-mono-sm text-graphite-500">My places</span>
          <span className="t-h3 text-navy">{savedCount(my.list.length)}</span>
        </div>
        <span className="text-atlas-ink" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
            <path d="M6 3.5h12v17l-6-4.5-6 4.5z" />
          </svg>
        </span>
      </div>
      <ul className="my-places-rail-list">
        {my.list.map((slug) => {
          const e = by.get(slug);
          const path = e ? pathOf(e, by).map((x) => x.n) : [];
          return (
            <li key={slug} className="my-places-row">
              {e ? (
                <button type="button" className="my-places-row-text" onClick={() => onSelect(slug)}>
                  <span className="t-h4 truncate text-navy transition-colors">{e.n}</span>
                  <span className="t-note truncate">{[path.length ? path.join(" › ") : marketName(e.m), e.t ? TYPE_LABEL[e.t] : LEVEL_LABEL[e.l]].join(" · ")}</span>
                </button>
              ) : (
                <span className="my-places-row-text">
                  <span className="t-h4 truncate text-navy">{slug}</span>
                  <span className="t-note truncate">Not in the catalog any more</span>
                </span>
              )}
              <button type="button" className="btn-quiet is-square" onClick={() => my.remove(slug)} aria-label={`Remove ${e?.n ?? slug} from my places`} title="Remove">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="my-places-rail-actions">
        {a.canCompare ? (
          <Link href={a.compare} className="link-rule">
            {a.compareLabel}
          </Link>
        ) : (
          <span className="t-note">Save a second place to compare them.</span>
        )}
        <ShareButton title="My places · Atlas · JJ Premier Group" url={a.share} what="my-places" label="Share" />
        <Link href={a.ask} className="link-rule">
          Walk me through these
        </Link>
      </div>
      <p className="my-places-rail-note t-note">Kept on this device; the link carries the list.</p>
    </aside>
  );
}

export function MyPlacesTray() {
  const my = useMyPlaces();
  const a = useActions(my.list);
  if (!my.list.length) return null;
  return (
    <div className="my-places-tray" role="group" aria-label="My places">
      <span className="my-places-tray-count">
        <BookmarkGlyph />
        {savedCount(my.list.length)}
      </span>
      <span className="my-places-tray-spacer" />
      {a.canCompare ? (
        <Link href={a.compare}>{a.compareLabel}</Link>
      ) : (
        <span className="is-off" title="Save a second place to compare them">
          Compare
        </span>
      )}
      <ShareButton title="My places · Atlas · JJ Premier Group" url={a.share} what="my-places" label="Share" className="!text-[14px] !font-normal !normal-case !tracking-normal" />
      <Link href={a.ask}>Walk me through these</Link>
    </div>
  );
}
