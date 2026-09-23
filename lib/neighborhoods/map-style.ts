import type { StyleSpecification } from "maplibre-gl";

/**
 * The explorer's base map, drawn in the brand rather than borrowed: linen
 * land, harbor water, hairline roads, mono-style labels in navy. It reads the
 * OpenMapTiles schema, so the same style runs on MapTiler (with a key) and on
 * OpenFreeMap (no key) without a change.
 *
 * Provider: NEXT_PUBLIC_MAPTILER_KEY set → MapTiler (100k loads/month free,
 * then paid, with an SLA). Unset → OpenFreeMap, free and keyless, which keeps
 * previews and local builds working.
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

/** MapLibre's worker, copied to /public by scripts/copy-maplibre-worker.mjs before every dev and build. */
export const MAPLIBRE_WORKER_URL = "/vendor/maplibre-gl-worker.mjs";

export const MAP_PROVIDER: "maptiler" | "openfreemap" = MAPTILER_KEY ? "maptiler" : "openfreemap";

const TILES = MAPTILER_KEY
  ? `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`
  : "https://tiles.openfreemap.org/planet";
const GLYPHS = MAPTILER_KEY
  ? `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`
  : "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const ATTRIBUTION = MAPTILER_KEY
  ? '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>'
  : '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>';

export const MAP_COLORS = {
  paper: "#f7f3ec",
  land: "#f3eee6",
  built: "#efe9df",
  park: "#e5e8d5",
  wood: "#e1e5d1",
  wetland: "#e3e8e1",
  sand: "#efe6d3",
  water: "#d3e2ea",
  waterLine: "#c6d8e2",
  building: "#e9e2d6",
  hairline: "#e4ded2",
  rule: "#c4b69f",
  sand300: "#d2c6b4",
  parchment: "#f1e9dc",
  rail: "#d8d9da",
  navy: "#2e4a5c",
  harbor: "#5c86a0",
  graphite: "#63666a",
  graphiteDark: "#44464a",
  amber: "#96702a",
  sky: "#44a6bb",
  white: "#ffffff",
} as const;

const REGULAR = ["Noto Sans Regular"];
const BOLD = ["Noto Sans Bold"];

export function buildMapStyle(): StyleSpecification {
  const c = MAP_COLORS;
  return {
    version: 8,
    name: "JJ Premier Group",
    glyphs: GLYPHS,
    sources: {
      openmaptiles: { type: "vector", url: TILES, attribution: ATTRIBUTION },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": c.paper } },
      {
        id: "landuse-residential",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood"]]],
        paint: { "fill-color": c.land, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.4, 13, 0.9] },
      },
      {
        id: "landuse-built",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["commercial", "industrial", "retail", "school", "university", "college", "hospital"]]],
        paint: { "fill-color": c.built, "fill-opacity": 0.8 },
      },
      {
        id: "landcover-wood",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland"]]],
        paint: { "fill-color": c.wood, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 14, 0.35] },
      },
      {
        id: "landcover-wetland",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "wetland"],
        paint: { "fill-color": c.wetland, "fill-opacity": 0.7 },
      },
      {
        id: "landcover-sand",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "sand"],
        paint: { "fill-color": c.sand, "fill-opacity": 0.9 },
      },
      { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park", paint: { "fill-color": c.park, "fill-opacity": 0.75 } },
      { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": c.water } },
      {
        id: "waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        paint: { "line-color": c.waterLine, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 2.5] },
      },
      {
        id: "aeroway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "aeroway",
        filter: ["in", ["get", "class"], ["literal", ["runway", "taxiway"]]],
        paint: { "line-color": c.hairline, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 8] },
      },
      {
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: { "fill-color": c.building, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15.5, 0.7] },
      },
      {
        id: "road-path",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 14,
        filter: ["in", ["get", "class"], ["literal", ["path", "track"]]],
        paint: { "line-color": c.white, "line-width": 1, "line-dasharray": [2, 2] },
      },
      {
        id: "road-minor-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "minor_construction"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.hairline, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 12, 1, 18, 12] },
      },
      {
        id: "road-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "minor_construction"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.white, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 12, 0.4, 18, 10] },
      },
      {
        id: "road-secondary-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.sand300, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 9, 0.8, 18, 16] },
      },
      {
        id: "road-secondary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.white, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 9, 0.3, 18, 13] },
      },
      {
        id: "road-primary-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.rule, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 7, 0.8, 18, 20] },
      },
      {
        id: "road-primary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.parchment, "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 7, 0.4, 18, 17] },
      },
      {
        id: "rail",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 11,
        filter: ["==", ["get", "class"], "rail"],
        paint: { "line-color": c.rail, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 16, 2] },
      },
      {
        id: "boundary-county",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 6], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": c.rule, "line-width": 1.2, "line-dasharray": [4, 3], "line-opacity": 0.8 },
      },
      {
        id: "boundary-city",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        minzoom: 10,
        filter: ["all", ["==", ["get", "admin_level"], 8], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": c.rule, "line-width": 0.8, "line-dasharray": [2, 3], "line-opacity": 0.7 },
      },
      {
        id: "road-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk", "minor"]]],
        layout: {
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": REGULAR,
          "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 13],
          "text-letter-spacing": 0.02,
          "symbol-spacing": 400,
        },
        paint: { "text-color": c.graphite, "text-halo-color": c.paper, "text-halo-width": 1.4 },
      },
      {
        id: "water-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "water_name",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": REGULAR,
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 14, 13],
          "text-letter-spacing": 0.14,
          "text-transform": "uppercase",
          "text-max-width": 6,
        },
        paint: { "text-color": c.harbor, "text-halo-color": c.water, "text-halo-width": 1 },
      },
      {
        id: "place-town",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": BOLD,
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 12, 14],
          "text-letter-spacing": 0.12,
          "text-transform": "uppercase",
          "text-max-width": 8,
        },
        paint: { "text-color": c.graphite, "text-halo-color": c.paper, "text-halo-width": 1.6, "text-opacity": 0.85 },
      },
    ],
  };
}
