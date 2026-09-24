import { getListing } from "@/lib/content";
import { factsLine, formatPrice } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return brandOgImage({ eyebrow: "JJ Premier Group", title: "Nothing on that street." });
  return brandOgImage({
    eyebrow: `${l.neighborhood?.name ?? marketName(l.market)} · ${l.status === "sold" ? "Sold" : "For sale"}`,
    title: l.title,
    meta: `${formatPrice(l.price)} · ${factsLine(l)}`,
    photo: l.hero.src,
  });
}
