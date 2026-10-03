import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Event } from "@/lib/content/types";
import { keyArtDataUri } from "./key-art";
import { stockPhoto } from "./stock";

/**
 * The picture for an event's share image and its Monday-issue image. The
 * presenter's image is stored as WebP, which the share-image renderer can't
 * read, so it is re-encoded here as a 520×630 JPEG. Anything that fails
 * (a slow bucket, a missing file) falls back to the key art.
 */
export async function eventOgPhoto(e: Pick<Event, "image" | "category" | "slug" | "subcategory">): Promise<string> {
  const art = () => keyArtDataUri({ category: e.category, seed: e.slug, subcategory: e.subcategory, width: 520, height: 630 });
  const src = e.image?.src ?? stockPhoto({ category: e.category, subcategory: e.subcategory, seed: e.slug })?.src;
  if (!src) return art();
  try {
    const bytes = /^https?:\/\//.test(src)
      ? new Uint8Array(await (await fetch(src, { signal: AbortSignal.timeout(6000) })).arrayBuffer())
      : await readFile(path.join(process.cwd(), "public", src));
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(bytes).resize(520, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 80 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return art();
  }
}
