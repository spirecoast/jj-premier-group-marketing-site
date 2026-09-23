import type { Venue } from "../types";
import { img, p } from "./helpers";

/**
 * Real institutions, named properly (Compliance §08). Descriptions are about
 * the place, never a listing. Confirm addresses and websites against each
 * venue before publishing; these are sample records.
 */
export const VENUES: Venue[] = [
  {
    _id: "venue-van-wezel",
    name: "Van Wezel Performing Arts Hall",
    slug: "van-wezel",
    address: { street: "777 N Tamiami Trail", city: "Sarasota", state: "FL", zip: "34236" },
    geo: { lat: 27.3427, lng: -82.5478 },
    market: "sarasota",
    website: "https://www.vanwezel.org",
    image: img("library/culture-orchestra-hall-empty", "An empty concert hall before the performance"),
    about: p(
      "The purple hall on the bayfront, opened in 1970 and still the room the Sarasota Orchestra plays its Masterworks series in. The lobby faces the water, so arrive early and take the glass of wine outside.",
      "The back of the orchestra level is the best seat for the money. The acoustic is even and the sightline clears the heads in front.",
    ),
  },
  {
    _id: "venue-asolo-rep",
    name: "Asolo Repertory Theater",
    slug: "asolo-rep",
    address: { street: "5555 N Tamiami Trail", city: "Sarasota", state: "FL", zip: "34243" },
    geo: { lat: 27.3811, lng: -82.5622 },
    market: "sarasota",
    website: "https://www.asolorep.org",
    image: img("library/culture-theater-lobby-chandelier", "A theater lobby under a chandelier"),
    about: p(
      "Florida's largest repertory theater, on the Ringling grounds. The Mertz stage is the interior of a 1903 Scottish opera house, the Dunfermline, shipped over and rebuilt inside a modern building, which is a sentence worth reading twice.",
      "The season runs November to June. Parking is free and the museum next door is open late on Thursdays.",
    ),
  },
  {
    _id: "venue-sarasota-opera-house",
    name: "Sarasota Opera House",
    slug: "sarasota-opera-house",
    address: { street: "61 N Pineapple Ave", city: "Sarasota", state: "FL", zip: "34236" },
    geo: { lat: 27.3363, lng: -82.5397 },
    market: "sarasota",
    website: "https://www.sarasotaopera.org",
    image: img("library/culture-theater-lobby-chandelier", "The opera house lobby"),
    about: p(
      "A 1926 house on Pineapple Avenue, restored in 2008, with a company that has performed every note Verdi wrote. Downtown is a two-minute walk, so dinner before is easy.",
    ),
  },
  {
    _id: "venue-the-ringling",
    name: "The Ringling",
    slug: "the-ringling",
    address: { street: "5401 Bay Shore Rd", city: "Sarasota", state: "FL", zip: "34243" },
    geo: { lat: 27.3813, lng: -82.5645 },
    market: "sarasota",
    website: "https://www.ringling.org",
    image: img("library/culture-sculpture-garden-banyan", "A sculpture garden under banyan trees"),
    about: p(
      "The art museum, the circus museum, the house on the bay, and sixty-six acres of banyans. The courtyard is free on Mondays and the bayfront walk is free every day.",
    ),
  },
  {
    _id: "venue-selby-gardens",
    name: "Marie Selby Botanical Gardens",
    slug: "selby-gardens",
    address: { street: "1534 Mound St", city: "Sarasota", state: "FL", zip: "34236" },
    geo: { lat: 27.3268, lng: -82.539 },
    market: "sarasota",
    website: "https://selby.org",
    image: img("library/culture-outdoor-concert-lawn", "A concert on the lawn at dusk"),
    about: p(
      "Fifteen acres of orchids, bromeliads and mangroves on Sarasota Bay, with a lawn that hosts music through the winter. The new glasshouse opened in 2024.",
    ),
  },
  {
    _id: "venue-palm-avenue",
    name: "Palm Avenue galleries",
    slug: "palm-avenue-galleries",
    address: { street: "S Palm Ave", city: "Sarasota", state: "FL", zip: "34236" },
    geo: { lat: 27.3352, lng: -82.5409 },
    market: "sarasota",
    image: img("library/culture-gallery-opening-backs", "Visitors at a gallery opening"),
    about: p(
      "One block of galleries between Main Street and the bayfront, most of them open late on the first Friday of the month. Start at the south end and work north; the wine gets better as you go.",
    ),
  },
  {
    _id: "venue-manatee-pac",
    name: "Manatee Performing Arts Center",
    slug: "manatee-performing-arts-center",
    address: { street: "502 3rd Ave W", city: "Bradenton", state: "FL", zip: "34205" },
    geo: { lat: 27.4977, lng: -82.5714 },
    market: "bradenton",
    website: "https://www.manateeperformingartscenter.com",
    image: img("library/culture-black-box-worklight", "A black-box theater under a single work light"),
    about: p(
      "Home of the Manatee Players, a community theater company that has been putting on a full season since 1947. The Stone Hall main stage seats 360; the black box downstairs is where the interesting choices happen.",
    ),
  },
  {
    _id: "venue-village-of-the-arts",
    name: "Village of the Arts",
    slug: "village-of-the-arts",
    address: { street: "12th St W", city: "Bradenton", state: "FL", zip: "34205" },
    geo: { lat: 27.4885, lng: -82.5738 },
    market: "bradenton",
    website: "https://villageofthearts.com",
    image: img("library/bradenton-village-arts", "Painted cottages in Bradenton's Village of the Arts"),
    about: p(
      "Thirty blocks of 1920s cottages south of downtown Bradenton, zoned live-work since 1999, so the studios are also homes. ArtWalk runs the first Friday evening and Saturday afternoon of every month.",
    ),
  },
  {
    _id: "venue-bradenton-riverwalk",
    name: "Bradenton Riverwalk",
    slug: "bradenton-riverwalk",
    address: { street: "452 3rd Ave W", city: "Bradenton", state: "FL", zip: "34205" },
    geo: { lat: 27.5006, lng: -82.5709 },
    market: "bradenton",
    website: "https://realizebradenton.com",
    image: img("library/bradenton-riverwalk-golden", "The Bradenton Riverwalk at golden hour"),
    about: p(
      "A mile and a half of park along the Manatee River, with an amphitheater, a skate park, and the best sunset bench in the county at the west end.",
    ),
  },
  {
    _id: "venue-waterside-place",
    name: "Waterside Place",
    slug: "waterside-place",
    address: { street: "1561 Lakefront Dr", city: "Lakewood Ranch", state: "FL", zip: "34240" },
    geo: { lat: 27.3986, lng: -82.411 },
    market: "lakewood-ranch",
    website: "https://www.watersideplace.com",
    image: img("library/lwr-waterside-promenade", "The lakefront promenade at Waterside Place"),
    about: p(
      "The lakefront town center on the Sarasota County side of the Ranch. The Farmers' Market takes over the promenade every Sunday, ten till two.",
    ),
  },
  {
    _id: "venue-lwr-main-street",
    name: "Lakewood Ranch Main Street",
    slug: "lakewood-ranch-main-street",
    address: { street: "8100 Lakewood Main St", city: "Lakewood Ranch", state: "FL", zip: "34202" },
    geo: { lat: 27.3902, lng: -82.4437 },
    market: "lakewood-ranch",
    image: img("library/lwr-main-street-dawn", "Lakewood Ranch Main Street at dawn"),
    about: p(
      "The original town center, four blocks of restaurants and shops with the cinema at one end. Music on Main closes the street on the first Friday of the month.",
    ),
  },
  {
    _id: "venue-straz-center",
    name: "Straz Center for the Performing Arts",
    slug: "straz-center",
    address: { street: "1010 N W.C. MacInnes Pl", city: "Tampa", state: "FL", zip: "33602" },
    geo: { lat: 27.9532, lng: -82.4602 },
    market: "tampa",
    website: "https://www.strazcenter.org",
    image: img("library/tampa-riverwalk-dusk", "The Tampa Riverwalk at dusk"),
    about: p(
      "Five theaters on the Riverwalk, from the 2,600-seat Morsani Hall to the Jaeb cabaret. The Broadway series is the reason most people go; the opera and the ballet are the reason to go back.",
    ),
  },
  {
    _id: "venue-tampa-theatre",
    name: "Tampa Theatre",
    slug: "tampa-theatre",
    address: { street: "711 N Franklin St", city: "Tampa", state: "FL", zip: "33602" },
    geo: { lat: 27.9487, lng: -82.4586 },
    market: "tampa",
    website: "https://tampatheatre.org",
    image: img("library/culture-theater-lobby-chandelier", "A theater lobby under a chandelier"),
    about: p(
      "A 1926 movie palace on Franklin Street with a ceiling painted as a night sky and a Wurlitzer that rises before the film. Sit in the balcony; the stars are closer.",
    ),
  },
];

export const venueBySlug = (slug: string) => VENUES.find((v) => v.slug === slug);
