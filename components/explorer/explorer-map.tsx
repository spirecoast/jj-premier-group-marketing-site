"use client";

import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAPLIBRE_WORKER_URL } from "@/lib/neighborhoods/map-style";
import { useEffect, useRef } from "react";
import { MAP_COLORS, buildMapStyle } from "@/lib/neighborhoods/map-style";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import type { MapView } from "@/lib/neighborhoods/url";

export type Bounds = [west: number, south: number, east: number, north: number];

/** A one-shot instruction from the explorer: fit these bounds, or fly to a point. */
export type FitRequest =
  | { id: number; kind: "bounds"; bounds: Bounds; maxZoom?: number }
  | { id: number; kind: "point"; lng: number; lat: number; zoom?: number };

type Props = {
  entries: IndexEntry[];
  selected: string | null;
  hover: string | null;
  initialView: MapView | null;
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
 * The map itself. MapLibre with the brand style; every place is a point in
 * a GeoJSON source, drawn as rings for areas and dots for the rest, with
 * labels that appear as you zoom. Selection and hover are layer filters, so
 * nothing re-renders but the map.
 */
export function ExplorerMap({ entries, selected, hover, initialView, fit, padding, onSelect, onHover, onMove, onReady }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const lastFit = useRef<number>(-1);
  const pulse = useRef<number | null>(null);
  const cb = useRef({ onSelect, onHover, onMove, onReady });
  cb.current = { onSelect, onHover, onMove, onReady };
  // The index can arrive before the map finishes loading; the load handler reads the latest props.
  const latest = useRef({ entries, selected, hover });
  latest.current = { entries, selected, hover };

  useEffect(() => {
    if (!container.current || map.current) return;
    maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
    const m = new maplibregl.Map({
      container: container.current,
      style: buildMapStyle(),
      center: initialView ? [initialView.lng, initialView.lat] : [-82.5, 27.42],
      zoom: initialView ? initialView.zoom : 10,
      minZoom: 8,
      maxZoom: 17.5,
      attributionControl: false,
      maxBounds: [-83.6, 26.4, -81.4, 28.4],
      fadeDuration: 150,
    });
    map.current = m;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __jjmap?: MapLibreMap }).__jjmap = m;
      m.on("error", (e) => console.warn("[map]", e.error?.message ?? e));
    }
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: false }, fitBoundsOptions: { maxZoom: 13 }, showUserLocation: true }),
      "top-right",
    );
    m.touchPitch.disable();
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();

    m.on("load", () => {
      const c = MAP_COLORS;
      m.addSource(SOURCE, { type: "geojson", data: toGeoJson(latest.current.entries) });
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

      const pick = (e: MapMouseEvent): string | null => {
        const f = m.queryRenderedFeatures(e.point, { layers: ["place-areas", "place-dots"] })[0];
        return (f?.properties?.slug as string | undefined) ?? null;
      };
      m.on("click", (e: MapMouseEvent) => {
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
      m.setFilter("place-selected", ["==", ["get", "slug"], latest.current.selected ?? ""]);
      m.setFilter("place-selected-pulse", ["==", ["get", "slug"], latest.current.selected ?? ""]);
      m.setFilter("place-hover", ["==", ["get", "slug"], latest.current.hover ?? ""]);
      ready.current = true;
      emit(false);
      cb.current.onReady();
    });

    return () => {
      if (pulse.current) cancelAnimationFrame(pulse.current);
      m.remove();
      map.current = null;
      ready.current = false;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const src = m.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
    src?.setData(toGeoJson(entries));
  }, [entries]);

  // Selection: filter + a soft pulse.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const f: maplibregl.FilterSpecification = ["==", ["get", "slug"], selected ?? ""];
    m.setFilter("place-selected", f);
    m.setFilter("place-selected-pulse", f);
    if (pulse.current) cancelAnimationFrame(pulse.current);
    if (!selected) return;
    const start = performance.now();
    const tick = (t: number) => {
      const k = ((t - start) % 2400) / 2400;
      m.setPaintProperty("place-selected-pulse", "circle-radius", 10 + k * 18);
      m.setPaintProperty("place-selected-pulse", "circle-opacity", 0.35 * (1 - k));
      pulse.current = requestAnimationFrame(tick);
    };
    pulse.current = requestAnimationFrame(tick);
    return () => {
      if (pulse.current) cancelAnimationFrame(pulse.current);
    };
  }, [selected]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    m.setFilter("place-hover", ["==", ["get", "slug"], hover ?? ""]);
  }, [hover]);

  // Fit / fly requests
  useEffect(() => {
    const m = map.current;
    if (!m || !fit || fit.id === lastFit.current) return;
    const run = () => {
      lastFit.current = fit.id;
      if (fit.kind === "bounds") {
        const b = fit.bounds;
        const same = b[0] === b[2] && b[1] === b[3];
        if (same) m.flyTo({ center: [b[0], b[1]], zoom: Math.max(m.getZoom(), fit.maxZoom ?? 14), padding, duration: 900, essential: true });
        else m.fitBounds(b as LngLatBoundsLike, { padding, maxZoom: fit.maxZoom ?? 15, duration: 900, essential: true });
      } else {
        m.flyTo({ center: [fit.lng, fit.lat], zoom: fit.zoom ?? Math.max(m.getZoom(), 14), padding, duration: 900, essential: true });
      }
    };
    if (ready.current) run();
    else m.once("load", run);
  }, [fit, padding]);

  // MapLibre's own stylesheet sets `position: relative` on the container, which would beat a layered
  // class, so the sizing is inline: the wrapper fills the explorer, the container fills the wrapper.
  return (
    <div className="explorer-map" role="region" aria-label="Map of neighborhoods">
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

export const HOME_BOUNDS = HOME;
