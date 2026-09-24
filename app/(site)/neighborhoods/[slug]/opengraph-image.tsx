import { getNeighborhood } from "@/lib/content";
import { marketName } from "@/lib/content/markets";
import { getAncestors, getIndexEntries, getRecord } from "@/lib/neighborhoods/data";
import { TYPE_LABEL } from "@/lib/neighborhoods/format";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage, constellationOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [record, editorial] = await Promise.all([getRecord(slug), getNeighborhood(slug)]);
  if (!record && !editorial) return brandOgImage({ eyebrow: "Neighborhoods", title: "Nothing on that street." });
  if (editorial && (!record || record.lat === null)) {
    const n = editorial.neighborhood;
    return brandOgImage({ eyebrow: marketName(n.market), title: n.name, meta: n.tagline, photo: n.hero.src });
  }
  const r = record!;
  const [entries, ancestors] = await Promise.all([getIndexEntries(), getAncestors(slug)]);
  const points = entries
    .filter((e) => e.x !== null && e.y !== null)
    .map((e): [number, number, number] => [e.x!, e.y!, e.m === r.market ? (e.r ? 0.55 : 0.3) : 0.08]);
  const where = ancestors.length ? ancestors.map((a) => a.name).join(" › ") : marketName(r.market);
  return constellationOgImage({
    eyebrow: where,
    title: r.name,
    meta: [r.type ? TYPE_LABEL[r.type] : undefined, r.jurisdiction ?? undefined, r.zips.length ? r.zips.join(", ") : undefined].filter(Boolean).join(" · "),
    points,
    focus: r.lat !== null && r.lng !== null ? [r.lng, r.lat] : undefined,
  });
}
