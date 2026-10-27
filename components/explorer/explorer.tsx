"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MapUnavailable } from "@/components/map-unavailable";
import { track } from "@/lib/analytics";
import type { Bounds, DefaultBounds } from "@/lib/neighborhoods/bounds";
import { boundsOf } from "@/lib/neighborhoods/bounds";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { childrenOf, descendantsOf, pathOf, search, type Filters } from "@/lib/neighborhoods/search";
import { EXPLORER_KEYS, explorerAddress, explorerHref, parseState, type ExplorerState, type MapView } from "@/lib/neighborhoods/url";
import { withRetry } from "@/lib/retry";
import { useJsonResource } from "@/lib/use-json-resource";
import { hasAny, replaceQuery, sessionMemory, useUrlInitial } from "@/lib/url-state";
import type { ExplorerMapProps, FitRequest } from "./explorer-map";
import { ExplorerPanel, type SheetPosition } from "./explorer-panel";
import "./explorer.css";

/**
 * The map's code (MapLibre and all) loads as its own chunk. A chunk can fail on
 * a dropped connection or a deploy mid-visit, so it gets two more tries with a
 * short pause. If it still doesn't arrive, the map area says so and the list
 * carries on; "Try again" reloads the page, which keeps the state in the URL.
 */
const ExplorerMap = dynamic(
  () =>
    withRetry(() => import("./explorer-map"), { retries: 2, baseDelayMs: 600 })
      .then((m) => m.ExplorerMap)
      .catch((err: unknown) => {
        console.warn(`[atlas map] the map's code didn't load: ${err instanceof Error ? err.message : String(err)}`);
        return MapCodeMissing;
      }),
  {
    ssr: false,
    loading: () => <MapPending />,
  },
);

function MapPending() {
  return <div className="explorer-map explorer-map-loading" aria-hidden="true" />;
}

function MapCodeMissing(_: ExplorerMapProps) {
  return (
    <div className="explorer-map" role="region" aria-label="Map of neighborhoods">
      <MapUnavailable message="The map didn't load. The list still works." onRetry={() => window.location.reload()} />
    </div>
  );
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type FitInput = DistributiveOmit<FitRequest, "id">;

const PANEL_W = 400;
const DESKTOP = "(min-width: 1024px)";
/** How long after the last keystroke the map follows the list. */
const MAP_SETTLE_MS = 350;
/** The sheet's stops as the share of the explorer's height they cover. */
const SHEET_SHARE: Record<SheetPosition, number> = { peek: 0.42, half: 0.64, full: 0.64 };

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * True at desktop widths. False on the server and for the first client
 * render: nothing in the markup depends on it (CSS owns the layout), only
 * the map's padding and how the sheet behaves.
 */
function useDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

/** A value that follows `value` once it has held still for `ms`. */
function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(settled, value)) return;
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms, settled]);
  return settled;
}

/**
 * The neighborhood explorer: one state (query, filters, selected place, map
 * view) that the URL, the map and the panel all reflect. The index arrives
 * once from /api/neighborhoods/index and everything after is in memory.
 */
