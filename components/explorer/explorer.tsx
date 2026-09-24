"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { childrenOf, descendantsOf, pathOf, search, type Filters } from "@/lib/neighborhoods/search";
import { explorerHref, type ExplorerState, type MapView } from "@/lib/neighborhoods/url";
import type { Bounds, FitRequest } from "./explorer-map";
import { ExplorerPanel, type SheetPosition } from "./explorer-panel";

const ExplorerMap = dynamic(() => import("./explorer-map").then((m) => m.ExplorerMap), {
  ssr: false,
  loading: () => <div className="explorer-map explorer-map-loading" aria-hidden="true" />,
});

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type FitInput = DistributiveOmit<FitRequest, "id">;

const PANEL_W = 420;
const DESKTOP = "(min-width: 1024px)";

function boundsOf(entries: IndexEntry[]): Bounds | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of entries) {
    if (p.x === null || p.y === null) continue;
    if (p.x < w) w = p.x;
    if (p.x > e) e = p.x;
    if (p.y < s) s = p.y;
    if (p.y > n) n = p.y;
  }
  return Number.isFinite(w) ? [w, s, e, n] : null;
}

/**
 * The neighborhood explorer: one state (query, filters, selected place, map
 * view) that the URL, the map and the panel all reflect. The index arrives
 * once from /api/neighborhoods/index and everything after is in memory.
 */
