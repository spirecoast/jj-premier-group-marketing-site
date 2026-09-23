import type { Event, EventCategory, ImageRef, RichText } from "../types";
import { img, iso, next, p, plusHours } from "./helpers";
import { venueBySlug } from "./venues";

type SeedEvent = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  venue: string;
  category: EventCategory;
  /** Weekday (0 = Sunday) and offsets, resolved against the request time. */
  when: { weekday: number; weeks?: number; hour?: number; minute?: number };
  hours?: number;
  allDay?: boolean;
  ticketUrl?: string;
  priceNote?: string;
  image?: ImageRef;
  source?: string;
  sourceUrl?: string;
  featured?: boolean;
  description?: RichText;
};

/**
 * Sample calendar. Dates are resolved relative to the request so the seed
 * always reads as upcoming; titles and venues are plausible for the current
 * season and must be confirmed against each venue's own calendar before
 * publishing.
 */
const SEED: SeedEvent[] = [
  {
    _id: "event-sarasota-orchestra-masterworks",
    title: "Sarasota Orchestra, Masterworks opening night",
    slug: "sarasota-orchestra-masterworks-opening",
    summary: "The hall before the performance, and why the back row is the best seat.",
    venue: "van-wezel",
    category: "music",
    when: { weekday: 4, hour: 19, minute: 30 },
    hours: 2.5,
    priceNote: "From $35",
    ticketUrl: "https://www.vanwezel.org",
    image: img("library/culture-orchestra-hall-empty", "The Van Wezel hall before a performance"),
    source: "Van Wezel Performing Arts Hall",
    sourceUrl: "https://www.vanwezel.org",
    featured: true,
    description: p(
      "The orchestra opens its season on the bayfront. Doors at 6:30; the lobby bar faces the water and the sunset lands around seven, so arrive early.",
      "Our seat: rear orchestra, house left. The acoustic is even back there and the balcony overhang keeps the brass honest.",
    ),
  },
  {
    _id: "event-manatee-players-opening",
    title: "Manatee Players, opening night",
    slug: "manatee-players-opening-night",
    summary: "The county's community theater opens its season on the Stone Hall stage.",
    venue: "manatee-performing-arts-center",
    category: "theater",
    when: { weekday: 5, hour: 19, minute: 30 },
    hours: 2.5,
    priceNote: "$25–$40",
    ticketUrl: "https://www.manateeperformingartscenter.com",
    image: img("library/culture-black-box-worklight", "A stage under a single work light"),
    source: "Manatee Performing Arts Center",
    featured: true,
    description: p(
      "Seventy-nine seasons in, the Players still cast from the county. Opening nights sell out the center section; the side blocks have the same sightline for less.",
    ),
  },
  {
    _id: "event-palm-avenue-new-show",
    title: "A new show on Palm Avenue",
    slug: "palm-avenue-new-show",
    summary: "First Friday on the gallery block. Start at the south end and work north.",
    venue: "palm-avenue-galleries",
    category: "gallery",
    when: { weekday: 5, hour: 18 },
    hours: 3,
    priceNote: "Free",
    image: img("library/culture-gallery-opening-backs", "Visitors at a gallery opening"),
    source: "Palm Avenue galleries",
    featured: true,
    description: p(
      "Most of the block stays open until nine. Park in the Palm Avenue garage and walk; the street is closed to cars from six.",
    ),
  },
  {
    _id: "event-farmers-market-lwr",
    title: "The Farmers' Market at Lakewood Ranch",
    slug: "farmers-market-lakewood-ranch",
    summary: "The Market at Waterside, ten till two. Bread from Bradenton, tomatoes from Parrish.",
    venue: "waterside-place",
    category: "market",
    when: { weekday: 0, hour: 10 },
    hours: 4,
    priceNote: "Free",
    image: img("library/lwr-waterside-promenade", "The promenade at Waterside Place"),
    source: "Waterside Place",
    sourceUrl: "https://www.watersideplace.com",
    featured: true,
    description: p(
      "Every Sunday on the lakefront promenade. Ninety-odd vendors, live music by the water from eleven, and the good bread is gone by noon.",
    ),
  },
  {
    _id: "event-asolo-season-opener",
    title: "Asolo Rep, season opener",
    slug: "asolo-rep-season-opener",
    summary: "The Mertz stage, a 1903 Scottish opera-house interior rebuilt inside a modern building.",
    venue: "asolo-rep",
    category: "theater",
    when: { weekday: 3, weeks: 1, hour: 19, minute: 30 },
    hours: 2.5,
    priceNote: "From $39",
    ticketUrl: "https://www.asolorep.org",
    image: img("library/culture-theater-lobby-chandelier", "A theater lobby under a chandelier"),
    source: "Asolo Repertory Theater",
    sourceUrl: "https://www.asolorep.org",
  },
  {
    _id: "event-music-on-main",
    title: "Music on Main, first Friday",
    slug: "music-on-main-first-friday",
    summary: "Main Street closes to cars at six. A band, a beer tent, and the cinema open late.",
    venue: "lakewood-ranch-main-street",
    category: "festival",
    when: { weekday: 5, weeks: 1, hour: 18 },
    hours: 3,
    priceNote: "Free",
    image: img("library/lwr-main-street-dawn", "Lakewood Ranch Main Street"),
    source: "Lakewood Ranch Main Street",
  },
  {
    _id: "event-ringling-art-after-5",
    title: "The Ringling, Art After 5",
    slug: "ringling-art-after-5",
    summary: "The museum stays open until eight on Thursdays. Music in the courtyard, the bay for free.",
    venue: "the-ringling",
    category: "gallery",
    when: { weekday: 4, weeks: 1, hour: 17 },
    hours: 3,
    priceNote: "$5 after 5",
    ticketUrl: "https://www.ringling.org",
    image: img("library/culture-sculpture-garden-banyan", "The courtyard under banyans"),
    source: "The Ringling",
    sourceUrl: "https://www.ringling.org",
  },
  {
    _id: "event-selby-evening-hours",
    title: "Selby Gardens, evening hours on the bayfront",
    slug: "selby-gardens-evening-hours",
    summary: "The mangrove walk at dusk and the glasshouse lit from inside.",
    venue: "selby-gardens",
    category: "family",
    when: { weekday: 6, weeks: 1, hour: 17, minute: 30 },
    hours: 3,
    priceNote: "Members free · $28",
    ticketUrl: "https://selby.org",
    image: img("library/culture-outdoor-concert-lawn", "The lawn at Selby Gardens at dusk"),
    source: "Marie Selby Botanical Gardens",
    sourceUrl: "https://selby.org",
  },
  {
    _id: "event-village-artwalk",
    title: "Village of the Arts, ArtWalk",
    slug: "village-of-the-arts-artwalk",
    summary: "Thirty blocks of studios that are also houses, open Friday evening and Saturday afternoon.",
    venue: "village-of-the-arts",
    category: "festival",
    when: { weekday: 5, weeks: 2, hour: 18 },
    hours: 3,
    priceNote: "Free",
    image: img("library/bradenton-village-arts", "Painted cottages in the Village of the Arts"),
    source: "Village of the Arts",
    sourceUrl: "https://villageofthearts.com",
  },
  {
    _id: "event-riverwalk-concert",
    title: "Riverwalk, evening concert on the lawn",
    slug: "bradenton-riverwalk-concert",
    summary: "Bring a chair. The amphitheater faces west and the sun sets behind the stage.",
    venue: "bradenton-riverwalk",
    category: "music",
    when: { weekday: 6, weeks: 2, hour: 18, minute: 30 },
    hours: 2.5,
    priceNote: "Free",
    image: img("library/bradenton-riverwalk-golden", "The Bradenton Riverwalk at golden hour"),
    source: "Realize Bradenton",
  },
  {
    _id: "event-sarasota-opera-fall",
    title: "Sarasota Opera, fall season opening",
    slug: "sarasota-opera-fall-opening",
    summary: "The 1926 house on Pineapple Avenue. Downtown is two minutes away on foot.",
    venue: "sarasota-opera-house",
    category: "music",
    when: { weekday: 5, weeks: 5, hour: 19, minute: 30 },
    hours: 3,
    priceNote: "From $25",
    ticketUrl: "https://www.sarasotaopera.org",
    image: img("library/culture-theater-lobby-chandelier", "The opera house lobby"),
    source: "Sarasota Opera",
    sourceUrl: "https://www.sarasotaopera.org",
  },
  {
    _id: "event-farmers-market-lwr-2",
    title: "The Farmers' Market at Lakewood Ranch",
    slug: "farmers-market-lakewood-ranch-next",
    summary: "Sunday again on the promenade. The citrus starts to arrive this month.",
    venue: "waterside-place",
    category: "market",
    when: { weekday: 0, weeks: 1, hour: 10 },
    hours: 4,
    priceNote: "Free",
    image: img("library/lwr-waterside-promenade", "The promenade at Waterside Place"),
    source: "Waterside Place",
    sourceUrl: "https://www.watersideplace.com",
  },
];

/** Build the sample calendar relative to `from` (default: now). */
export function buildEvents(from: Date = new Date()): Event[] {
  return SEED.map((e) => {
  const venue = venueBySlug(e.venue);
  if (!venue) throw new Error(`Unknown venue ${e.venue}`);
  const starts = next(e.when.weekday, { ...e.when, from });
  return {
    _id: e._id,
    title: e.title,
    slug: e.slug,
    summary: e.summary,
    startsAt: iso(starts),
    endsAt: iso(plusHours(starts, e.hours ?? 2)),
    allDay: e.allDay ?? false,
    venue: {
      name: venue.name,
      slug: venue.slug,
      market: venue.market,
      address: venue.address,
      geo: venue.geo,
    },
    category: e.category,
    ticketUrl: e.ticketUrl,
    priceNote: e.priceNote,
    image: e.image,
    source: e.source,
    sourceUrl: e.sourceUrl,
    featured: e.featured ?? false,
    description: e.description,
  };
  });
}
