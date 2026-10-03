import { abs, jsonLd, ldImage, metaImage, parseHtml, typeIs } from "./html";
import type { Fetcher } from "./types";
import { sha256 } from "./util";

/**
 * Event images: the presenter's own promotional image for the event (the
 * og:image of its page, the JSON-LD image, or the listing's card art),
 * resized to at most 1600px wide, WebP, and stored in the public
 * `encore-images` bucket with where it came from and who to credit.
 *
 * Images that are clearly not event art are refused: too small (logos,
 * icons), or a URL that says logo/placeholder/favicon.
 */

export const MAX_WIDTH = 1600;
export const MIN_WIDTH = 400;
const NOT_ART = /logo|favicon|placeholder|default[-_]?(image|og)|blank\.|spacer|avatar|icon[-_.]|\/icons?\//i;

export type ImageSink = {
  /** Store bytes at path; returns the public URL. */
  put(path: string, bytes: Uint8Array, contentType: string): Promise<string>;
  remove?(path: string): Promise<void>;
};

export type Processed = { publicUrl: string; storagePath: string; width: number; height: number; sha256: string };

/**
 * Find the image on a page when the source gave none: the JSON-LD Event
 * image, then og:image, then the page's own artwork (an <img> whose file
 * name or alt text carries a word of the title).
 */
export async function imageFromPage(pageUrl: string, fetch: Fetcher, title = ""): Promise<string | undefined> {
  const res = await fetch(pageUrl);
  if (!res.ok) return undefined;
  const doc = parseHtml(res.text);
  const ld = jsonLd(res.text).find((o) => typeIs(o, "Event", "MusicEvent", "TheaterEvent", "ExhibitionEvent", "Festival") && o.image);
  const fromLd = ld ? ldImage(ld.image, pageUrl) : undefined;
  const og = metaImage(doc, pageUrl);
  const found = [fromLd, og].find((u) => u && looksLikeArt(u));
  if (found) return found;
  const words = title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const imgs = (doc.querySelector("main") ?? doc.querySelector("article") ?? doc).querySelectorAll("img").map((i) => ({
    src: abs(i.getAttribute("src") ?? i.getAttribute("data-src"), pageUrl),
    alt: (i.getAttribute("alt") ?? "").toLowerCase(),
    width: Number(i.getAttribute("width") ?? 0),
  }));
  const usable = imgs.filter((i) => i.src && looksLikeArt(i.src) && (!i.width || i.width >= MIN_WIDTH));
  const named = usable.find((i) => words.some((w) => i.src!.toLowerCase().includes(w) || i.alt.includes(w)));
  // Only artwork that names the event: a page's hero banner is often the season's, not this show's.
  return named?.src;
}

export function looksLikeArt(url: string | undefined | null): boolean {
  return Boolean(url) && !NOT_ART.test(url!) && !/\.svg(\?|$)/i.test(url!);
}

/** Download, check, resize and store one image. Throws with a short reason when it can't be used. */
export async function processImage(opts: { slug: string; url: string; fetch: Fetcher; sink: ImageSink }): Promise<Processed> {
  const res = await opts.fetch(opts.url, { binary: true, timeoutMs: 30_000 });
  if (!res.ok || !res.bytes) throw new Error(`image HTTP ${res.status}`);
  const type = res.headers["content-type"] ?? "";
  if (type && !/^image\//i.test(type) && !/octet-stream/i.test(type)) throw new Error(`not an image (${type})`);
  if (res.bytes.byteLength > 20 * 1024 * 1024) throw new Error("image over 20MB");
  const sharp = (await import("sharp")).default;
  const img = sharp(res.bytes, { failOn: "error", limitInputPixels: 80_000_000 }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("image has no size");
  if (meta.width < MIN_WIDTH) throw new Error(`image too small (${meta.width}px wide)`);
  const out = await img
    .resize({ width: Math.min(MAX_WIDTH, meta.width), withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const hash = sha256(out.data);
  const storagePath = `events/${opts.slug}-${hash.slice(0, 10)}.webp`;
  const publicUrl = await opts.sink.put(storagePath, new Uint8Array(out.data), "image/webp");
  return { publicUrl, storagePath, width: out.info.width, height: out.info.height, sha256: hash };
}

/** Supabase Storage over its REST API with the service role key (server only). */
export function supabaseSink(opts: { url: string; serviceKey: string; bucket?: string; fetchImpl?: typeof fetch }): ImageSink {
  const base = opts.url.replace(/\/$/, "");
  const bucket = opts.bucket ?? "encore-images";
  const f = opts.fetchImpl ?? fetch;
  const auth = { Authorization: `Bearer ${opts.serviceKey}`, apikey: opts.serviceKey };
  return {
    async put(path, bytes, contentType) {
      const res = await f(`${base}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
        body: bytes as unknown as BodyInit,
      });
      if (!res.ok) throw new Error(`storage upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },
    async remove(path) {
      await f(`${base}/storage/v1/object/${bucket}`, { method: "DELETE", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) });
    },
  };
}

/** A folder on disk served under `urlPrefix` (local runs: public/encore-local). */
export function folderSink(dir: string, urlPrefix: string): ImageSink {
  return {
    async put(path, bytes) {
      const { mkdirSync, writeFileSync } = await import("node:fs");
      const { dirname, join } = await import("node:path");
      const file = join(dir, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
      return `${urlPrefix.replace(/\/$/, "")}/${path}`;
    },
  };
}
