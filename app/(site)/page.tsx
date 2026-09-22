import type { Metadata } from "next";
import { CalendarPreview } from "@/components/home/calendar-preview";
import { FindHome } from "@/components/home/find-home";
import { Hero } from "@/components/home/hero";
import { LetterBand } from "@/components/home/letter-band";
import { Meet } from "@/components/home/meet";
import { Places } from "@/components/home/places";
import { getPosts, getTeam, getTestimonials, getUpcomingEvents } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `${site.name} · ${site.brokerage} · Lakewood Ranch, Sarasota, Bradenton`,
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

/* Photography for the composed sections. Event photographs come from the
   content layer; these frames are the layout. */
const FRAMES = {
  hero: img("library/venice-pier-sunrise", "A fishing pier reaching into the Gulf at sunrise, gulls over the water", "62% 55%"),
  cameo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 42%"),
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 14%"),
  kitchen: img("library/kitchen-white-palms", "A white kitchen with the palms outside the window"),
  island: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
  pool: img("library/modern-home-pool-dusk", "A modern home lit at dusk, the pool still", "50% 45%"),
};

export default async function HomePage() {
  const [team, events, posts, testimonials] = await Promise.all([
    getTeam(),
    getUpcomingEvents({ limit: 4, featuredFirst: true }),
    getPosts(),
    getTestimonials(),
  ]);
  const latestReport = posts.find((p) => p.categories.includes("Market report")) ?? posts[0];

  return (
    <>
      <Hero image={FRAMES.hero} cameo={FRAMES.cameo} team={team} />
      <Meet duo={FRAMES.duo} testimonials={testimonials} />
      <Places />
      <FindHome kitchen={FRAMES.kitchen} second={FRAMES.island} caption="THE KITCHEN, LATE AFTERNOON" />
      <CalendarPreview events={events} />
      <LetterBand image={FRAMES.pool} latest={latestReport} />
    </>
  );
}
