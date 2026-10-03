import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapOptions } from "maplibre-gl";
import {
  MAP_LOAD_TIMEOUT_MS,
  classifyMapUrl,
  decideMapError,
  describeMapError,
  mapErrorKey,
  onceByKey,
  type MapRequestError,
} from "@/lib/neighborhoods/map-fallback";
import { MAPLIBRE_WORKER_URL, MAP_PROVIDER, buildMapStyle, type MapProvider } from "@/lib/neighborhoods/map-style";

export type MapStatus = "loading" | "ready" | "failed";

type Hooks = {
  /** After every style load, the first and the one after a provider switch: add the app's own sources and layers. */
  onStyle: (m: MapLibreMap) => void;
  /** Just before the style is swapped out; the app's layers are gone until `onStyle` runs again. */
  onStyleGone?: () => void;
  /** Once, on the map's first `load`. Bind interactions here; they survive a style switch. */
  onFirstLoad?: (m: MapLibreMap) => void;
  onStatus: (s: MapStatus) => void;
};

/** One console line per distinct failure, in production too. No analytics. */
const warn = onceByKey((line) => console.warn(`[atlas map] ${line}`));

function errorOf(e: unknown): MapRequestError {
  const err = (e as { error?: unknown })?.error ?? e;
  if (err && typeof err === "object") {
    const o = err as { status?: unknown; url?: unknown; message?: unknown };
    return {
      status: typeof o.status === "number" ? o.status : undefined,
      url: typeof o.url === "string" ? o.url : undefined,
      message: typeof o.message === "string" ? o.message : String(err),
    };
  }
  return { message: String(err) };
}

/**
 * Start a MapLibre map that looks after itself:
 *
 * - If the map can't be created at all (no WebGL, an old browser), it reports
 *   "failed" instead of throwing, so the component can show its quiet message.
 * - If MapTiler refuses or can't be reached, or the first load takes longer
 *   than MAP_LOAD_TIMEOUT_MS, it switches once to OpenFreeMap and asks the
 *   component to put its layers back after the new style loads.
 * - If OpenFreeMap can't serve the base map either, or still hasn't loaded
 *   after another timeout, it reports "failed". A late first load still
 *   flips it to "ready".
 *
 * Returns null when the map couldn't be created.
 */
export function startMap(container: HTMLElement, options: Omit<MapOptions, "container" | "style">, hooks: Hooks): { map: MapLibreMap; dispose: () => void } | null {
  let m: MapLibreMap;
  try {
    maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
    m = new maplibregl.Map({ ...options, container, style: buildMapStyle(MAP_PROVIDER) });
  } catch (err) {
    const e = errorOf(err);
    warn(`create:${mapErrorKey(e)}`, `couldn't start the map: ${describeMapError(e)}`);
    hooks.onStatus("failed");
    return null;
  }

  let provider: MapProvider = MAP_PROVIDER;
  let loaded = false;
  let broken = false; // the base map is beyond saving; a later `load` doesn't count
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const fail = (why: string, final: boolean) => {
    if (final) broken = true;
    warn(`fail:${why}`, `showing the fallback message: ${why}`);
    hooks.onStatus("failed");
  };

  const switchProvider = (why: string) => {
    if (provider !== "maptiler" || disposed) return;
    provider = "openfreemap";
    warn("switch", `switching to OpenFreeMap: MapTiler ${why}`);
    hooks.onStyleGone?.();
    m.setStyle(buildMapStyle("openfreemap"), { diff: false });
    if (!loaded) arm();
  };

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (loaded || disposed) return;
      if (provider === "maptiler") switchProvider(`no load after ${MAP_LOAD_TIMEOUT_MS / 1000}s`);
      else fail(`no load after ${MAP_LOAD_TIMEOUT_MS / 1000}s on OpenFreeMap`, false);
    }, MAP_LOAD_TIMEOUT_MS);
  }

  m.on("style.load", () => {
    try {
      hooks.onStyle(m);
    } catch (err) {
      const e = errorOf(err);
      warn(`layers:${mapErrorKey(e)}`, `couldn't add the map's layers: ${describeMapError(e)}`);
    }
  });

  m.on("load", () => {
    loaded = true;
    clearTimeout(timer);
    hooks.onFirstLoad?.(m);
    if (!broken) hooks.onStatus("ready");
  });

  m.on("error", (ev) => {
    const e = errorOf(ev);
    warn(mapErrorKey(e), describeMapError(e));
    const decision = decideMapError(e, provider);
    if (decision === "fallback") switchProvider(`${e.status} on ${classifyMapUrl(e.url).kind}`);
    else if (decision === "give-up") fail(describeMapError(e), true);
  });

  arm();

  return {
    map: m,
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      m.remove();
    },
  };
}
