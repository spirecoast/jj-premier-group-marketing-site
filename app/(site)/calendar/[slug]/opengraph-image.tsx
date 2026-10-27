import { findEvent } from "@/lib/content";
import { formatEventWhen } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { eventOgPhoto } from "@/lib/encore/og-photo";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findEvent(slug);
  if (!found || found.kind === "moved") return brandOgImage({ eyebrow: "Encore Arts Calendar", title: "Not on the calendar." });
  const e = found.event;
  return brandOgImage({
    eyebrow: `Encore Arts Calendar · ${marketName(e.venue.market)}`,
    title: e.title,
    meta: found.kind === "closed" ? `Closed · ${e.venue.name}` : `${formatEventWhen(e.startsAt, e.endsAt, e.allDay)} · ${e.venue.name}`,
    photo: await eventOgPhoto(e),
  });
}