export function Explorer({ initial, datasetVersion, asOf, defaults }: { initial: ExplorerState; datasetVersion: string; asOf: string; defaults: DefaultBounds }) {
  const index = useJsonResource<{ entries: IndexEntry[] }>(`/api/neighborhoods/index?v=${encodeURIComponent(datasetVersion)}`);
  const entries = index.data?.entries ?? null;
  const loadError = index.error;
  const retryLoad = index.retry;
  const [q, setQ] = useState(initial.q);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [place, setPlace] = useState<string | null>(initial.place);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<MapView | null>(initial.map);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [fit, setFit] = useState<FitRequest | null>(null);
  const [sheet, setSheet] = useState<SheetPosition>(initial.place ? "half" : "peek");
  const desktop = useDesktop();
  const fitId = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const userMoved = useRef(Boolean(initial.map));
  const root = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // The explorer's own height, for the sheet's stops and the map's padding (never the window's, which includes the header).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => setHeight(el.clientHeight);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The map starts after the first paint on a phone, so the list is usable before MapLibre's code and tiles are asked for.
  const [mapWanted, setMapWanted] = useState(false);
  useEffect(() => {
    const go = () => setMapWanted(true);
    if (window.matchMedia(DESKTOP).matches) {
      const id = requestAnimationFrame(go);
      return () => cancelAnimationFrame(id);
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 300);
    return () => clearTimeout(t);
  }, []);

  const by = useMemo(() => new Map((entries ?? []).map((e) => [e.s, e])), [entries]);
  const selected = place ? (by.get(place) ?? null) : null;
  const results = useMemo(() => (entries ? search(entries, q, filters) : []), [entries, q, filters]);
  const searching = q.trim().length > 0;
  const children = useMemo(() => (selected && entries ? childrenOf(selected.s, entries).filter((c) => filters.registry || c.r === 1 || searching) : []), [selected, entries, filters.registry, searching]);
  const childrenAll = useMemo(() => (selected && entries ? childrenOf(selected.s, entries) : []), [selected, entries]);

  // The list follows every keystroke; the map follows once typing stops.
  const mapQ = useSettled(q, MAP_SETTLE_MS);
  const mapSearching = mapQ.trim().length > 0;
  const mapResults = useMemo(() => (mapQ === q ? results : entries ? search(entries, mapQ, filters) : []), [entries, mapQ, q, results, filters]);

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
    if (selected && childrenAll.length && !mapSearching) {
      const desc = descendantsOf(selected.s, entries);
      return [selected, ...desc];
    }
    if (mapSearching) return mapResults;
    // Browsing: show everything that passes the filters, registry names included, so the map is the whole catalog.
    return search(entries, "", { ...filters, registry: true });
  }, [entries, selected, childrenAll.length, mapSearching, mapResults, filters]);

  const requestFit = useCallback((r: FitInput) => {
    fitId.current += 1;
    setFit({ ...r, id: fitId.current });
  }, []);

  const padding = useMemo(() => {
    if (desktop) return { top: 40, right: 40, bottom: 40, left: PANEL_W + 56 };
    const h = height || 640;
    return { top: 24, right: 24, bottom: Math.min(Math.round(h * SHEET_SHARE[sheet]), h - 180), left: 24 };
  }, [desktop, height, sheet]);

  /** The view the server already gave the map: the whole catalog, or one market. Only for a plain opening, never for a search or a place. */
  const plainOpening = !initial.place && !initial.q && !initial.map && !initial.filters.level && !initial.filters.type && !initial.filters.status && !initial.filters.gated;
  const initialBounds = plainOpening ? ((initial.filters.market ? defaults.byMarket[initial.filters.market] : defaults.all) ?? null) : null;

  // Fit the map whenever the interesting set changes for a reason other than panning.
  const fitKey = `${mapQ}|${JSON.stringify(filters)}|${place ?? ""}`;
  const lastFitKey = useRef<string | null>(null);
  useEffect(() => {
    if (!entries || !mapReady) return;
    if (lastFitKey.current === fitKey) return;
    const first = lastFitKey.current === null;
    lastFitKey.current = fitKey;
    if (first && userMoved.current && !place) return; // a pasted link with a map position wins on first paint
    if (first && initialBounds) return; // the map opened on this view already
    // The first view and a view that follows typing jump; a choice (a place, a filter, "Show everything") flies.
    const duration = first || mapSearching ? 0 : undefined;
    if (selected) {
      if (childrenAll.length) {
        const b = boundsOf([selected, ...descendantsOf(selected.s, entries)]);
        if (b) requestFit({ kind: "bounds", bounds: b, maxZoom: 14.5, duration });
      } else if (selected.x !== null && selected.y !== null) {
        requestFit({ kind: "point", lng: selected.x, lat: selected.y, zoom: selected.l === "area" ? 13 : 14.5, duration });
      }
      return;
    }
    const b = boundsOf(mapResults);
    if (b) requestFit({ kind: "bounds", bounds: b, maxZoom: mapSearching ? 14 : 12.5, duration });
  }, [entries, mapReady, fitKey, selected, childrenAll.length, mapResults, mapSearching, place, requestFit, initialBounds]);

  // The address follows the committed choices (filters, the selected place), once per change.
  // The search words and the map's position stay in this tab (lib/url-state.ts), so Back to
  // this page brings them back without a history write per keystroke or pan.
  const firstUrl = useRef(true);
  useEffect(() => {
    if (firstUrl.current) {
      firstUrl.current = false;
      return;
    }
    replaceQuery(explorerAddress({ filters, place }));
  }, [filters, place]);
  useEffect(() => {
    const t = setTimeout(() => sessionMemory.write(MEMORY, { q, map: view }), 300);
    return () => clearTimeout(t);
  }, [q, view, filters, place]);
  const shareUrl = explorerHref({ q, filters, place, map: view });

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
    <div ref={root} className="explorer" data-sheet={sheet} data-url-island="">
      {/* Atlas's survey frame: ticks along the top and right of the map, as on a printed sheet. */}
      <span className="atlas-frame atlas-frame-top" aria-hidden="true" />
      <span className="atlas-frame atlas-frame-right" aria-hidden="true" />
      {mapWanted ? (
        <ExplorerMap
          entries={mapEntries}
          selected={place}
          hover={hover}
          initialView={initial.map}
          initialBounds={initialBounds}
          fit={fit}
          padding={padding}
          onSelect={select}
          onHover={setHover}
          onMove={onMove}
          onReady={onReady}
        />
      ) : (
        <MapPending />
      )}
      <ExplorerPanel
        loading={!entries && !loadError}
        error={loadError}
        onRetry={retryLoad}
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
        shareUrl={shareUrl}
        desktop={desktop}
        sheet={sheet}
        onSheet={setSheet}
        height={height}
        onShowAll={() => {
          setPlace(null);
          setQ("");
          setFilters({});
          requestFit({ kind: "bounds", bounds: defaults.all ?? [-82.78, 27.17, -82.25, 27.67], maxZoom: 12 });
        }}
      />
    </div>
  );
}

const MEMORY = "atlas";
type Memory = { q: string; map: MapView | null };

/** A link's view, plus what this tab remembers for this address (the search words and the map). Null when there is neither. */
function viewFromUrl(sp: URLSearchParams): ExplorerState | null {
  const mem = sessionMemory.read<Memory>(MEMORY);
  if (!hasAny(sp, EXPLORER_KEYS) && !mem) return null;
  const s = parseState(sp);
  return { ...s, q: s.q || (typeof mem?.q === "string" ? mem.q.slice(0, 80) : ""), map: s.map ?? mem?.map ?? null };
}

const DEFAULT_VIEW: ExplorerState = { q: "", filters: {}, place: null, map: null };

/**
 * The explorer as the static page serves it: the default view on the server,
 * then the view the address asks for, read once in the browser. `defaults`
 * are the opening map views the server computed from the catalog.
 */
export function ExplorerIsland({ datasetVersion, asOf, defaults }: { datasetVersion: string; asOf: string; defaults: DefaultBounds }) {
  const { initial, key } = useUrlInitial(viewFromUrl, DEFAULT_VIEW);
  return <Explorer key={key} initial={initial} datasetVersion={datasetVersion} asOf={asOf} defaults={defaults} />;
}
