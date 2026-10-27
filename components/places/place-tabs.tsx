"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { loadSentry } from "@/lib/sentry/client";
import type { Place } from "@/lib/places/rank";
import { cn } from "@/lib/utils";
import { ExternalLink } from "@/components/ui/external-link";

export type PlaceTab = {
  id: string;
  label: string;
  url: string;
  /** Said when Google has nothing good enough to list. */
  empty: string;
  /** Shown above this tab's list. */
  intro?: ReactNode;
};

type Result = { status: "done"; places: Place[] } | { status: "error"; message: string; capped?: boolean };

/** Said for anything that isn't the server's own answer: a dropped connection, a timeout, a page that wasn't JSON. */
export const PLACES_UNREACHABLE = "Google didn’t answer. Try again in a moment.";

/** The server's own words, when it sent some. */
class PlacesAnswer extends Error {
  constructor(
    message: string,
    readonly capped: boolean,
  ) {
    super(message);
  }
}

/**
 * A few lists from Google, one per tab, each fetched the first time its tab
 * opens and kept only while the page is open. Every list carries the
 * "Google Maps" attribution Google asks for when there's no map.
 */
export function PlaceTabs({ tabs, label, note, askHref = "/contact", className }: { tabs: PlaceTab[]; label: string; note?: ReactNode; askHref?: string; className?: string }) {
  const uid = useId();
  const [active, setActive] = useState(tabs[0]!.id);
  // A tab with no result is loading.
  const [results, setResults] = useState<Record<string, Result>>({});
  const [attempt, setAttempt] = useState(0);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0]!;
  const result = results[tab.id];

  useEffect(() => {
    if (results[tab.id]) return;
    const ctrl = new AbortController();
    const id = tab.id;
    fetch(tab.url, { signal: ctrl.signal })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { places?: Place[]; error?: string; capped?: boolean };
        if (res.ok && body.places) return setResults((r) => ({ ...r, [id]: { status: "done", places: body.places! } }));
        throw body.error ? new PlacesAnswer(body.error, body.capped === true) : new Error(`places ${res.status}`);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof PlacesAnswer) return setResults((r) => ({ ...r, [id]: { status: "error", message: err.message, capped: err.capped } }));
        // The browser's own words ("Failed to fetch", "Load failed") never reach the page; they go to Sentry.
        void loadSentry().then((Sentry) => Sentry?.captureException(err, { tags: { feature: "places" }, extra: { url: tab.url } }));
        setResults((r) => ({ ...r, [id]: { status: "error", message: PLACES_UNREACHABLE } }));
      });
    return () => ctrl.abort();
    // Only a new tab, or Try again, starts a fetch; a result arriving doesn't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id, tab.url, attempt]);

  const retry = () => {
    setResults((r) => {
      const { [tab.id]: _gone, ...rest } = r;
      return rest;
    });
    setAttempt((n) => n + 1);
  };

  return (
    <div className={cn("places flex flex-col gap-4", className)}>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${uid}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={t.id === tab.id}
            aria-controls={`${uid}-panel`}
            data-active={t.id === tab.id}
            className="chip"
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab.id}`} aria-busy={!result}>
        {tab.intro ? <div className="t-small mb-2 flex flex-col gap-1 border-l-2 border-atlas pl-3 text-graphite-600">{tab.intro}</div> : null}
        {!result ? (
          <ul className="flex flex-col" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex flex-col gap-2 border-b border-hairline py-3.5 last:border-b-0">
                <span className="h-4 w-1/2 animate-pulse rounded bg-linen-200" />
                <span className="h-3 w-2/3 animate-pulse rounded bg-linen-100" />
              </li>
            ))}
          </ul>
        ) : result.status === "error" ? (
          result.capped ? (
            // Nothing to retry until tomorrow: offer the team's own list instead.
            <p className="t-small text-body" role="status">
              {result.message}{" "}
              <Link href={askHref as Route} className="text-navy underline underline-offset-4 hover:text-sky-700">
                Ask us
              </Link>{" "}
              and we’ll send our own list.
            </p>
          ) : (
            <p className="t-small flex flex-wrap items-center gap-x-4 gap-y-2 text-body" role="status">
              {result.message}
              <button type="button" className="link-rule" onClick={retry}>
                Try again
              </button>
            </p>
          )
        ) : result.places.length ? (
          <ol className="flex flex-col">
            {result.places.map((p) => (
              <PlaceRow key={p.id} p={p} />
            ))}
          </ol>
        ) : (
          <p className="t-small text-body">{tab.empty}</p>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        {note ? <p className="t-small text-graphite-500">{note}</p> : null}
        <span className="google-maps-attribution" translate="no">
          Google Maps
        </span>
      </div>
    </div>
  );
}

const count = (n: number) => n.toLocaleString("en-US");

function PlaceRow({ p }: { p: Place }) {
  const facts = [p.price, p.miles != null ? `${p.miles.toFixed(1)} mi` : undefined, p.hours].filter(Boolean);
  return (
    <li className="flex flex-col gap-1 border-b border-hairline py-3.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <ExternalLink href={p.mapsUri} className="font-display text-[1.125rem] leading-snug text-navy underline-offset-4 hover:underline">
          {p.name}
        </ExternalLink>
        <p className="t-small text-graphite-600">
          <span className="text-navy">
            {p.rating.toFixed(1)}
            <span aria-hidden="true" className="text-amber">
              {" "}
              ★
            </span>
          </span>{" "}
          <span className="sr-only">stars, from </span>
          <span className="tabular-nums">({count(p.count)}</span>
          <span className="sr-only"> reviews</span>
          <span aria-hidden="true">)</span>
          {facts.length ? <> · {facts.join(" · ")}</> : null}
        </p>
        {p.address ? <p className="t-small text-graphite-500">{p.address}</p> : null}
      </div>
      <p className="t-small flex shrink-0 flex-wrap gap-x-4 gap-y-1">
        {p.website ? (
          <ExternalLink href={p.website} className="text-navy underline underline-offset-4 hover:text-sky-700">
            Website
          </ExternalLink>
        ) : null}
        {p.phone ? (
          <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="text-navy tabular-nums underline underline-offset-4 hover:text-sky-700">
            {p.phone}
          </a>
        ) : null}
      </p>
    </li>
  );
}
