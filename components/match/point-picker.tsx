"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { MAP_COLORS, MAPLIBRE_WORKER_URL, buildMapStyle } from "@/lib/neighborhoods/map-style";

const HOME: [number, number, number, number] = [-82.78, 27.17, -82.25, 27.67];

/**
 * A small map the reader taps to drop a point. No geocoding: the point is
 * wherever they tap, and the explorer's own base style keeps it in the brand.
 */
export function PointPicker({ point, onPoint }: { point: { lat: number; lng: number } | null; onPoint: (p: { lat: number; lng: number }) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const handler = useRef(onPoint);
  handler.current = onPoint;

  useEffect(() => {
    if (!el.current) return;
    maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
    const m = new maplibregl.Map({
      container: el.current,
      style: buildMapStyle(),
      bounds: HOME,
      fitBoundsOptions: { padding: 12 },
      minZoom: 8,
      maxZoom: 16,
      attributionControl: false,
      scrollZoom: false,
      dragRotate: false,
      touchPitch: false,
    });
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.touchZoomRotate.disableRotation();
    m.getCanvas().style.cursor = "crosshair";
    m.on("click", (e) => handler.current({ lat: Number(e.lngLat.lat.toFixed(4)), lng: Number(e.lngLat.lng.toFixed(4)) }));
    map.current = m;
    return () => {
      marker.current?.remove();
      marker.current = null;
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!point) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText = `display:block;width:18px;height:18px;border-radius:50%;background:${MAP_COLORS.amber};border:3px solid #fff;box-shadow:0 0 0 1px ${MAP_COLORS.navy}`;
      marker.current = new maplibregl.Marker({ element: dot }).setLngLat([point.lng, point.lat]).addTo(m);
    } else marker.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  return <div ref={el} className="match-map" role="application" aria-label="Map. Tap to choose a point." />;
}
