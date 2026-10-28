"use client";

import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { MapUnavailable } from "@/components/map-unavailable";
import { startMap, type MapStatus } from "@/components/map-runtime";
import type { Bounds } from "@/lib/neighborhoods/bounds";
import { MAP_COLORS } from "@/lib/neighborhoods/map-style";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import type { MapView } from "@/lib/neighborhoods/url";
import { easeBrand } from "@/lib/motion/number";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import "./explorer.css";

export type { Bounds } from "@/lib/neighborhoods/bounds";

/** A one-shot instruction from the explorer: fit these bounds, or fly to a point. `duration` 0 jumps; unset flies. */
export type FitRequest =
  | { id: number; kind: "bounds"; bounds: Bounds; maxZoom?: number; duration?: number }
  | { id: number; kind: "point"; lng: number; lat: number; zoom?: number; duration?: number };

export type ExplorerMapProps = {
  entries: IndexEntry[];
  selected: string | null;
  hover: string | null;
  initialView: MapView | null;
  /** The view to open on when there is no `initialView`: the catalog's box, worked out on the server. */
  initialBounds: Bounds | null;
  fit: FitRequest | null;
  /** Screen padding so the panel or sheet never covers the fitted points. */
  padding: { top: number; right: number; bottom: number; left: number };
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  onMove: (view: MapView, bounds: Bounds, byUser: boolean) => void;
  onReady: () => void;
};

const SOURCE = "places";
const LEVEL_NUM = { area: 0, community: 1, enclave: 2 } as const;
const HOME: Bounds = [-82.78, 27.17, -82.25, 27.67];
const FLY_MS = 900;
const DESKTOP = "(min-width: 1024px)";

function toGeoJson(entries: IndexEntry[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: entries
      .filter((e) => e.x !== null && e.y !== null)
      .map((e) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.x!, e.y!] },
        properties: { slug: e.s, name: e.n, level: LEVEL_NUM[e.l], registry: e.r ? 0 : 1 },
      })),
  };
}

/**
 * The app's own source and layers: rings for areas, dots for the rest, the
 * hover and selection marks, and labels by zoom. Called on every style load,
 * so a switch to the fallback provider gets them back with the current data
 * and selection.
 */
