import { MAPTILER_ORIGIN, OPENFREEMAP_ORIGIN, type MapProvider } from "./map-style";

/**
 * What to do when the map reports a failed request. Pure, so it's tested on
 * its own (map-fallback.test.ts); components/map-runtime.ts wires it to MapLibre.
 *
 * MapTiler is the paid provider and can refuse us (a bad or rate-limited key,
 * a quota hit, an origin not on the allow list) or simply be unreachable. When
 * that happens the map switches once to OpenFreeMap, which serves the same
 * OpenMapTiles schema with no key. If OpenFreeMap can't give us the basics
 * either, the map gives up and says so in plain words.
 */

/** The parts of a MapLibre `error` event this needs. AJAXError carries `status` and `url`. */
export type MapRequestError = { status?: number; url?: string; message?: string };

export type MapRequestKind = "tilejson" | "glyphs" | "sprite" | "tile" | "other";

export type MapErrorDecision = "fallback" | "give-up" | "ignore";

/** How long a first load may take before the map tries the other provider. */
export const MAP_LOAD_TIMEOUT_MS = 10_000;

/** A refusal: the key is bad, the origin isn't allowed, or the quota or rate limit is spent. */
const REFUSED = new Set([401, 403, 429]);

/** Which provider a request went to and what it was for, from its URL alone. */
export function classifyMapUrl(url: string | undefined): { provider: MapProvider | null; kind: MapRequestKind } {
  if (!url) return { provider: null, kind: "other" };
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { provider: null, kind: "other" };
  }
  const path = u.pathname;
  if (u.origin === MAPTILER_ORIGIN) {
    if (/\/tiles\.json$/.test(path) || /\/style\.json$/.test(path)) return { provider: "maptiler", kind: "tilejson" };
    if (path.startsWith("/fonts/")) return { provider: "maptiler", kind: "glyphs" };
    if (/\/sprite/.test(path)) return { provider: "maptiler", kind: "sprite" };
    if (/\/tiles\//.test(path)) return { provider: "maptiler", kind: "tile" };
    return { provider: "maptiler", kind: "other" };
  }
  if (u.origin === OPENFREEMAP_ORIGIN) {
    // The TileJSON is the bare /planet; its tiles live under /planet/<version>/z/x/y.pbf.
    if (/^\/[^/]+\/?$/.test(path) && !path.startsWith("/fonts")) return { provider: "openfreemap", kind: "tilejson" };
    if (path.startsWith("/fonts/")) return { provider: "openfreemap", kind: "glyphs" };
    if (/\/sprite/.test(path)) return { provider: "openfreemap", kind: "sprite" };
    if (/\.pbf$/.test(path) || /\.mvt$/.test(path)) return { provider: "openfreemap", kind: "tile" };
    return { provider: "openfreemap", kind: "other" };
  }
  return { provider: null, kind: "other" };
}

/**
 * Whether this error is the provider failing us, rather than one stray tile.
 * Refusals count on any request. A network failure (status 0) or a server
 * error counts only on the requests the whole map depends on: the TileJSON and
 * the glyphs. A single tile that drops on a flaky connection does not.
 */
export function isProviderFailure(err: MapRequestError): boolean {
  const { kind } = classifyMapUrl(err.url);
  const status = err.status;
  if (typeof status !== "number") return false;
  if (REFUSED.has(status)) return true;
  const core = kind === "tilejson" || kind === "glyphs";
  return core && (status === 0 || status >= 500);
}

/**
 * The decision for one `error` event, given the provider the map is on now.
 *
 * - On MapTiler, a provider failure from MapTiler → "fallback" (once; after
 *   the switch the map is on OpenFreeMap and this can't return it again).
 * - On OpenFreeMap, a failure of its TileJSON → "give-up": there's no base map
 *   to draw. Glyph or tile trouble there leaves a usable map, so it's ignored.
 * - Anything from the provider we've already left, or from elsewhere → "ignore".
 */
export function decideMapError(err: MapRequestError, current: MapProvider): MapErrorDecision {
  const { provider, kind } = classifyMapUrl(err.url);
  if (!provider || provider !== current) return "ignore";
  if (!isProviderFailure(err)) return "ignore";
  if (current === "maptiler") return "fallback";
  return kind === "tilejson" ? "give-up" : "ignore";
}

/** Strip the API key out of a URL before it goes anywhere near a log. */
export function redactUrl(url: string): string {
  return url.replace(/([?&]key=)[^&#]*/gi, "$1…");
}

/**
 * One key per kind of failure, so the console gets one line for "MapTiler
 * tiles 403" rather than one per tile. Errors without a URL key on their message.
 */
export function mapErrorKey(err: MapRequestError): string {
  const { provider, kind } = classifyMapUrl(err.url);
  if (provider) return `${provider}:${kind}:${err.status ?? "?"}`;
  return `other:${(err.message ?? "unknown").replace(/\d+/g, "#").slice(0, 120)}`;
}

/** The one line that goes to the console for an error. */
export function describeMapError(err: MapRequestError): string {
  const { provider, kind } = classifyMapUrl(err.url);
  if (provider) return `${provider} ${kind} failed (${err.status ?? "no status"}): ${redactUrl(err.url ?? "")}`;
  return redactUrl(err.message ?? "unknown error");
}

/** A logger that writes each distinct key once per page view. */
export function onceByKey(write: (line: string) => void): (key: string, line: string) => void {
  const seen = new Set<string>();
  return (key, line) => {
    if (seen.has(key)) return;
    seen.add(key);
    write(line);
  };
}
