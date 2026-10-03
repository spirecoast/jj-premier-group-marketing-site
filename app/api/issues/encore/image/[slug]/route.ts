import { getEvent } from "@/lib/content";
import { formatEventWhen } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { eventOgPhoto } from "@/lib/encore/og-photo";
import { brandOgImage } from "@/lib/og";
import { absoluteUrl } from "@/lib/seo";

/**
 * GET /api/issues/encore/image/<slug>: the lead pick's picture for the Monday
 * issue, as a PNG (email clients don't render SVG). The same composition as
 * the event's share image (app/(site)/calendar/[slug]/opengraph-image.tsx):
 * the venue's photo or the Encore key art, with the title and the date. A
 * stable URL, unlike the share image's build-hashed one, so an issue sent
 * months ago still shows its picture. Public: it carries only what the
 * event page does. An unknown slug redirects to the site's share image,
 * never a broken image.
 *
 * The handler reads nothing from the request, so it is static: rendered on
 * the first open of each slug, then served from the cache for a day.
 */

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = /^[a-z0-9-]{1,160}$/.test(slug) ? await getEvent(slug) : undefined;
  if (!e) return Response.redirect(absoluteUrl("/og-image.png"), 307);
  return brandOgImage({
    eyebrow: `Encore Arts Calendar · ${marketName(e.venue.market)}`,
    title: e.title,
    meta: `${formatEventWhen(e.startsAt, e.endsAt, e.allDay)} · ${e.venue.name}`,
    photo: await eventOgPhoto(e),
  });
}
