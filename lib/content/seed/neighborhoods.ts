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
  },
  {
    _id: "neighborhood-west-bradenton",
    name: "West Bradenton",
    slug: "west-bradenton",
    market: "bradenton",
    tagline: "Canal streets west of 75th, Palma Sola Bay, and the island bridge eight minutes away.",
    hero: img("library/bradenton-canal-ranch-twilight", "A canal-front ranch in West Bradenton at twilight"),
    overview: p(
      "West Bradenton runs from 75th Street West to Palma Sola Bay, a grid of 1960s and 1970s subdivisions with canals cut to the bay. Most lots are a quarter acre, most houses are single-level block, and there is no HOA on the older streets.",
      "Flood zones vary block to block; several canal streets sit in zone X, which changes the insurance conversation. The Anna Maria bridge is at the end of Manatee Avenue.",
    ),
    highlights: [
      { label: "Built", description: "1960s–1970s, single-level block; rebuilds increasing" },
      { label: "HOA", description: "None on most streets" },
      { label: "Water", description: "Canals to Palma Sola Bay; bridge clearance varies" },
      { label: "Distance", description: "A short drive to Anna Maria and to downtown Bradenton" },
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
  },
];