function addPlaceLayers(m: MapLibreMap, state: { entries: IndexEntry[]; selected: string | null; hover: string | null }) {
  if (m.getSource(SOURCE)) return;
  const c = MAP_COLORS;
  m.addSource(SOURCE, { type: "geojson", data: toGeoJson(state.entries) });
  // Dots: communities and enclaves. Registry-only names are lighter and smaller.
  m.addLayer({
    id: "place-dots",
    type: "circle",
    source: SOURCE,
    filter: [">", ["get", "level"], 0],
    paint: {
      "circle-color": c.navy,
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        9, ["case", ["==", ["get", "registry"], 1], 1.2, 2],
        12, ["case", ["==", ["get", "registry"], 1], 2.2, 3.5],
        15, ["case", ["==", ["get", "level"], 2], 4.5, 6],
      ],
      "circle-opacity": ["case", ["==", ["get", "registry"], 1], 0.45, 0.9],
      "circle-stroke-color": c.white,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 0, 13, 1],
    },
  });
  // Rings: areas.
  m.addLayer({
    id: "place-areas",
    type: "circle",
    source: SOURCE,
    filter: ["==", ["get", "level"], 0],
    paint: {
      "circle-color": c.paper,
      "circle-opacity": 0.9,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.5, 12, 7, 15, 10],
      "circle-stroke-color": c.navy,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 14, 2.5],
    },
  });
  // The hover pulse: a ring that grows out of the hovered place once (hoverPulse below) and fades. Still until then.
  m.addLayer({
    id: "place-hover-pulse",
    type: "circle",
    source: SOURCE,
    filter: ["==", ["get", "slug"], ""],
    paint: { "circle-color": c.sky, "circle-radius": 0, "circle-opacity": 0 },
  });
  m.addLayer({
    id: "place-hover",
    type: "circle",
    source: SOURCE,
    filter: ["==", ["get", "slug"], ""],
    paint: { "circle-color": c.sky, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 6, 15, 11], "circle-opacity": 0.35 },
  });
  m.addLayer({
    id: "place-selected-pulse",
    type: "circle",
    source: SOURCE,
    filter: ["==", ["get", "slug"], ""],
    paint: { "circle-color": c.amber, "circle-radius": 14, "circle-opacity": 0.25 },
  });
  m.addLayer({
    id: "place-selected",
    type: "circle",
    source: SOURCE,
    filter: ["==", ["get", "slug"], ""],
    paint: { "circle-color": c.amber, "circle-radius": 7, "circle-stroke-color": c.white, "circle-stroke-width": 2.5 },
  });
  m.addLayer({
    id: "place-labels-area",
    type: "symbol",
    source: SOURCE,
    minzoom: 9.5,
    filter: ["==", ["get", "level"], 0],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Bold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 9.5, 10, 14, 13],
      "text-letter-spacing": 0.1,
      "text-transform": "uppercase",
      "text-offset": [0, 1.1],
      "text-anchor": "top",
      "text-max-width": 8,
      "text-optional": true,
    },
    paint: { "text-color": c.navy, "text-halo-color": c.paper, "text-halo-width": 1.6 },
  });
  m.addLayer({
    id: "place-labels-community",
    type: "symbol",
    source: SOURCE,
    minzoom: 12.5,
    filter: ["all", ["==", ["get", "level"], 1], ["==", ["get", "registry"], 0]],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 12.5, 10.5, 16, 13],
      "text-offset": [0, 0.9],
      "text-anchor": "top",
      "text-max-width": 9,
      "text-optional": true,
    },
    paint: { "text-color": c.graphiteDark, "text-halo-color": c.paper, "text-halo-width": 1.4 },
  });
  m.addLayer({
    id: "place-labels-rest",
    type: "symbol",
    source: SOURCE,
    minzoom: 14.5,
    filter: ["any", ["==", ["get", "level"], 2], ["all", ["==", ["get", "level"], 1], ["==", ["get", "registry"], 1]]],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 11,
      "text-offset": [0, 0.8],
      "text-anchor": "top",
      "text-max-width": 9,
      "text-optional": true,
    },
    paint: { "text-color": c.graphite, "text-halo-color": c.paper, "text-halo-width": 1.2, "text-opacity": 0.85 },
  });
  m.setFilter("place-selected", ["==", ["get", "slug"], state.selected ?? ""]);
  m.setFilter("place-selected-pulse", ["==", ["get", "slug"], state.selected ?? ""]);
  m.setFilter("place-hover", ["==", ["get", "slug"], state.hover ?? ""]);
  m.setFilter("place-hover-pulse", ["==", ["get", "slug"], state.hover ?? ""]);
}

/** The hover disc's radius at this zoom (the place-hover layer's own ramp), so the pulse starts from its edge. */
function hoverRadius(zoom: number): number {
  const k = Math.min(1, Math.max(0, (zoom - 9) / 6));
  return 6 + k * 5;
}

/**
 * The map itself. MapLibre with the brand style; every place is a point in
 * a GeoJSON source, drawn as rings for areas and dots for the rest, with
 * labels that appear as you zoom. Selection and hover are layer filters, so
 * nothing re-renders but the map. It opens on its final view (the bounds the
 * server worked out) so the first tiles are the only tiles; later moves fly
 * for 900 ms, or jump for a visitor who asked for reduced motion.
 */
