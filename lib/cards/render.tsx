import { ImageResponse } from "next/og";
import { COLORS, fontList, fonts, ogImageSrc } from "@/lib/og";
import { CARD_SIZES, type CardSize } from "./copy";
import type { CardModel } from "./data";

/** The Coldwell Banker mark as the brand supplies it (white on navy), 491.83 × 67.35. */
const CB_MARK = "/brand/cb/coldwell-banker-horz-white.svg";
const CB_RATIO = 491.83 / 67.35;

/**
 * A card to post, at Instagram's feed (4:5) or story (9:16) size: the photograph across the top,
 * then on navy the eyebrow, the title, the figures or lines from the data, and at the foot the
 * short address and the two marks. A story keeps its words out of the top and bottom 250px, where
 * the app draws its own controls. PNG, so the type stays crisp after the network recompresses it.
 */
export async function renderCard(card: CardModel, size: CardSize, url: string): Promise<ImageResponse> {
  const { width: W, height: H } = CARD_SIZES[size];
  const story = size === "story";
  const photoH = story ? 760 : 500;
  const [f, photo, cb] = await Promise.all([fonts(), card.photo ? ogImageSrc(card.photo, { width: W, height: photoH }) : undefined, ogImageSrc(CB_MARK)]);
  const pad = 80;
  const titleSize = card.title.length > 34 ? 64 : 80;
  const rows = card.rows ?? [];
  const lines = card.lines ?? [];
  const lineSize = lines.length > 4 ? 28 : 32;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H, background: COLORS.navy, color: COLORS.white, fontFamily: "Jost, sans-serif" }}>
        {photo ? (
          <div style={{ display: "flex", width: W, height: photoH, position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" width={W} height={photoH} style={{ width: W, height: photoH, objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 220, background: "linear-gradient(180deg, rgba(46,74,92,0) 0%, rgba(46,74,92,1) 100%)" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", padding: `${photo ? 8 : pad}px ${pad}px ${story ? 270 : 72}px` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: COLORS.mist }}>{card.eyebrow}</span>
            <span style={{ fontFamily: "Newsreader, serif", fontSize: titleSize, lineHeight: 1.04, letterSpacing: -1.5, color: COLORS.white }}>{card.title}</span>
            <span style={{ width: 140, height: 2, background: COLORS.sky }} />
            {rows.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {rows.map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(199,231,239,0.25)", paddingBottom: 14 }}>
                    <span style={{ fontSize: 32, color: COLORS.linen }}>{r.label}</span>
                    <span style={{ fontFamily: "Newsreader, serif", fontSize: 60, color: COLORS.white }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {lines.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {lines.map((l) => (
                  <span key={l} style={{ fontSize: lineSize, lineHeight: 1.3, color: COLORS.linen }}>
                    {l}
                  </span>
                ))}
              </div>
            ) : null}
            {card.note ? <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, lineHeight: 1.45, color: COLORS.mist }}>{card.note}</span> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 40 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 28, letterSpacing: 1, color: COLORS.sky }}>{url}</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, color: COLORS.linen }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 56, letterSpacing: 5.6, lineHeight: 1 }}>JJ</span>
                <span style={{ width: 1, height: 50, background: COLORS.linen, opacity: 0.5 }} />
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 17, letterSpacing: 5, lineHeight: 1.55, display: "flex", flexDirection: "column" }}>
                  <span>PREMIER</span>
                  <span>GROUP</span>
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cb ? <img src={cb} alt="" width={Math.round(44 * CB_RATIO)} height={44} style={{ width: Math.round(44 * CB_RATIO), height: 44 }} /> : null}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontList(f) },
  );
}