export function Explorer({ initial, datasetVersion, asOf }: { initial: ExplorerState; datasetVersion: string; asOf: string }) {
  const [entries, setEntries] = useState<IndexEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState(initial.q);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [place, setPlace] = useState<string | null>(initial.place);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<MapView | null>(initial.map);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [fit, setFit] = useState<FitRequest | null>(null);
  const [sheet, setSheet] = useState<SheetPosition>(initial.place ? "half" : "peek");
  const [desktop, setDesktop] = useState(true);
  const fitId = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const userMoved = useRef(Boolean(initial.map));

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/neighborhoods/index?v=${encodeURIComponent(datasetVersion)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { entries: IndexEntry[] }) => setEntries(data.entries))
      .catch((err) => {
        if (err?.name !== "AbortError") setLoadError(true);
      });
    return () => ctrl.abort();
  }, [datasetVersion]);

  const by = useMemo(() => new Map((entries ?? []).map((e) => [e.s, e])), [entries]);
  const selected = place ? (by.get(place) ?? null) : null;
  const results = useMemo(() => (entries ? search(entries, q, filters) : []), [entries, q, filters]);
  const searching = q.trim().length > 0;
  const children = useMemo(() => (selected && entries ? childrenOf(selected.s, entries).filter((c) => filters.registry || c.r === 1 || searching) : []), [selected, entries, filters.registry, searching]);
  const childrenAll = useMemo(() => (selected && entries ? childrenOf(selected.s, entries) : []), [selected, entries]);

  /** What the list shows: children of the selected place, else matches, narrowed to the viewport when browsing. */
  const listed = useMemo(() => {
    if (selected && childrenAll.length && !searching) return children;
    if (searching || !bounds) return results;
    const [w, s, e, n] = bounds;
    const inView = results.filter((p) => p.x !== null && p.y !== null && p.x >= w && p.x <= e && p.y >= s && p.y <= n);
    return inView;
  }, [selected, childrenAll.length, children, searching, results, bounds]);

  /** Points on the map: every match; while drilling, the selected place and its descendants stand out by being the only ones. */
  const mapEntries = useMemo(() => {
    if (!entries) return [];
    if (selected && childrenAll.length && !searching) {
      const desc = descendantsOf(selected.s, entries);
      return [selected, ...desc];
    }
    if (searching) return results;
    // Browsing: show everything that passes the filters, registry names included, so the map is the whole catalog.
    return entries.filter((e) => search([e], "", { ...filters, registry: true }).length);
  }, [entries, selected, childrenAll.length, searching, results, filters]);

  const requestFit = useCallback((r: FitInput) => {
    fitId.current += 1;
    setFit({ ...r, id: fitId.current });
  }, []);

  const padding = useMemo(
    () => (desktop ? { top: 40, right: 40, bottom: 40, left: PANEL_W + 56 } : { top: 24, right: 24, bottom: Math.round(window.innerHeight * 0.42), left: 24 }),
    [desktop],
  );

  // Fit the map whenever the interesting set changes for a reason other than panning.
  const fitKey = `${q}|${JSON.stringify(filters)}|${place ?? ""}`;
  const lastFitKey = useRef<string | null>(null);
  useEffect(() => {
    if (!entries || !mapReady) return;
    if (lastFitKey.current === fitKey) return;
    const first = lastFitKey.current === null;
    lastFitKey.current = fitKey;
    if (first && userMoved.current && !place) return; // a pasted link with a map position wins on first paint
    if (selected) {
      if (childrenAll.length) {
        const b = boundsOf([selected, ...descendantsOf(selected.s, entries)]);
        if (b) requestFit({ kind: "bounds", bounds: b, maxZoom: 14.5 });
      } else if (selected.x !== null && selected.y !== null) {
        requestFit({ kind: "point", lng: selected.x, lat: selected.y, zoom: selected.l === "area" ? 13 : 14.5 });
      }
      return;
    }
    const b = boundsOf(results);
    if (b) requestFit({ kind: "bounds", bounds: b, maxZoom: searching ? 14 : 12.5 });
  }, [entries, mapReady, fitKey, selected, childrenAll.length, results, searching, place, requestFit]);

  // Keep the URL honest.
  useEffect(() => {
    const t = setTimeout(() => {
      const state: ExplorerState = { q, filters, place, map: view };
      window.history.replaceState(window.history.state, "", explorerHref(state));
    }, 250);
    return () => clearTimeout(t);
  }, [q, filters, place, view]);

  const select = useCallback(
    (slug: string | null) => {
      setPlace(slug);
      if (slug) {
        track("Explore", { action: "select" });
        if (!desktop) setSheet("half");
      }
    },
    [desktop],
  );

  const onMove = useCallback((v: MapView, b: Bounds, byUser: boolean) => {
    if (byUser) userMoved.current = true;
    setView(v);
    setBounds(b);
  }, []);

  const onReady = useCallback(() => {
    lastFitKey.current = null;
    setMapReady(true);
  }, []);

  const ancestors = selected ? pathOf(selected, by) : [];

  return (
    <div className={`explorer ${desktop ? "is-desktop" : "is-mobile"}`} data-sheet={desktop ? undefined : sheet}>
      <ExplorerMap
        entries={mapEntries}
        selected={place}
        hover={hover}
        initialView={initial.map}
        fit={fit}
        padding={padding}
        onSelect={select}
        onHover={setHover}
        onMove={onMove}
        onReady={onReady}
      />
      <ExplorerPanel
        loading={!entries && !loadError}
        error={loadError}
        q={q}
        onQuery={(v) => {
          setQ(v);
          if (v && place) setPlace(null);
        }}
        filters={filters}
        onFilters={(f) => {
          setFilters(f);
          track("Explore", { action: "filter" });
        }}
        selected={selected}
        ancestors={ancestors}
        childCount={childrenAll.length}
        listed={listed}
        total={results.length}
        searching={searching}
        browsingInView={!searching && !(selected && childrenAll.length) && Boolean(bounds)}
        hover={hover}
        onHover={setHover}
        onSelect={select}
        by={by}
        asOf={asOf}
        desktop={desktop}
        sheet={sheet}
        onSheet={setSheet}
        onShowAll={() => {
          setPlace(null);
          setQ("");
          setFilters({});
          requestFit({ kind: "bounds", bounds: [-82.78, 27.17, -82.25, 27.67], maxZoom: 12 });
        }}
      />
    </div>
  );
}
