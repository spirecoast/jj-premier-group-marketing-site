import { getNeighborhood } from "@/lib/content";
import { marketName } from "@/lib/content/markets";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getNeighborhood(slug);
  if (!data) return brandOgImage({ eyebrow: "Neighborhoods", title: "Nothing on that street." });
  const n = data.neighborhood;
  return brandOgImage({
    eyebrow: `${marketName(n.market)}${data.market ? ` · ${data.market.county}` : ""}`,
    title: n.name,
    meta: n.stat ? [n.stat.value, n.stat.label, n.stat.source].filter(Boolean).join(" · ") : n.tagline,
    photo: n.hero.src,
  });
}
