// Copy MapLibre's worker (and the shared module it imports) next to the site so
// the map can load it from a plain URL under any bundler. Runs before dev and
// build (see package.json); the copies are git-ignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const dist = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist");
const outDir = path.join(process.cwd(), "public", "vendor");
mkdirSync(outDir, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(path.join(dist, f), path.join(outDir, f));
console.log("copied maplibre worker → public/vendor/");
