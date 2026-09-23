import type { Neighborhood } from "../types";
import { img, p } from "./helpers";

/**
 * Neighborhood overviews are strictly factual: geography, HOA mechanics,
 * master-plan history, distances. No demographic framing, no "good for"
 * language, no school-quality claims (Fair Housing, lib/fair-housing.ts).
 */
export const NEIGHBORHOODS: Neighborhood[] = [
  {
    _id: "neighborhood-lake-club",
    name: "The Lake Club",
    slug: "lake-club",
    market: "lakewood-ranch",
    tagline: "The gated village on the lakes, east of Lorraine Road.",
    hero: img("library/lwr-lakefront-row", "Lakefront homes in The Lake Club"),
    overview: p(
      "The Lake Club is a gated village on the east side of Lakewood Ranch, built out between 2006 and 2022 around a chain of lakes and preserve. Lots run from a quarter acre to over an acre, and most streets end at water.",
      "The HOA owns the Grande Clubhouse, two pools, tennis and pickleball, and a fitness building; membership is included with the property. Lakewood Ranch Golf and Country Club is a separate, optional membership.",
      "Main Street is eleven minutes west, Waterside Place fourteen minutes south, and the Sarasota airport about thirty-five.",
    ),
    highlights: [
      { label: "Built", description: "2006–2022, several builders, custom lots on the east side" },
      { label: "HOA", description: "Grande Clubhouse, two pools, racquet sports; fees include amenities" },
      { label: "Water", description: "Chain of lakes and preserve edge on most streets" },
      { label: "Distance", description: "Main Street and Waterside are minutes away; the airport is an easy drive" },
    ],
    faqs: [
      { q: "Is The Lake Club gated, and what does the HOA include?", answer: "Yes. The Lake Club is a gated village, and the HOA owns the Grande Clubhouse, two pools, tennis and pickleball courts and a fitness building. Membership in those comes with the property. Golf and the country club are a separate, optional membership." },
      { q: "Do I have to join the golf club to live there?", answer: "No. Lakewood Ranch Golf and Country Club is optional and separate from the HOA. Ask us for the current membership terms before you count on them, since they change." },
      { q: "How far is it from Main Street and the airport?", answer: "Main Street is a short drive west and Waterside Place is a short drive south. Sarasota Bradenton International is the closest airport. We'll give you drive times at the hour you'd actually be making the trip." },
    ],
  },
  {
    _id: "neighborhood-country-club-east",
    name: "Country Club East",
    slug: "country-club-east",
    market: "lakewood-ranch",
    tagline: "Golf-course lots inside the gate, with the clubhouse a bike ride away.",
    hero: img("library/listing-aerial-lot-morning", "A Country Club East lot from above"),
    overview: p(
      "Country Club East sits between Lorraine Road and the preserve, with homes built from 2007 onward along the Royal Lakes and Royal Reserve courses. Most lots face a fairway, a lake, or both.",
      "The HOA maintains the Retreat, a resident clubhouse with a pool and fitness room. Golf and the main clubhouse are through Lakewood Ranch Golf and Country Club, an optional equity membership.",
    ),
    highlights: [
      { label: "Built", description: "2007 onward; the last custom lots closed in 2021" },
      { label: "HOA", description: "The Retreat clubhouse, pool, fitness; gated" },
      { label: "Golf", description: "Optional equity membership, two courses inside the gate" },
      { label: "Distance", description: "Minutes to Main Street; the airport is an easy drive" },
    ],
    faqs: [
      { q: "What does the HOA in Country Club East cover?", answer: "The HOA maintains the Retreat, a resident clubhouse with a pool and fitness room, and the gate. Golf and the main clubhouse are through Lakewood Ranch Golf and Country Club, which is an optional equity membership." },
      { q: "Do the lots back onto the golf course?", answer: "Most lots face a fairway, a lake or both, along the Royal Lakes and Royal Reserve courses. Which one you face, and from which direction, changes the afternoon light and the view. We walk it with you before you decide." },
      { q: "Is there anything still being built?", answer: "The last custom lots closed in 2021, so what you're buying is a resale. That means a real house to inspect and a real HOA history to read, which we prefer." },
    ],
  },
  {
    _id: "neighborhood-waterside",
    name: "Waterside",
    slug: "waterside",
    market: "lakewood-ranch",
    county: "Sarasota County",
    tagline: "The newest villages, on the Sarasota County side, around a town center you can walk to.",
    hero: img("library/lwr-waterside-promenade", "The promenade at Waterside Place"),
    overview: p(
      "Waterside is the Sarasota County portion of Lakewood Ranch, opened in 2017 around seven lakes and the Waterside Place town center. Villages include Lakehouse Cove, Shoreview, Wild Blue and Emerald Landing; each has its own HOA and amenity center.",
      "The Sunday Farmers' Market and the lakefront promenade are the reason most people ask about it. University Town Center is ten minutes north and the interstate is at Fruitville Road.",
    ),
    highlights: [
      { label: "Built", description: "2017 onward, still building in Wild Blue and Emerald Landing" },
      { label: "HOA", description: "Per village; most include a clubhouse and pool" },
      { label: "Town center", description: "Waterside Place, Sunday market, water taxi across Kingfisher Lake" },
      { label: "Distance", description: "Close to UTC; downtown Sarasota and the airport are a short drive" },
    ],
    faqs: [
      { q: "Which county is Waterside in, and why does it matter?", answer: "Waterside is the Sarasota County side of Lakewood Ranch. The county sets the property tax rate and some permitting rules, so a Waterside address works differently from a Manatee County address a mile north." },
      { q: "Is there one HOA for all of Waterside?", answer: "No. Each village, such as Lakehouse Cove, Shoreview, Wild Blue and Emerald Landing, has its own HOA and its own amenity center. Ask for the budget and rules of the specific village, not Waterside in general." },
      { q: "Can you walk to Waterside Place?", answer: "From some villages, yes, along the lakefront promenade. From others it's a bike ride or a short drive. The Sunday Farmers' Market is at Waterside Place, and the water taxi crosses Kingfisher Lake." },
    ],
  },
  {
    _id: "neighborhood-siesta-key",
    name: "Siesta Key",
    slug: "siesta-key",
    market: "sarasota",
    tagline: "Eight miles of barrier island, two bridges, and canals that reach the bay.",
    hero: img("library/place-barrier-island", "The barrier island shoreline"),
    overview: p(
      "Siesta Key is the barrier island south-west of downtown Sarasota, connected by the north and south bridges. The north end is mostly single-family canal streets; the village and the condominium towers cluster mid-island; the south end runs to Turtle Beach.",
      "Most of the island is in flood zone AE or VE, and newer construction is elevated. Canal depth and bridge clearance vary street by street, which is the first question we ask about any waterfront listing here.",
    ),
    highlights: [
      { label: "Water", description: "Gulf beach on the west, Roberts Bay and canals on the east" },
      { label: "Flood", description: "Mostly AE and VE; check elevation certificates" },
      { label: "Access", description: "Two bridges; north bridge to downtown in 12 min" },
      { label: "Housing", description: "Canal homes, mid-island condominiums, village cottages" },
    ],
    faqs: [
      { q: "What flood zone is Siesta Key in?", answer: "Most of the island is in zone AE or VE, so flood insurance is required with a mortgage and the elevation certificate decides the premium. Newer construction is elevated. We ask for the certificate before you make an offer." },
      { q: "Can I get a boat out to the bay from a canal home?", answer: "Depends on the street. Canal depth and bridge clearance vary, and some canals are fine for a skiff but not for anything with a tower. Tell us the boat and we'll tell you which streets work." },
      { q: "How long does it take to get downtown?", answer: "The north bridge puts you in downtown Sarasota in a few minutes outside of beach traffic. Season and weekend beach traffic are the real variable, so we time the drive for you on a day that looks like your life." },
    ],
  },
  {
    _id: "neighborhood-west-of-the-trail",
    name: "West of the Trail",
    slug: "west-of-the-trail",
    market: "sarasota",
    tagline: "The streets between Tamiami Trail and the bay, from downtown south to Siesta Drive.",
    hero: img("library/place-oak-canopy", "A street under the oak canopy west of the Trail"),
    overview: p(
      "West of the Trail describes the neighborhoods between US 41 and Sarasota Bay south of downtown: Harbor Acres, Cherokee Park, Avondale, McClellan Park, Granada and others. Streets were platted from the 1920s onward and the housing is a mix of original block ranches and new construction on the same lots.",
      "Most of the area is outside the special flood hazard zone away from the immediate bayfront. Selby Gardens, Southside Village and the hospital are inside it.",
    ),
    highlights: [
      { label: "Built", description: "1920s plats; steady rebuilding since 2010" },
      { label: "HOA", description: "None in most sections" },
      { label: "Flood", description: "Mostly zone X; AE along the bayfront" },
      { label: "Distance", description: "Minutes to downtown and to Siesta Key" },
    ],
    faqs: [
      { q: "Is there an HOA West of the Trail?", answer: "Most sections have none. Harbor Acres, Cherokee Park, Avondale, McClellan Park and Granada were platted from the 1920s onward, before the HOA era, so you're buying the lot and the house without dues or an architectural review." },
      { q: "What flood zone are these streets in?", answer: "Away from the immediate bayfront, most of the area is zone X, outside the special flood hazard area. The bayfront itself is AE. We check the parcel, not the neighborhood name, before you write an offer." },
      { q: "Are the houses original or new?", answer: "Both, often side by side. Original block ranches sit next to new construction on the same size lots. The lot and the street are what you're paying for, and both kinds of house have a case." },
    ],
  },
  {
    _id: "neighborhood-west-bradenton",
    name: "West Bradenton",
    slug: "west-bradenton",
    market: "bradenton",
    tagline: "Canal streets west of 75th, Palma Sola Bay, and the island bridge eight minutes away.",
    hero: img("library/bradenton-canal-ranch-twilight", "A canal-front ranch in West Bradenton at twilight"),
    overview: p(
      "West Bradenton runs from 75th Street West to Palma Sola Bay, a grid of 1960s and 1970s subdivisions with canals cut to the bay. Most lots are a quarter acre, most houses are single-level block, and there’s no HOA on the older streets.",
      "Flood zones vary block to block; several canal streets sit in zone X, which changes the insurance conversation. The Anna Maria bridge is at the end of Manatee Avenue.",
    ),
    highlights: [
      { label: "Built", description: "1960s–1970s, single-level block; rebuilds increasing" },
      { label: "HOA", description: "None on most streets" },
      { label: "Water", description: "Canals to Palma Sola Bay; bridge clearance varies" },
      { label: "Distance", description: "A short drive to Anna Maria and to downtown Bradenton" },
    ],
    faqs: [
      { q: "Is there an HOA in West Bradenton?", answer: "Not on most of the older streets. The subdivisions were built in the 1960s and 1970s, so you get a quarter-acre lot, a single-level block house and no dues or rules beyond the county's." },
      { q: "Which canal streets are in flood zone X?", answer: "Several are, and it changes the insurance conversation. Zones vary block to block, so we check the parcel and ask for an elevation certificate before you get attached to a house." },
      { q: "Can I get a boat to Palma Sola Bay?", answer: "The canals were cut to the bay, but bridge clearance and depth vary by street. Tell us the boat and we'll narrow it to the streets that work." },
    ],
  },
  {
    _id: "neighborhood-downtown-bradenton",
    name: "Downtown Bradenton",
    slug: "downtown-bradenton",
    market: "bradenton",
    tagline: "The Riverwalk, the Village of the Arts, and the county's theater in ten square blocks.",
    hero: img("library/bradenton-riverwalk-golden", "The Bradenton Riverwalk"),
    overview: p(
      "Downtown Bradenton sits on the south bank of the Manatee River, with the Riverwalk along the water, Old Main Street running south, and the Village of the Arts beyond 9th Avenue. Housing is condominiums on the river, 1920s bungalows in the Village, and new townhouse infill.",
      "The Manatee Performing Arts Center and the Bishop Museum are both downtown. Lakewood Ranch is twenty-five minutes east on State Road 64.",
    ),
    highlights: [
      { label: "Housing", description: "River condominiums, 1920s cottages, townhouse infill" },
      { label: "Culture", description: "Riverwalk amphitheater, Manatee PAC, Village of the Arts" },
      { label: "Flood", description: "AE along the river; X south of 6th Avenue" },
      { label: "Distance", description: "Lakewood Ranch is a short drive east on State Road 64" },
    ],
    faqs: [
      { q: "What kind of housing is downtown?", answer: "Condominiums on the river, 1920s bungalows in the Village of the Arts, and new townhouse infill between them. Each has a different set of documents to read before you buy, and we read them with you." },
      { q: "What's the flood situation by the river?", answer: "Zone AE along the Manatee River, zone X south of 6th Avenue. For a river condominium, the building's insurance and reserves matter as much as the zone, and we ask for both." },
      { q: "Is there anything to do downtown at night?", answer: "The Riverwalk, the Manatee Performing Arts Center and the Village of the Arts are all within a few blocks. Our Encore calendar lists what's on there." },
    ],
  },
  {
    _id: "neighborhood-anna-maria-island",
    name: "Anna Maria Island",
    slug: "anna-maria-island",
    market: "bradenton",
    tagline: "Seven miles of island, three cities, and a height limit that keeps it low.",
    hero: img("library/place-sea-oats-wind", "Sea oats in the wind on Anna Maria Island"),
    overview: p(
      "Anna Maria Island is the barrier island at the mouth of Tampa Bay, made up of the cities of Anna Maria, Holmes Beach and Bradenton Beach. A three-story height limit and small lots keep the housing to cottages, elevated new construction and low condominiums.",
      "The whole island is in a special flood hazard zone, and post-2016 construction is elevated to the current code. Short-term rental rules differ by city.",
    ),
    highlights: [
      { label: "Cities", description: "Anna Maria, Holmes Beach, Bradenton Beach" },
      { label: "Flood", description: "AE and VE island-wide; elevated construction since 2016" },
      { label: "Rentals", description: "Rules differ by city; ask before assuming" },
      { label: "Access", description: "Manatee Avenue and Cortez Road bridges" },
    ],
    faqs: [
      { q: "Can I rent my house short-term on Anna Maria Island?", answer: "The rules differ by city. Anna Maria, Holmes Beach and Bradenton Beach each set their own, and they change. We check the current ordinance for the exact address before you plan around rental income." },
      { q: "Is the whole island in a flood zone?", answer: "Yes. The whole island is in a special flood hazard zone, AE or VE, and construction since 2016 is elevated to the current code. The elevation certificate and the roof's age drive the insurance quote." },
      { q: "Why are there no tall buildings?", answer: "A three-story height limit and small lots keep the housing to cottages, elevated new construction and low condominiums. It's the reason the island looks the way it does, and it's not changing." },
    ],
  },
];
