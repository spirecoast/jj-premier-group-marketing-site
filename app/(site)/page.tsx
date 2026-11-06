import type { Metadata } from "next";
import { CalendarPreview } from "@/components/home/calendar-preview";
import { Doors } from "@/components/home/doors";
import { FindHome } from "@/components/home/find-home";
import { Hero } from "@/components/home/hero";
import { LetterBand } from "@/components/home/letter-band";
import { Meet } from "@/components/home/meet";
import { Places } from "@/components/home/places";
import { Questions } from "@/components/home/questions";
import { WorkWith } from "@/components/home/work-with";
import { getFeaturedListings, getSiteSettings, getTeam, getUpcomingEvents } from "@/lib/content";
import { loadEncoreSnapshot } from "@/lib/encore/live";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `${site.name} · Lakewood Ranch, Sarasota and Bradenton`,
  description: site.description,
  path: "/",
  absoluteTitle: true,
  fileImage: true, // opengraph-image.tsx beside this page
});

/* Photography for the composed sections. Event photographs come from the
   content layer; these frames are the layout. */
const FRAMES = {
  hero: img("library/gulf-beach-aerial", "A Gulf beach from the air, the water in three shades of green", "58% 45%"),
  cameo: img("photos/duo-whitenavy-cameo", "Joelyn Nauman and Jessica Garza", "50% 50%"),
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 14%"),
  kitchen: img("library/kitchen-white-palms", "A white kitchen with the palms outside the window"),
  island: img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%"),
};

/* The hero's video: the Life Here montage, over its first frame (docs/SITE.md, "The home hero").
   `site.homeHero` chooses between it and the photograph above. Phones held
   upright get the portrait cut and its own first frame (lib/hero-video.ts). */
const HERO_VIDEO = {
  desktop: "/video/life-here-4-1080.mp4",
  phone: "/video/life-here-4-720.mp4",
  portrait: "/video/life-here-4-portrait.mp4",
  poster: img("library/life-here-4-poster", "Waterfront homes and boat docks on Sarasota Bay, with the downtown towers behind", "50% 50%"),
  posterPortrait: img("library/life-here-4-poster-portrait", "Waterfront homes and boat docks on Sarasota Bay, with the downtown towers behind"),
};

export default async function HomePage() {
  // The Encore pieces below (the season ring, tonight's count) read the snapshot loaded here.
  const [team, events, settings, featured] = await Promise.all([
    getTeam(),
    getUpcomingEvents({ limit: 4, featuredFirst: true, distinctVenues: true, datedFirst: true }),
    getSiteSettings(),
    // Three of the team's own listings under Find your home; none until an agent has entered some.
    getFeaturedListings(3),
    loadEncoreSnapshot(),
  ]);

  /* The order: hero · Meet Joelyn & Jessica · Buyer, seller or moving here · Areas of
     expertise · Find your home · Work with Joelyn & Jessica · Encore · Tide ·
     the questions people ask first. No eyebrows: each section's title or
     photograph says what it is. */
  return (
    <>
      <Hero
        picture={site.homeHero === "video" ? { kind: "video", clip: HERO_VIDEO } : { kind: "photo", image: FRAMES.hero }}
        cameo={FRAMES.cameo}
        team={team}
      />
      <Meet duo={FRAMES.duo} />
      <Doors />
      <Places />
      <FindHome image={FRAMES.kitchen} featured={featured} />
      <WorkWith phoneDisplay={settings.primaryPhoneDisplay} phoneE164={settings.primaryPhoneE164} />
      <CalendarPreview events={events} />
      <LetterBand image={FRAMES.island} />
      <Questions />
    </>
  );
}
