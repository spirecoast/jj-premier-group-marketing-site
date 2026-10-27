#!/usr/bin/env node
/**
 * Fails the build when zod reaches the browser.
 *
 *   node scripts/check-client-bundle.mjs      (runs after `next build`, as postbuild)
 *
 * zod is the server's validator (lib/leads/schema.ts, the questionnaire's
 * save action). The forms check themselves with lib/leads/rules.ts, which has
 * no imports, and the UTM tracker reads lib/leads/constants.ts. One stray
 * import of a zod file from a client component put all of zod (about 90KB
 * gzipped) on every page once; this keeps it from happening again. zod v4
 * names its classes with strings ("$ZodType"), which survive minification.
 *
 * It reads every script under .next/static, not only static/chunks: on Vercel
 * the build adapter turns on immutable assets, and Turbopack then writes the
 * browser chunks under static/immutable/ instead (Next 16.4).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATIC = path.join(ROOT, ".next", "static");
const MARKER = '"$ZodType"';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(STATIC);
} catch {
  console.error(`check-client-bundle: no ${path.relative(ROOT, STATIC)}; run next build first.`);
  process.exit(1);
}
if (!files.length) {
  console.error(`check-client-bundle: no scripts under ${path.relative(ROOT, STATIC)}; the build's output has moved, so this check needs updating.`);
  process.exit(1);
}
const hits = files.filter((f) => readFileSync(f, "utf8").includes(MARKER));
if (hits.length) {
  console.error(`✗ zod is in ${hits.length} browser chunk(s):`);
  for (const f of hits) console.error(`  ${path.relative(ROOT, f)} (${Math.round(statSync(f).size / 1024)} KB)`);
  console.error("A client component imports a file that imports zod. Import lib/leads/constants.ts or lib/leads/rules.ts there instead of lib/leads/schema.ts.");
  process.exit(1);
}
console.log(`✓ ${files.length} browser chunks checked, no zod.`);
