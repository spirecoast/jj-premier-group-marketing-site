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

/** Satori needs TrueType/OpenType. A legacy user-agent makes Google Fonts serve TTF. */
async function googleFont(family: string, weight: number): Promise<ArrayBuffer | undefined> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return undefined;
    const buf = await fetch(url).then((r) => r.arrayBuffer());
    const sig = String.fromCharCode(...new Uint8Array(buf.slice(0, 4)));
    // Reject WOFF/WOFF2 (Satori cannot parse them); OTTO and 0x00010000 are fine.
    if (sig === "wOFF" || sig === "wOF2") return undefined;
    return buf;
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
  const fontList = [
    ...(f.display ? [{ name: "Newsreader", data: f.display, weight: 300 as const, style: "normal" as const }] : []),
    ...(f.body ? [{ name: "Jost", data: f.body, weight: 500 as const, style: "normal" as const }] : []),
    ...(f.mono ? [{ name: "IBM Plex Mono", data: f.mono, weight: 500 as const, style: "normal" as const }] : []),
  ];
  // With no fonts the renderer falls back to its bundled face rather than throwing.

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
    { ...OG_SIZE, ...(fontList.length ? { fonts: fontList } : {}) },
  );
}


/**
 * A neighborhood share card: every place in the catalog as a faint
 * constellation on linen, the market's places darker, the chosen one lit in
 * amber. Drawn from coordinates alone, so no tiles and no key are needed.
 */
export async function constellationOgImage({
  eyebrow,
  title,
  meta,
  points,
  focus,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  /** [lng, lat, emphasis 0..1] for every point to draw. */
  points: [number, number, number][];
  /** [lng, lat] of the place to light, if any. */
  focus?: [number, number];
}) {
  const f = await fonts();
  const W = 1200;
  const H = 630;
  // Fit the Suncoast bbox into the right two thirds, leaving room for type on the left.
  const bbox = { w: -82.79, e: -82.24, s: 27.16, n: 27.68 };
  const cosLat = Math.cos((27.42 * Math.PI) / 180);
  const spanX = (bbox.e - bbox.w) * cosLat;
  const spanY = bbox.n - bbox.s;
  const scale = Math.min((W * 0.62) / spanX, (H - 80) / spanY);
  const ox = W - 40 - spanX * scale;
  const oy = 40;
  const px = (lng: number) => ox + (lng - bbox.w) * cosLat * scale;
  const py = (lat: number) => oy + (bbox.n - lat) * scale;
  const titleSize = title.length > 40 ? 46 : title.length > 22 ? 58 : 72;
  const fontList = [
    ...(f.display ? [{ name: "Newsreader", data: f.display, weight: 300 as const, style: "normal" as const }] : []),
    ...(f.body ? [{ name: "Jost", data: f.body, weight: 500 as const, style: "normal" as const }] : []),
    ...(f.mono ? [{ name: "IBM Plex Mono", data: f.mono, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const dots = points
    .map(([lng, lat, k]) => `<circle cx="${px(lng).toFixed(1)}" cy="${py(lat).toFixed(1)}" r="${(1.6 + k * 1.2).toFixed(1)}" fill="${COLORS.navy}" fill-opacity="${(0.16 + k * 0.5).toFixed(2)}"/>`)
    .join("");
  const mark = focus
    ? `<circle cx="${px(focus[0]).toFixed(1)}" cy="${py(focus[1]).toFixed(1)}" r="26" fill="none" stroke="${COLORS.amber}" stroke-width="2" stroke-opacity="0.55"/>` +
      `<circle cx="${px(focus[0]).toFixed(1)}" cy="${py(focus[1]).toFixed(1)}" r="11" fill="${COLORS.amber}" stroke="#ffffff" stroke-width="3"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${dots}${mark}</svg>`;
  const svgSrc = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f3eee6", color: COLORS.navy, fontFamily: "Jost, sans-serif", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgSrc} alt="" width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 560, height: H, background: "linear-gradient(90deg, #f3eee6 62%, rgba(243,238,230,0) 100%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "absolute", top: 0, left: 0, height: H, width: 620, padding: "56px 40px 52px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: 40, letterSpacing: 4, color: COLORS.navy }}>JJ</span>
            <span style={{ width: 1, height: 34, background: "rgba(46,74,92,0.45)" }} />
            <span style={{ fontFamily: "Newsreader, serif", fontSize: 12, letterSpacing: 5, lineHeight: 1.5, color: COLORS.navy, display: "flex", flexDirection: "column" }}>
              <span>PREMIER</span>
              <span>GROUP</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: COLORS.amber }}>{eyebrow}</span>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: titleSize, fontWeight: 300, lineHeight: 1.02, color: COLORS.navy }}>{title}</span>
            {meta ? <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 17, lineHeight: 1.5, color: "#53565a" }}>{meta}</span> : null}
          </div>
          <span style={{ fontFamily: "Newsreader, serif", fontSize: 20, color: "#6b5d4e" }}>Every move, expertly guided.</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fontList },
  );
}
