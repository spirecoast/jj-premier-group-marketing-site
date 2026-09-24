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

type Fonts = { display?: ArrayBuffer; displayItalic?: ArrayBuffer; wordmark?: ArrayBuffer; body?: ArrayBuffer; mono?: ArrayBuffer };
let fontCache: Promise<Fonts> | null = null;

/** The brand faces ship with the site (lib/og-fonts), so a share image never depends on a font host. */
async function localFont(file: string): Promise<ArrayBuffer | undefined> {
  try {
    const buf = await readFile(path.join(process.cwd(), "lib", "og-fonts", file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return undefined;
  }
}

function fonts(): Promise<Fonts> {
  if (!fontCache) {
    fontCache = Promise.all([
      localFont("newsreader-300.ttf"),
      localFont("newsreader-300-italic.ttf"),
      localFont("cormorant-garamond-600.ttf"),
      localFont("jost-500.ttf"),
      localFont("ibm-plex-mono-500.ttf"),
    ]).then(([display, displayItalic, wordmark, body, mono]) => ({ display, displayItalic, wordmark, body, mono }));
  }
  return fontCache;
}

function fontList(f: Fonts) {
  return [
    ...(f.display ? [{ name: "Newsreader", data: f.display, weight: 300 as const, style: "normal" as const }] : []),
    ...(f.displayItalic ? [{ name: "Newsreader", data: f.displayItalic, weight: 300 as const, style: "italic" as const }] : []),
    ...(f.wordmark ? [{ name: "Cormorant Garamond", data: f.wordmark, weight: 600 as const, style: "normal" as const }] : []),
    ...(f.body ? [{ name: "Jost", data: f.body, weight: 500 as const, style: "normal" as const }] : []),
    ...(f.mono ? [{ name: "IBM Plex Mono", data: f.mono, weight: 500 as const, style: "normal" as const }] : []),
  ];
}

/** The wordmark as the site sets it: Contralto's stand-in, JJ tracked 0.1em, PREMIER GROUP small and tracked 0.3em. */
function Lockup({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color }}>
      <span style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 40, letterSpacing: 4, lineHeight: 1 }}>JJ</span>
      <span style={{ width: 1, height: 36, background: color, opacity: 0.5 }} />
      <span style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 12, letterSpacing: 3.6, lineHeight: 1.55, display: "flex", flexDirection: "column" }}>
        <span>PREMIER</span>
        <span>GROUP</span>
      </span>
    </div>
  );
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
  const faces = fontList(f);

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
          <Lockup color={COLORS.linen} />
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
    { ...OG_SIZE, ...(faces.length ? { fonts: faces } : {}) },
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
  const faces = fontList(f);
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
          <Lockup color={COLORS.navy} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: COLORS.amber }}>{eyebrow}</span>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: titleSize, fontWeight: 300, lineHeight: 1.02, color: COLORS.navy }}>{title}</span>
            {meta ? <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 17, lineHeight: 1.5, color: "#53565a" }}>{meta}</span> : null}
          </div>
          <span style={{ fontFamily: "Newsreader, serif", fontStyle: "italic", fontSize: 22, color: "#6b5d4e" }}>Every move, expertly guided.</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: faces },
  );
}