export function ExplorerMap({ entries, selected, hover, initialView, initialBounds, fit, padding, onSelect, onHover, onMove, onReady }: ExplorerMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  /** The first load has happened and the interactions are bound. */
  const ready = useRef(false);
  /** The app's source and layers are on the current style (false for a moment during a provider switch). */
  const layers = useRef(false);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const lastFit = useRef<number>(-1);
  const pulse = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const cb = useRef({ onSelect, onHover, onMove, onReady });
  cb.current = { onSelect, onHover, onMove, onReady };
  // The index can arrive before the map finishes loading; the load handler reads the latest props.
  const latest = useRef({ entries, selected, hover, padding, reduced });
  latest.current = { entries, selected, hover, padding, reduced };

  useEffect(() => {
    if (!container.current || map.current) return;
    ready.current = false;
    layers.current = false;
    const opening = initialView
      ? { center: [initialView.lng, initialView.lat] as [number, number], zoom: initialView.zoom }
      : initialBounds
        ? { bounds: initialBounds as LngLatBoundsLike, fitBoundsOptions: { padding: latest.current.padding, maxZoom: 12.5 } }
        : { center: [-82.5, 27.42] as [number, number], zoom: 10 };
    const started = startMap(
      container.current,
      {
        ...opening,
        minZoom: 8,
        maxZoom: 17.5,
        attributionControl: false,
        maxBounds: [-83.6, 26.4, -81.4, 28.4],
        fadeDuration: 150,
      },
      {
        // Runs on the first style and again after a switch to the fallback provider.
        onStyle: (m) => {
          addPlaceLayers(m, latest.current);
          layers.current = true;
        },
        onStyleGone: () => {
          layers.current = false;
        },
        onFirstLoad: (m) => bindInteractions(m),
        onStatus: setStatus,
      },
    );
    if (!started) return;
    const m = started.map;
    map.current = m;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __jjmap?: MapLibreMap }).__jjmap = m;
    // Controls: bottom-right on desktop (the panel is on the left); top-right on a phone, above the sheet.
    const corner = window.matchMedia(DESKTOP).matches ? "bottom-right" : "top-right";
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), corner);
    m.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: false }, fitBoundsOptions: { maxZoom: 13 }, showUserLocation: true }),
      corner,
    );
    m.touchPitch.disable();
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();

    /** Clicks, hover and moves: bound once, on the first load. They read the layers by id, so a style switch doesn't unbind them. */
    function bindInteractions(m: MapLibreMap) {
      const pick = (e: MapMouseEvent): string | null => {
        if (!layers.current) return null;
        const f = m.queryRenderedFeatures(e.point, { layers: ["place-areas", "place-dots"] })[0];
        return (f?.properties?.slug as string | undefined) ?? null;
      };
      m.on("click", (e: MapMouseEvent) => {
        if (!layers.current) return;
        const box: [maplibregl.PointLike, maplibregl.PointLike] = [
          [e.point.x - 8, e.point.y - 8],
          [e.point.x + 8, e.point.y + 8],
        ];
        const f = m.queryRenderedFeatures(box, { layers: ["place-areas", "place-dots"] })[0];
        cb.current.onSelect((f?.properties?.slug as string | undefined) ?? null);
      });
      m.on("mousemove", (e: MapMouseEvent) => {
        const slug = pick(e);
        m.getCanvas().style.cursor = slug ? "pointer" : "";
        cb.current.onHover(slug);
      });
      m.on("mouseout", () => cb.current.onHover(null));
      const emit = (byUser: boolean) => {
        const b = m.getBounds();
        const cen = m.getCenter();
        cb.current.onMove({ zoom: m.getZoom(), lat: cen.lat, lng: cen.lng }, [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], byUser);
      };
      let userGesture = false;
      m.on("movestart", (e) => {
        userGesture = Boolean((e as { originalEvent?: Event }).originalEvent);
      });
      m.on("moveend", () => emit(userGesture));
      ready.current = true;
      emit(false);
      cb.current.onReady();
    }

    return () => {
      if (pulse.current) cancelAnimationFrame(pulse.current);
      started.dispose();
      map.current = null;
      ready.current = false;
      layers.current = false;
    };
    // The map is created once per attempt; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Data
  useEffect(() => {
    const m = map.current;
    if (!m || !layers.current) return;
    const src = m.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
    src?.setData(toGeoJson(entries));
  }, [entries]);

  // Selection: filter + a soft pulse (a still ring for reduced motion).
  useEffect(() => {
    const m = map.current;
    if (!m || !layers.current) return;
    const f: maplibregl.FilterSpecification = ["==", ["get", "slug"], selected ?? ""];
    m.setFilter("place-selected", f);
    m.setFilter("place-selected-pulse", f);
    if (pulse.current) cancelAnimationFrame(pulse.current);
    if (!selected) return;
    if (reduced) {
      m.setPaintProperty("place-selected-pulse", "circle-radius", 16);
      m.setPaintProperty("place-selected-pulse", "circle-opacity", 0.2);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const k = ((t - start) % 2400) / 2400;
      // Mid-switch the layer is briefly gone; keep the clock running and pick it back up.
      if (layers.current) m.setPaintProperty("place-selected-pulse", "circle-radius", 10 + k * 18);
      if (layers.current) m.setPaintProperty("place-selected-pulse", "circle-opacity", 0.35 * (1 - k));
      pulse.current = requestAnimationFrame(tick);
    };
    pulse.current = requestAnimationFrame(tick);
    return () => {
      if (pulse.current) cancelAnimationFrame(pulse.current);
    };
  }, [selected, reduced]);

  // Hover: the still disc, and once, a ring that grows from it to 1.6× and fades over 600 ms on the brand
  // curve, so a row under the pointer finds its place on the map (the row itself raises through .is-hover
  // when the pointer is on the marker). No ring for a visitor who asked for reduced motion.
  useEffect(() => {
    const m = map.current;
    if (!m || !layers.current) return;
    const f: maplibregl.FilterSpecification = ["==", ["get", "slug"], hover ?? ""];
    m.setFilter("place-hover", f);
    m.setFilter("place-hover-pulse", f);
    if (!hover || reduced) {
      m.setPaintProperty("place-hover-pulse", "circle-opacity", 0);
      return;
    }
    const r0 = hoverRadius(m.getZoom());
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 600);
      const e = easeBrand(k);
      if (layers.current) {
        m.setPaintProperty("place-hover-pulse", "circle-radius", r0 * (1 + 0.6 * e));
        m.setPaintProperty("place-hover-pulse", "circle-opacity", 0.4 * (1 - e));
      }
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover, reduced]);

  // Fit / fly requests. A visitor who asked for reduced motion gets the same view without the flight.
  useEffect(() => {
    const m = map.current;
    if (!m || !fit || fit.id === lastFit.current) return;
    const run = () => {
      lastFit.current = fit.id;
      const duration = latest.current.reduced ? 0 : (fit.duration ?? FLY_MS);
      if (fit.kind === "bounds") {
        const b = fit.bounds;
        const same = b[0] === b[2] && b[1] === b[3];
        if (same) m.flyTo({ center: [b[0], b[1]], zoom: Math.max(m.getZoom(), fit.maxZoom ?? 14), padding, duration });
        else m.fitBounds(b as LngLatBoundsLike, { padding, maxZoom: fit.maxZoom ?? 15, duration });
      } else {
        m.flyTo({ center: [fit.lng, fit.lat], zoom: fit.zoom ?? Math.max(m.getZoom(), 14), padding, duration });
      }
    };
    if (ready.current) run();
    else m.once("load", run);
  }, [fit, padding]);

  // MapLibre's own stylesheet sets `position: relative` on the container, which would beat a layered
  // class, so the sizing is inline: the wrapper fills the explorer, the container fills the wrapper.
  return (
    <div className="explorer-map" role="region" aria-label="Map of neighborhoods">
      {/* A fresh container per attempt: a map that failed to start can leave half its DOM behind. */}
      <div key={attempt} ref={container} style={{ position: "absolute", inset: 0 }} />
      {status === "failed" ? (
        <MapUnavailable
          message="The map didn't load. The list still works."
          onRetry={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}

export const HOME_BOUNDS = HOME;
