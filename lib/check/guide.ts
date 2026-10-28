import type { Guide, ZoneCardsFigure } from "../guides/types";
import { guideCardFor, isShadedX, type FloodZone } from "./parse";

/**
 * The guides' own words beside an Atlas Check result: the flood guide's card
 * for the zone the parcel is in, and the hurricane guide's line on why an
 * evacuation zone is not a flood zone. Read from the guide data, so an edit
 * to a guide shows here too; a guide that no longer carries the piece shows
 * nothing rather than a stale copy.
 */

export const FLOOD_GUIDE = "flood-zones-and-elevation-certificates-on-the-suncoast";
export const HURRICANE_GUIDE = "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton";

export type FloodGuidePiece = {
  title: string;
  url: string;
  /** The zone's card, when the guide has one for it (VE, AE, X). */
  card: { code: string; name: string; means: string; lender: string; build: string; labels: { lender: string; build: string } } | null;
  /** The figure's own note, for a zone without a card (A, AH, AO, shaded X). */
  note: string | null;
};

export function floodGuidePiece(guides: Guide[], zone: FloodZone | null): FloodGuidePiece | null {
  const g = guides.find((x) => x.slug === FLOOD_GUIDE);
  if (!g) return null;
  for (const s of g.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "figure" || b.figure.type !== "zone-cards") continue;
      const fig = b.figure as ZoneCardsFigure;
      const url = `/guides/${g.slug}#${s.id}`;
      if (!zone) return { title: g.title, url, card: null, note: null };
      const code = guideCardFor(zone.zone);
      const card = code ? fig.cards.find((c) => c.code === code) : undefined;
      // The cards are written for VE, AE and X; A, AH, AO and shaded X get the figure's own note beside the nearest card.
      const exact = card && card.code === zone.zone && !isShadedX(zone);
      return {
        title: g.title,
        url,
        card: card ? { code: card.code, name: card.name, means: card.means, lender: card.lender.text, build: card.build, labels: fig.labels } : null,
        note: exact ? null : (b.note ?? null),
      };
    }
  }
  return { title: g.title, url: `/guides/${g.slug}`, card: null, note: null };
}

export type EvacGuidePiece = { title: string; url: string; lead: string };

export function evacGuidePiece(guides: Guide[]): EvacGuidePiece | null {
  const g = guides.find((x) => x.slug === HURRICANE_GUIDE);
  if (!g) return null;
  const s = g.sections.find((x) => x.id === "evacuation-zone-vs-flood-zone") ?? g.sections.find((x) => /evacuation/i.test(x.title));
  return s ? { title: g.title, url: `/guides/${g.slug}#${s.id}`, lead: s.lead } : { title: g.title, url: `/guides/${g.slug}`, lead: "" };
}
