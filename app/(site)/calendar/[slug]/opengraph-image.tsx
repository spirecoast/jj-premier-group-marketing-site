import { getEvent } from "@/lib/content";
import { formatEventWhen } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { keyArtDataUri } from "@/lib/encore/key-art";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) return brandOgImage({ eyebrow: "Encore Arts Calendar", title: "Not on the calendar." });
  return brandOgImage({
    eyebrow: `Encore Arts Calendar · ${marketName(e.venue.market)}`,
    title: e.title,
    meta: `${formatEventWhen(e.startsAt, e.endsAt, e.allDay)} · ${e.venue.name}`,
    photo: e.image?.src ?? keyArtDataUri({ category: e.category, seed: e.slug, subcategory: e.subcategory, width: 520, height: 630 }),
  });
}
