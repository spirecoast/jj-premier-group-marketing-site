import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Open Graph images drawn in the brand: a photograph on the left, navy on
 * the right, mono eyebrow, display headline, record line. Used by the
 * opengraph-image routes for listings, events, venues, neighborhoods and
 * letters. Static pages use /og-image.png.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  navy: "#2e4a5c",
  linen: "#e6ddd1",
  mist: "#c7e7ef",
  sky: "#89d4e3",
  amber: "#96702a",
  white: "#ffffff",
};

let fontCache: Promise<{ display?: ArrayBuffer; body?: ArrayBuffer; mono?: ArrayBuffer }> | null = null;

async function googleFont(family: string, weight: number, text?: string): Promise<ArrayBuffer | undefined> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}${text ? `&text=${encodeURIComponent(text)}` : ""}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\) format\('(?:woff2|truetype|opentype)'\)/)?.[1] ?? css.match(/url\(([^)]+\.(?:ttf|woff2|otf))\)/)?.[1];
    if (!url) return undefined;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return undefined;
  }
}

/** Fonts are fetched once per process; a miss falls back to system faces. */
function fonts() {
  if (!fontCache) {
    fontCache = Promise.all([googleFont("Newsreader", 300), googleFont("Jost", 500), googleFont("IBM Plex Mono", 500)]).then(
      ([display, body, mono]) => ({ display, body, mono }),
    );
  }
  return fontCache;
}

/** A /public path becomes a data URI; anything else is used as-is. */
export async function ogImageSrc(src: string): Promise<string | undefined> {
  if (/^https?:\/\//.test(src)) return src;
  try {
    const file = await readFile(path.join(process.cwd(), "public", src));
    const ext = path.extname(src).slice(1).toLowerCase();
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "application/octet-stream";
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function brandOgImage({
  eyebrow,
  title,
  meta,
  photo,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  photo?: string;
}) {
  const [f, photoSrc] = await Promise.all([fonts(), photo ? ogImageSrc(photo) : Promise.resolve(undefined)]);
  const titleSize = title.length > 48 ? 44 : title.length > 28 ? 54 : 64;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: COLORS.navy, color: COLORS.white, fontFamily: "Jost, sans-serif" }}>
        {photoSrc ? (
          <div style={{ display: "flex", width: 520, height: 630, position: "relative", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc} alt="" width={520} height={630} style={{ objectFit: "cover", width: 520, height: 630 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(20,37,48,0) 60%, rgba(46,74,92,1) 100%)" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "56px 60px 52px 52px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: 40, letterSpacing: 4, color: COLORS.linen }}>JJ</span>
            <span style={{ width: 1, height: 34, background: "rgba(230,221,209,0.55)" }} />
            <span style={{ fontFamily: "Newsreader, serif", fontSize: 12, letterSpacing: 5, lineHeight: 1.5, color: COLORS.linen, display: "flex", flexDirection: "column" }}>
              <span>PREMIER</span>
              <span>GROUP</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist }}>{eyebrow}</span>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: titleSize, lineHeight: 1.04, letterSpacing: -1, color: COLORS.white }}>{title}</span>
            <span style={{ width: 120, height: 1, background: COLORS.sky }} />
            {meta ? <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, letterSpacing: 1, color: COLORS.linen }}>{meta}</span> : null}
          </div>
          <span style={{ fontFamily: "Newsreader, serif", fontStyle: "italic", fontSize: 22, color: COLORS.linen }}>Every move, expertly guided.</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        ...(f.display ? [{ name: "Newsreader", data: f.display, weight: 300 as const, style: "normal" as const }] : []),
        ...(f.body ? [{ name: "Jost", data: f.body, weight: 500 as const, style: "normal" as const }] : []),
        ...(f.mono ? [{ name: "IBM Plex Mono", data: f.mono, weight: 500 as const, style: "normal" as const }] : []),
      ],
    },
  );
}
