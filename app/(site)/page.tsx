import type { Metadata } from "next";
import { CalendarPreview } from "@/components/home/calendar-preview";
import { FindHome } from "@/components/home/find-home";
import { Hero } from "@/components/home/hero";
import { LetterBand } from "@/components/home/letter-band";
import { Meet } from "@/components/home/meet";
import { Places } from "@/components/home/places";
import { Questions } from "@/components/home/questions";
import { Three, type ThreeFacts } from "@/components/home/three";
import { getPosts, getTeam, getTestimonials, getUpcomingEvents } from "@/lib/content";
import { getEncoreIndex, localDay } from "@/lib/encore/data";
import { addDays, occurrences, shortDay, weekday } from "@/lib/encore/select";
import { getAllRecords, getIndexEntries } from "@/lib/neighborhoods/data";
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
  hero: img("library/lakes-aerial-sunset", "Lakes, lawns and rooftops at sunset, seen from the air", "50% 58%"),
  cameo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 42%"),
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 14%"),
  kitchen: img("library/kitchen-white-palms", "A white kitchen with the palms outside the window"),
  island: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
};

export default async function HomePage() {
  const [team, events, testimonials, posts, records, entries] = await Promise.all([
    getTeam(),
    getUpcomingEvents({ limit: 4, featuredFirst: true, distinctVenues: true, datedFirst: true }),
    getTestimonials(),
    getPosts(),
    getAllRecords(),
    getIndexEntries(),
  ]);
  const facts = threeFacts({ posts, records, entries });

  return (
    <>
      <Hero image={FRAMES.hero} cameo={FRAMES.cameo} team={team} />
      <Meet duo={FRAMES.duo} testimonials={testimonials} />
      <Places />
      <Three facts={facts} />
      <FindHome image={FRAMES.kitchen} />
      <Questions />
      <CalendarPreview events={events} />
      <LetterBand image={FRAMES.island} />
    </>
  );
}

/** The live numbers on the home band, from the same data the products run on. */
function threeFacts({
  posts,
  records,
  entries,
}: {
  posts: Awaited<ReturnType<typeof getPosts>>;
  records: Awaited<ReturnType<typeof getAllRecords>>;
  entries: Awaited<ReturnType<typeof getIndexEntries>>;
}): ThreeFacts {
  const index = getEncoreIndex();
  const today = localDay(Date.now());
  const now = Date.now();
  const tonight = occurrences(index, today, today, {}, now);
  const wd = weekday(today);
  const fri = wd === 0 ? addDays(today, -2) : wd === 6 ? addDays(today, -1) : addDays(today, 5 - wd);
  const sun = addDays(fri, 2);
  const weekend = occurrences(index, fri < today ? today : fri, sun, {}, now);
  const month = Number(today.slice(5, 7));
  const nextQuarterMonth = [1, 4, 7, 10].find((m) => m > month) ?? 1;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return {
    atlas: {
      places: records.length,
      areas: records.filter((r) => r.level === "area").length,
      points: entries.filter((e, i) => e.x !== null && e.y !== null && i % 3 === 0).map((e): [number, number] => [e.x!, e.y!]),
    },
    encore: {
      tonight: tonight.length,
      weekend: weekend.length,
      weekendLabel: wd >= 5 || wd === 0 ? "this weekend" : `${shortDay(fri)}–${sun.slice(8).replace(/^0/, "")}`,
      titles: [...new Set((tonight.length ? tonight : weekend).map((o) => o.e.t))].slice(0, 3),
    },
    tide: {
      nextMonth: MONTHS[nextQuarterMonth - 1]!,
      guides: posts.filter((p) => !p.categories.includes("Market report")).slice(0, 2).map((p) => ({ title: p.title, slug: p.slug })),
    },
  };
}
