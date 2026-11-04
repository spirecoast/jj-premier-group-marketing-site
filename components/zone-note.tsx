import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ZONE_GUIDES,
  evacAbout,
  evacLetters,
  evacZoneMeaning,
  floodCodesIn,
  floodZoneMeaning,
  namesEvacuation,
  zoneTextParts,
  type EvacWord,
  type EvacZone,
} from "@/lib/zones";

/*
 * The plain meaning of a flood zone or an evacuation zone, set beside it. The
 * words come from lib/zones.ts, the one place the site defines them. Always
 * visible text: nothing waits behind a hover, so a phone and a keyboard read
 * the same as a mouse. No hooks, so a server page and a client island can both
 * use these.
 */

/**
 * "High risk. Part of FEMA's 1% annual chance flood area, …" under a FEMA code,
 * or with `named`, "Flood zone AE: high risk. …" where the code isn't shown
 * right above it.
 */
export function FloodZoneNote({ code, shaded, named, className }: { code: string; shaded?: boolean; named?: boolean; className?: string }) {
  const m = floodZoneMeaning(code, { shaded });
  if (!m) return null;
  return (
    <p className={cn("t-small max-w-measure text-body", className)} data-zone-note="flood">
      {named ? (
        <>
          <span className="font-medium text-navy">Flood zone {code}:</span> {m.label.toLowerCase()}.
        </>
      ) : (
        <span className="font-medium text-navy">{m.label}.</span>
      )}{" "}
      {m.line}
    </p>
  );
}

/**
 * What an evacuation zone's letter means. `compact` gives the few words a card
 * or a table cell has room for; otherwise the full line, and with `about` the
 * line on what the letters are and that they aren't the flood zone.
 */
export function EvacZoneNote({ zone, word = "zone", compact, about, className }: { zone: EvacZone; word?: EvacWord; compact?: boolean; about?: boolean; className?: string }) {
  const m = evacZoneMeaning(zone, word);
  if (compact) {
    return (
      <span className={cn("block t-note", className)} data-zone-note="evacuation">
        {m.short}
      </span>
    );
  }
  return (
    <span className={cn("flex flex-col gap-1.5 t-small max-w-measure text-body", className)} data-zone-note="evacuation">
      <span>{m.line}</span>
      {about ? <span>{evacAbout(word)}</span> : null}
    </span>
  );
}

/** A sentence with the risk set after the first mention of each flood zone code: "zone AE (high risk) or VE (highest risk)". */
export function ZoneText({ text }: { text: string }) {
  return (
    <>
      {zoneTextParts(text).map((p, i) =>
        "code" in p ? (
          <span key={i} className="text-body-muted">
            {" "}
            ({p.label})
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/**
 * The full meaning of each flood zone the given sentences name, and of the
 * evacuation letters when they talk about evacuation, set once under them.
 * Nothing when they name no zone.
 */
export function ZoneKey({ texts, evacuation = true, word = "zone", guide = false, className }: { texts: string[]; evacuation?: boolean; word?: EvacWord; guide?: boolean; className?: string }) {
  const codes = [...new Set(texts.flatMap(floodCodesIn))];
  const evac = evacuation && texts.some(namesEvacuation);
  if (!codes.length && !evac) return null;
  return (
    <div className={cn("flex flex-col gap-2 border-l-2 border-sky-700 pl-4", className)} data-zone-key>
      <dl className="flex flex-col gap-1.5 t-small max-w-measure text-body">
        {codes.map((c) => {
          const m = floodZoneMeaning(c)!;
          return (
            <div key={c}>
              <dt className="inline font-medium text-navy">Flood zone {c}: </dt>
              <dd className="inline">
                {m.label.toLowerCase()}. {m.line}
              </dd>
            </div>
          );
        })}
        {evac ? (
          <div>
            <dt className="inline font-medium text-navy">Evacuation {word}s: </dt>
            <dd className="inline">A to E. {evacLetters(word)}</dd>
          </div>
        ) : null}
      </dl>
      {guide ? (
        <Link href={(codes.length ? ZONE_GUIDES.flood : ZONE_GUIDES.evacuation) as Route} className="link-rule self-start t-small">
          {codes.length ? "More on flood zones" : "More on evacuation zones"}
        </Link>
      ) : null}
    </div>
  );
}
