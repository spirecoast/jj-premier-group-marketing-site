import { getUpcomingEvents } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 86400;

/** Encore's card: the calendar's own masthead photograph and the season's count, from the data. */
export default async function Image() {
  const events = await getUpcomingEvents();
  return brandOgImage({
    eyebrow: "Encore Arts Calendar",
    title: "Theater, music and art on the coast.",
    meta: `${events.length.toLocaleString("en-US")} productions coming up · Lakewood Ranch, Sarasota, Bradenton`,
    photo: "/images/library/culture-opera-house-red-seats.jpg",
  });
}
