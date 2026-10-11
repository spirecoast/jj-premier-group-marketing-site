#!/usr/bin/env node
/**
 * Prints every guide to PDF: public/guides/pdf/<slug>.pdf, the file the
 * "Download the PDF" buttons serve. Each is /print/guides/<slug> (the print
 * layout in app/(print)) printed by Chromium on US Letter, using the page's
 * own @page rules for the bleed pages, the running head and the folios.
 *
 *   npm run dev            # or: npm run build && npm run start
 *   npm run guides:pdf     # BASE=http://localhost:3000 by default
 *
 * Run it again whenever a guide changes, and commit the PDFs.
 */
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const base = process.env.BASE ?? "http://localhost:3000";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright"));
}

const src = await readFile(path.join(process.cwd(), "lib/guides/slugs.ts"), "utf8");
const slugs = [...src.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
if (!slugs.length) throw new Error("No guide slugs found in lib/guides/slugs.ts");
const only = process.argv.slice(2);
const todo = only.length ? slugs.filter((s) => only.includes(s)) : slugs;

const out = path.join(process.cwd(), "public/guides/pdf");
await mkdir(out, { recursive: true });
const executablePath = process.env.CHROMIUM ?? (process.env.PLAYWRIGHT_BROWSERS_PATH ? undefined : "/opt/pw-browsers/chromium");
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();
for (const slug of todo) {
  const url = `${base}/print/guides/${slug}`;
  const res = await page.goto(url, { waitUntil: "networkidle" });
  if (!res || !res.ok()) throw new Error(`${url}: ${res?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  // Every image in, not just the ones near the top.
  await page.evaluate(async () => {
    for (const img of document.images) {
      img.loading = "eager";
      if (!img.complete) await new Promise((r) => img.addEventListener("load", r, { once: true }));
    }
  });
  await page.emulateMedia({ media: "print" });
  const file = path.join(out, `${slug}.pdf`);
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  console.log(`✓ ${slug}.pdf`);
}
await browser.close();
