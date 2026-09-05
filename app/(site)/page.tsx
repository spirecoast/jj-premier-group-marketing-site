import type { Metadata } from "next";
import { CalendarPreview } from "@/components/home/calendar-preview";
import { FourMarkets } from "@/components/home/four-markets";
import { Hero } from "@/components/home/hero";
import { LetterBand } from "@/components/home/letter-band";
import { OnTheMarket } from "@/components/home/on-the-market";
import { SearchSplit } from "@/components/home/search-split";
import { WhoYouAreHiring } from "@/components/home/who-you-are-hiring";
import { Marquee } from "@/components/marquee";
import {
  getActiveListingCount,
  getFeaturedListings,
  getPosts,
  getRecentSolds,
  getSiteSettings,
  getTeam,
  getTestimonials,
  getUpcomingEvents,
} from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/** Hourly ISR: the sample calendar is relative to the request, and Sanity content is also expired by webhook. */
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `${site.name} · ${site.brokerage} · Lakewood Ranch, Sarasota, Bradenton, Tampa`,
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

/* Editorial photography for the composed sections. Listing and event
   photographs come from the content layer; these frames are the layout. */
const FRAMES = {
  hero: img("library/listing-hero-estate-twilight", "A lakefront estate at twilight, lights on", "62% 58%"),
  cameo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 42%"),
  kitchen: img("library/listing-kitchen-4pm-island", "A kitchen island at four in the afternoon"),
  bath: img("library/listing-primary-bath-terrazzo", "A primary bath with terrazzo floors"),
  skyway: img("library/tampa-skyway-sunrise", "The Sunshine Skyway Bridge at sunrise", "50% 60%"),
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 14%"),
  river: img("library/manatee-river-dusk", "The Manatee River at dusk", "50% 45%"),
};

export default async function HomePage() {
  const [settings, team, featured, solds, events, posts, testimonials, count] = await Promise.all([
    getSiteSettings(),
    getTeam(),
    getFeaturedListings(6),
    getRecentSolds(3),
    getUpcomingEvents({ limit: 4, featuredFirst: true }),
    getPosts(),
    getTestimonials(),
    getActiveListingCount(),
  ]);
  const bestSold = [...solds].sort((a, b) => (b.percentOfList ?? 0) - (a.percentOfList ?? 0))[0];
  // The mosaic leads with the largest frame; the hero card lists the newest.
  const mosaic = [...featured].sort((a, b) => b.price - a.price).slice(0, 4);
  const latestLetter = posts.find((p) => p.categories.includes("Market letter")) ?? posts[0];

  return (
    <>
      <Hero image={FRAMES.hero} cameo={FRAMES.cameo} team={team} listings={featured} listingCount={count} />
      <div className="bg-linen-200 px-gutter">
        <Marquee items={settings.ticker} />
      </div>
      <SearchSplit kitchen={FRAMES.kitchen} bath={FRAMES.bath} caption={`${featured.find((l) => l.market === "lakewood-ranch")?.title ?? "18 Cliffside Terrace"} · Kitchen, 4 pm`.toUpperCase()} />
      <OnTheMarket listings={mosaic} sold={bestSold} count={count} />
      <FourMarkets image={FRAMES.skyway} />
      <WhoYouAreHiring duo={FRAMES.duo} stats={settings.stats} testimonials={testimonials} />
      <CalendarPreview events={events} />
      <LetterBand image={FRAMES.river} latest={latestLetter} />
    </>
  );
}
