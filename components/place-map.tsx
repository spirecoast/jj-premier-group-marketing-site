"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MapUnavailable } from "@/components/map-unavailable";
import { startMap, type MapStatus } from "@/components/map-runtime";
import { MAP_COLORS } from "@/lib/neighborhoods/map-style";
import { explorerHref } from "@/lib/neighborhoods/url";

export type PlacePoint = { slug: string; name: string; lng: number; lat: number; kind: "self" | "child" | "parent" };

/** The place, its children and its parent as one source and three layers. Called again after a style switch. */
function addPointLayers(m: MapLibreMap, points: PlacePoint[]) {
  if (m.getSource("pts")) return;
  const c = MAP_COLORS;
  const fc: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: points.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { name: p.name, kind: p.kind } })),
  };
  m.addSource("pts", { type: "geojson", data: fc });
  m.addLayer({
    id: "pts-context",
    type: "circle",
    source: "pts",
    filter: ["!=", ["get", "kind"], "self"],
    paint: {
      "circle-color": ["case", ["==", ["get", "kind"], "parent"], c.paper, c.navy],
      "circle-stroke-color": c.navy,
      "circle-stroke-width": ["case", ["==", ["get", "kind"], "parent"], 2, 1],
      "circle-radius": ["case", ["==", ["get", "kind"], "parent"], 7, 4],
      "circle-opacity": 0.85,
    },
  });
  m.addLayer({
    id: "pts-self",
    type: "circle",
    source: "pts",
    filter: ["==", ["get", "kind"], "self"],
    paint: { "circle-color": c.amber, "circle-radius": 8, "circle-stroke-color": c.white, "circle-stroke-width": 2.5 },
  });
  m.addLayer({
    id: "pts-labels",
    type: "symbol",
    source: "pts",
    filter: ["!=", ["get", "kind"], "self"],
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-offset": [0, 0.9], "text-anchor": "top", "text-optional": true, "text-max-width": 9 },
    paint: { "text-color": c.graphiteDark, "text-halo-color": c.paper, "text-halo-width": 1.3 },
  });
}

/**
 * The small map on a neighborhood page: the place in amber, its children and
 * its parent as context, zoomed to fit. Pans but does not scroll-zoom, so the
 * page keeps scrolling; the explorer link is the way in. If the map can't be
 * drawn, a quiet note takes its place and the rest of the page carries on.
 */
export function PlaceMap({ slug, points }: { slug: string; points: PlacePoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const self = points.find((p) => p.kind === "self");
  const [status, setStatus] = useState<MapStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!el.current || !self) return;
    const started = startMap(
      el.current,
      {
        center: [self.lng, self.lat],
        zoom: 13,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        touchPitch: false,
      },
      {
        onStyle: (m) => addPointLayers(m, points),
        onFirstLoad: (m) => {
          if (points.length > 1) {
            let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
            for (const p of points) {
              w = Math.min(w, p.lng); e = Math.max(e, p.lng); s = Math.min(s, p.lat); n = Math.max(n, p.lat);
            }
            m.fitBounds([w, s, e, n], { padding: 56, maxZoom: 14.5, duration: 0 });
          }
        },
        onStatus: setStatus,
      },
    );
    if (!started) return;
    const m = started.map;
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.touchZoomRotate.disableRotation();
    return () => started.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, attempt]);

  if (!self) return null;
  return (
    <div className="explorer-hero-map">
      <div key={attempt} ref={el} style={{ position: "absolute", inset: 0 }} role="img" aria-label={`Map of ${self.name}`} />
      {status === "failed" ? (
        <MapUnavailable
          message="The map didn't load. Everything else on this page is here."
          onRetry={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
        />
      ) : null}
      <Link href={explorerHref({ place: slug })} className="btn btn-navy !min-h-10 !px-4 !text-[11px] absolute bottom-4 left-4 z-10">
        Open in the explorer
        <span className="btn-dash" aria-hidden="true" />
      </Link>
    </div>
  );
}
