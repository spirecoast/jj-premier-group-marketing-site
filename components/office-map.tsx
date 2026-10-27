"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { MapUnavailable } from "@/components/map-unavailable";
import { startMap, type MapStatus } from "@/components/map-runtime";
import { MAP_COLORS } from "@/lib/neighborhoods/map-style";
import "@/components/explorer/explorer.css";

export type OfficeMapProps = {
  /** Where the marker sits. */
  center: { lat: number; lng: number };
  /** The marker's label, under it: the brokerage's name. */
  label: string;
  /** What the marker stands for, for the region's name. */
  place: string;
};

/** One marker and its label. Called again after a provider switch. */
function addMarker(m: MapLibreMap, p: OfficeMapProps) {
  if (m.getSource("office")) return;
  const c = MAP_COLORS;
  m.addSource("office", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [p.center.lng, p.center.lat] }, properties: { name: p.label } }] },
  });
  m.addLayer({ id: "office-halo", type: "circle", source: "office", paint: { "circle-color": c.navy, "circle-opacity": 0.16, "circle-radius": 18 } });
  m.addLayer({ id: "office-pin", type: "circle", source: "office", paint: { "circle-color": c.navy, "circle-radius": 8, "circle-stroke-color": c.white, "circle-stroke-width": 2.5 } });
  m.addLayer({
    id: "office-label",
    type: "symbol",
    source: "office",
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 12, "text-offset": [0, 1.2], "text-anchor": "top", "text-max-width": 12 },
    paint: { "text-color": c.graphiteDark, "text-halo-color": c.paper, "text-halo-width": 1.3 },
  });
}

/**
 * The map on /contact, in the brand's own style (lib/neighborhoods/map-style.ts):
 * one navy marker at the office, zoom 12, the plus and minus the Atlas map
 * uses and nothing else. It never takes the page's scroll (no wheel zoom; on
 * a phone one finger scrolls the page and two move the map). If the map
 * can't be drawn, a quiet note takes its place and the "Open in Google Maps"
 * link under the frame still gives directions. Loaded on demand by
 * OfficeMapIsland, so MapLibre comes with this chunk and not with the page.
 */
export function OfficeMap(props: OfficeMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const { center, label, place } = props;

  useEffect(() => {
    if (!el.current) return;
    const started = startMap(
      el.current,
      {
        center: [center.lng, center.lat],
        zoom: 12,
        minZoom: 8,
        maxZoom: 16,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        touchPitch: false,
        cooperativeGestures: true,
      },
      { onStyle: (m) => addMarker(m, { center, label, place }), onStatus: setStatus },
    );
    if (!started) return;
    const m = started.map;
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.touchZoomRotate.disableRotation();
    return () => started.dispose();
  }, [center, label, place, attempt]);

  return (
    <>
      <div key={attempt} ref={el} style={{ position: "absolute", inset: 0 }} role="region" aria-label={`Map of ${place}`} />
      {status === "failed" ? (
        <MapUnavailable
          message="The map didn't load. The link under it opens the same place in Google Maps."
          onRetry={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
        />
      ) : null}
    </>
  );
}
