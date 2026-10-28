"use client";

import { useId, useMemo, useState } from "react";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { norm } from "@/lib/neighborhoods/search";
import { TEAM_COPY as T } from "@/lib/room/copy";
import { MAX_PLACES } from "@/lib/room/model";
import { useJsonResource } from "@/lib/use-json-resource";

export type PickedPlace = Pick<IndexEntry, "s" | "n" | "m" | "l">;

/**
 * The room's neighborhoods: the ones already picked, each with Remove, and a
 * search over the Atlas index (fetched once, on the first keystroke) to add
 * more. The picked slugs travel with the form in one hidden field.
 */
export function PlacePicker({ initial, datasetVersion }: { initial: PickedPlace[]; datasetVersion: string }) {
  const [picked, setPicked] = useState<PickedPlace[]>(initial);
  const [q, setQ] = useState("");
  const [wanted, setWanted] = useState(false);
  const id = useId();
  const index = useJsonResource<{ entries: IndexEntry[] }>(wanted ? `/api/neighborhoods/index?v=${encodeURIComponent(datasetVersion)}` : null);
  const full = picked.length >= MAX_PLACES;

  const results = useMemo(() => {
    const entries = index.data?.entries;
    const needle = norm(q);
    if (!entries || needle.length < 2) return [];
    const have = new Set(picked.map((p) => p.s));
    const out: IndexEntry[] = [];
    for (const e of entries) {
      if (have.has(e.s) || e.r !== 1) continue;
      if (e.q.includes(needle)) out.push(e);
      if (out.length >= 8) break;
    }
    return out;
  }, [index.data, q, picked]);

  function add(e: IndexEntry) {
    if (full) return;
    setPicked((p) => [...p, { s: e.s, n: e.n, m: e.m, l: e.l }]);
    setQ("");
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="places" value={picked.map((p) => p.s).join(",")} />
      {picked.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {picked.map((p) => (
            <li key={p.s} className="flex items-start justify-between gap-3 border border-hairline bg-paper px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="t-body text-navy">{p.n}</span>
                <span className="t-mono-sm text-graphite-500">
                  {marketName(p.m)} · {LEVEL_LABEL[p.l]}
                </span>
              </span>
              <button type="button" onClick={() => setPicked((all) => all.filter((x) => x.s !== p.s))} className="t-mono-sm shrink-0 text-graphite-500 underline-offset-4 hover:text-navy hover:underline" aria-label={`${T.remove} ${p.n}`}>
                {T.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="field">
        <label htmlFor={`${id}-q`} className="field-label">
          {T.searchLabel}
        </label>
        <input
          id={`${id}-q`}
          type="search"
          value={q}
          disabled={full}
          placeholder={T.searchPlaceholder}
          autoComplete="off"
          className="field-input"
          onFocus={() => setWanted(true)}
          onChange={(e) => {
            setWanted(true);
            setQ(e.target.value);
          }}
          aria-describedby={`${id}-hint`}
          aria-controls={`${id}-results`}
        />
        <p id={`${id}-hint`} className="t-mono-sm text-graphite-500">
          {full ? T.placesFull(MAX_PLACES) : index.error ? T.indexFailed : T.placesHint}
        </p>
      </div>
      <div id={`${id}-results`} aria-live="polite">
        {norm(q).length >= 2 && index.data ? (
          results.length ? (
            <ul className="grid gap-1">
              {results.map((e) => (
                <li key={e.s}>
                  <button type="button" onClick={() => add(e)} className="flex w-full items-baseline justify-between gap-3 border border-hairline bg-white px-4 py-2.5 text-left transition-colors hover:border-navy">
                    <span className="t-body text-navy">{e.n}</span>
                    <span className="t-mono-sm shrink-0 text-graphite-500">
                      {marketName(e.m)} · {LEVEL_LABEL[e.l]} · {T.add}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-small text-graphite-500">{T.noMatches}</p>
          )
        ) : null}
      </div>
    </div>
  );
}
