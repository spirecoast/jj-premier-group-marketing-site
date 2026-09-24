import { getVenue } from "@/lib/content";
import { formatAddress } from "@/lib/content/format";
import { getMarket, marketName } from "@/lib/content/markets";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await getVenue(slug);
  if (!v) return brandOgImage({ eyebrow: "Encore Arts Calendar", title: "Venue not found." });
  return brandOgImage({
    eyebrow: `Encore Arts Calendar · ${marketName(v.market)}`,
    title: v.name,
    meta: formatAddress(v.address),
    photo: v.image?.src ?? getMarket(v.market)?.image.src,
  });
}
