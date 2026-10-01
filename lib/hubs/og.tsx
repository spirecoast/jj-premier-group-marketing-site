import { getMarket } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export { OG_CONTENT_TYPE, OG_SIZE };

/** The share image for a market hub: the market's library photo, its county, the name. */
export function hubOgImage(market: MarketSlug) {
  const m = getMarket(market)!;
  return brandOgImage({
    eyebrow: `${m.county} · Florida`,
    title: m.name,
    meta: "The places, what’s on, and how buying works here",
    photo: m.image.src,
  });
}
