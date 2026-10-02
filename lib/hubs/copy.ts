import type { MarketSlug } from "../content/types";

/**
 * The words on the three market hubs (/lakewood-ranch, /sarasota, /bradenton).
 *
 * Plain strings, no JSX and no imports beyond a type, so scripts/check-copy.mjs
 * can load this file and run the Fair Housing check over every sentence.
 *
 * Every factual sentence is drawn from a page already on the site or from a
 * source listed in `sources`; nothing here is a figure (no prices, medians or
 * counts of sales). Counts of places come from the Atlas dataset at build
 * time, in lib/hubs/data.ts, not from here. Places, never people.
 */
export type HubFaq = { q: string; answer: string };

export type HubSource = { label: string; href: string; supports: string };

export type HubCopy = {
  slug: MarketSlug;
  /** The <title>, before the site suffix. */
  title: string;
  description: string;
  /** Two sentences under the name: geography, never people. */
  orientation: [string, string];
  buying: string[];
  selling: string[];
  faqs: HubFaq[];
  /** Tide guide slugs, in order; the page keeps the ones the content source returns. */
  guides: string[];
  sources: HubSource[];
};

const STATUTE_MILESTONE = { label: "Florida Statutes §553.899, milestone inspections", href: "https://www.flsenate.gov/Laws/Statutes/2024/553.899" };
const STATUTE_SIRS = { label: "Florida Statutes §718.112(2)(g), structural integrity reserve study", href: "https://www.flsenate.gov/Laws/Statutes/2024/718.112" };
const MANATEE_EVAC = { label: "Manatee County · Know your evacuation level", href: "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level" };
const SARASOTA_EVAC = { label: "Sarasota County · Know your evacuation zone", href: "https://www.scgov.net/know-your-evacuation-zone" };

const SEASON = "Hurricane season runs June 1 to November 30. When a storm is named, insurance binding stops, which can pause a closing for a few days, so we put that on the calendar in June rather than explaining it in September.";

export const HUBS: Record<MarketSlug, HubCopy> = {
  "lakewood-ranch": {
    slug: "lakewood-ranch",
    title: "Lakewood Ranch · The villages, what’s on, and how buying works here",
    description:
      "The first page to read before you buy or sell in Lakewood Ranch: every village on the Atlas, the week on the Encore calendar, which side of the county line you’re on, CDDs, flood zones and the questions people ask first.",
    orientation: [
      "The villages are built around lakes and preserves on both sides of the Manatee–Sarasota county line, and Main Street and Waterside Place give the evenings somewhere to go.",
      "Which side of the line you’re on changes the property tax rate and who customarily pays for the owner’s title policy, so it’s the first thing we check on any address here.",
    ],
    buying: [
      "Lakewood Ranch sits on the county line. In Manatee County the seller customarily pays for the owner’s title policy; in Sarasota County the buyer does. The county also sets the property tax rate and some of the permitting rules, so a Waterside address works differently from a Manatee County address a mile north.",
      "Most of the Ranch is inside a homeowners association, and many villages also sit inside a community development district: a separate unit of government that borrowed to build the roads, lakes and amenities and pays it back through an assessment on each lot’s property tax bill. It isn’t part of the HOA dues, and it doesn’t go away when you pay off the mortgage. Pull the tax bill for the exact parcel and read the non-ad valorem section.",
      "Most of the Ranch sits in flood zone X, outside the FEMA special flood hazard area, where flood insurance is optional with a mortgage; the quotes tend to be low and we often recommend it anyway. Evacuation levels are a different map: Manatee County classifies them A through E by address, and the Atlas page for every researched place here carries the level we checked, with a link to the county’s lookup.",
      SEASON,
    ],
    selling: [
      "The buyers who close here arrive in February and are mostly gone by May, and prep takes about eight weeks, so a listing that goes live in February started in the fall. A house that’s ready and priced to the comps sells in summer too.",
      "The closing statement carries the state documentary stamp tax on the deed, which the seller pays by custom on this coast; the owner’s title policy, which the seller customarily pays in Manatee County and the buyer pays on the Sarasota County side; and commission, which is negotiable and set in the listing agreement.",
      "Before closing, your association issues an estoppel certificate stating what you owe and what transfers with the property, and the buyer’s side will read it alongside the CDD line on your tax bill. Having both in order before the listing goes live is what keeps a closing on schedule.",
    ],
    faqs: [
      {
        q: "Which county is Lakewood Ranch in?",
        answer:
          "Both. Most of the villages are in Manatee County; Waterside and the villages south of the line are in Sarasota County. The county sets the property tax rate and some permitting rules, and it decides who customarily pays for the owner’s title policy, so we check the parcel before anything else.",
      },
      {
        q: "What’s a CDD, and does every village have one?",
        answer:
          "A community development district is a separate unit of government that built the roads, lakes and amenities and collects an assessment on the property tax bill to pay for them. Many villages on the Ranch sit inside one, not all; the Atlas page for each village names the district and links to its own site when we found one on record.",
      },
      {
        q: "Do I need flood insurance in Lakewood Ranch?",
        answer:
          "If the house is in a FEMA special flood hazard area, zones AE or VE, and you have a mortgage, your lender will require it. Most of the Ranch is zone X, where it’s optional, though the quotes tend to be low and we often recommend it. We pull the flood map before you see the house.",
      },
      {
        q: "Do I have to join the golf club to live in a country club village?",
        answer:
          "No. In The Lake Club and Country Club East the golf club is an optional, separate membership; the HOA covers the village’s own clubhouse, pools and gate. Ask us for the current terms before you count on them, because they change.",
      },
      {
        q: "Where do I look up the evacuation level?",
        answer:
          "Manatee County classifies evacuation levels A through E, with A called first, and publishes a lookup by address. Every researched place on the Atlas carries the level we checked at one address point; levels follow property lines, so confirm the exact address.",
      },
    ],
    guides: ["cdd-fees-in-lakewood-ranch-village-by-village", "homestead-save-our-homes-and-portability", "what-to-ask-before-you-buy-in-a-gated-community", "getting-here-and-getting-around"],
    sources: [
      { label: "Buying on the Suncoast · closing costs and timing", href: "/buy", supports: "title custom by county, the county line, flood zones, hurricane season" },
      { label: "Selling with us · what it costs and when to list", href: "/sell", supports: "documentary stamp tax, title custom, commission, timing, prep" },
      { label: "Waterside · which county and why it matters", href: "/neighborhoods/waterside", supports: "the Sarasota County side, property tax rate and permitting" },
      { label: "The Lake Club and Country Club East", href: "/neighborhoods/the-lake-club", supports: "golf membership optional and separate from the HOA" },
      { label: "Tide · What to ask before you buy in a gated community", href: "/blog/what-to-ask-before-you-buy-in-a-gated-community", supports: "HOAs, CDDs, the estoppel certificate" },
      { label: "Tide · Ask us about the water table", href: "/blog/ask-us-about-the-water-table", supports: "zone X on most of the Ranch, zones AE and VE" },
      { label: "Atlas · the neighborhood explorer", href: "/neighborhoods?market=lakewood-ranch", supports: "area, county, CDD and evacuation-zone counts in section 02, computed from the catalog at build time" },
      { ...MANATEE_EVAC, supports: "evacuation levels A through E, A first, lookup by address" },
    ],
  },

  sarasota: {
    slug: "sarasota",
    title: "Sarasota · The keys, the bayfront, what’s on, and how buying works here",
    description:
      "The first page to read before you buy or sell in Sarasota: the keys and the bayfront on the Atlas, the week on the Encore calendar, who pays for title in Sarasota County, flood and evacuation zones, condominium inspections, and the questions people ask first.",
    orientation: [
      "Sarasota is the bayfront, the keys and the streets west of the Trail, and the opera house, the orchestra and the gallery district are a few minutes from any of them.",
      "Siesta Key, Lido Key, Bird Key, St. Armands and Longboat Key make the island side; Palmer Ranch, The Meadows and Gulf Gate are the inland side, in unincorporated Sarasota County.",
    ],
    buying: [
      "Sarasota County is the one on this coast where the buyer customarily pays for the owner’s title policy; in Manatee County, the seller does. Everything is negotiable in the contract, and you see the estimate before you sign anything.",
      "The flood zone follows the water. Most of Siesta Key and the bayfront is zone AE or VE, where flood insurance is required with a mortgage and the elevation certificate decides the premium; away from the immediate bayfront, most of West of the Trail is zone X. We check the parcel, not the neighborhood name, before you write an offer.",
      "On the bayfront and the keys, a lot of what’s for sale is a condominium. Under Florida law a condominium or cooperative building three stories or higher needs a milestone structural inspection by a licensed architect or engineer when it reaches thirty years old, or twenty-five where the local authority requires it near salt water, and every ten years after; a condominium association must also keep a structural integrity reserve study, updated at least every ten years, including the roof, the structure, waterproofing, plumbing, electrical and fire protection. Ask for the inspection report, the reserve study and the budget before you write.",
      "Sarasota County publishes storm evacuation zones by address, and the Atlas page for every researched place here carries the zone we checked, with a link to the county’s lookup. " + SEASON,
    ],
    selling: [
      "The buyers who close here arrive in February and are mostly gone by May, so the strongest listings go live in late January or February; a house that’s ready and priced to the comps sells in summer too. Prep takes about eight weeks, so a February listing starts in the fall.",
      "The closing statement carries the state documentary stamp tax on the deed, which the seller pays by custom on this coast, and commission, which is negotiable and set in the listing agreement. In Sarasota County the buyer customarily pays for the owner’s title policy rather than you.",
      "If you’re selling a unit in a building three stories or higher, the milestone inspection report and the structural integrity reserve study are part of what a buyer’s side will read, so we gather them from the association before the listing goes live.",
    ],
    faqs: [
      {
        q: "Who pays for the owner’s title policy in Sarasota County?",
        answer: "The buyer pays, by custom. It changes at the county line: in Manatee County the seller customarily pays. Either way it’s negotiable in the contract.",
      },
      {
        q: "What flood zone is Siesta Key in?",
        answer:
          "Most of the island is in zone AE or VE, so flood insurance is required with a mortgage and the elevation certificate decides the premium. Newer construction is elevated. We ask for the certificate before you make an offer.",
      },
      {
        q: "What should I ask about a condominium on the bayfront?",
        answer:
          "Ask for the milestone inspection report, which Florida requires for condominium and cooperative buildings three stories or higher once they reach thirty years, the structural integrity reserve study, and the current budget. The building’s insurance and reserves matter as much as the flood zone.",
      },
      {
        q: "Is there an HOA West of the Trail?",
        answer:
          "Most sections have none. Harbor Acres, Cherokee Park, Avondale, McClellan Park and Granada were platted from the 1920s onward, before the HOA era, so you’re buying the lot and the house without dues or an architectural review.",
      },
      {
        q: "How do I find my evacuation zone?",
        answer:
          "Sarasota County publishes storm evacuation zones by address. Every researched place on the Atlas carries the zone we checked at one address point, with the county’s lookup linked; zones follow property lines, so confirm the exact address.",
      },
    ],
    guides: ["flood-zones-and-elevation-certificates-on-the-suncoast", "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton", "homeowners-wind-and-flood-insurance-on-this-coast", "barrier-island-rules-island-by-island"],
    sources: [
      { label: "Buying on the Suncoast · closing costs and timing", href: "/buy", supports: "title custom by county, flood zones, hurricane season" },
      { label: "Selling with us · what it costs and when to list", href: "/sell", supports: "documentary stamp tax, title custom, commission, timing, prep" },
      { label: "Siesta Key", href: "/neighborhoods/siesta-key", supports: "zones AE and VE, elevated construction, the elevation certificate" },
      { label: "West of the Trail", href: "/neighborhoods/west-of-the-trail", supports: "zone X away from the bayfront, no HOA in most sections, the 1920s plats" },
      { label: "Downtown Bradenton · a river condominium", href: "/neighborhoods/downtown-bradenton", supports: "a building’s insurance and reserves matter as much as the zone" },
      { label: "Tide · Ask us about the water table", href: "/blog/ask-us-about-the-water-table", supports: "zones X, AE and VE and the elevation certificate" },
      { label: "Atlas · the neighborhood explorer", href: "/neighborhoods?market=sarasota", supports: "the keys and the inland areas, jurisdictions, and the counts in section 02, from the catalog at build time" },
      { ...STATUTE_MILESTONE, supports: "three stories or more, thirty years (twenty-five near salt water), every ten years, licensed architect or engineer" },
      { ...STATUTE_SIRS, supports: "condominium buildings three stories or higher, at least every ten years, the items the study must include" },
      { ...SARASOTA_EVAC, supports: "storm evacuation zones by address (the county’s lookup, linked from every Atlas page)" },
    ],
  },

  bradenton: {
    slug: "bradenton",
    title: "Bradenton · The river, the island, what’s on, and how buying works here",
    description:
      "The first page to read before you buy or sell in Bradenton: the river, the canal streets and Anna Maria Island on the Atlas, the week on the Encore calendar, who pays for title in Manatee County, flood and evacuation levels, and the questions people ask first.",
    orientation: [
      "Bradenton is the Manatee River, the Riverwalk, the canal streets west of 75th reaching Palma Sola Bay, and a downtown with the county’s theater and an arts village of its own.",
      "Anna Maria Island, seven miles long with three cities and a height limit that keeps it low, sits at the end of the Manatee Avenue and Cortez Road bridges.",
    ],
    buying: [
      "Bradenton is in Manatee County, where the seller customarily pays for the owner’s title policy; cross into Sarasota County and the custom flips to the buyer. Everything is negotiable in the contract, and you see the estimate before you sign anything.",
      "Flood zones vary block to block here. Several canal streets west of 75th are zone X, which changes the insurance conversation; downtown is AE along the river and X south of 6th Avenue; the whole of Anna Maria Island is AE or VE, with construction since 2016 elevated to the current code. We check the parcel and ask for the elevation certificate before you get attached to a house.",
      "For a river or island condominium, the building matters as much as the zone. Florida requires a milestone structural inspection for condominium and cooperative buildings three stories or higher at thirty years, or twenty-five where the local authority requires it near salt water, and, for a condominium, a structural integrity reserve study updated at least every ten years. In the newer communities, many lots also sit inside a community development district, a line on the property tax bill separate from the HOA dues.",
      "Manatee County classifies evacuation levels A through E by address, with A called first, and the Atlas page for every researched place here carries the level we checked, with a link to the county’s lookup. " + SEASON,
    ],
    selling: [
      "The buyers who close here arrive in February and are mostly gone by May, so the strongest listings go live in late January or February; a house that’s ready and priced to the comps sells in summer too. Prep takes about eight weeks, so a February listing starts in the fall.",
      "The closing statement carries the state documentary stamp tax on the deed, which the seller pays by custom on this coast; the owner’s title policy, which the seller customarily pays in Manatee County; and commission, which is negotiable and set in the listing agreement.",
      "On a canal street the seawall, the dock and the roof are what a buyer’s inspector looks at hardest, so we get the seawall report and the roof permit together before the photographs. If you’re selling from away, the keys, the showings and the weekly report run the same way; nothing about being away should mean knowing less.",
    ],
    faqs: [
      {
        q: "Who pays for the owner’s title policy in Manatee County?",
        answer:
          "The seller pays, by custom, and the seller also pays the documentary stamp tax on the deed. In Sarasota County the buyer customarily pays for the title policy. Both are negotiable in the contract.",
      },
      {
        q: "Which canal streets are in flood zone X?",
        answer:
          "Several are, and it changes the insurance conversation. Zones vary block to block, so we check the parcel and ask for an elevation certificate before you get attached to a house.",
      },
      {
        q: "Can I rent my house short-term on Anna Maria Island?",
        answer:
          "The rules differ by city. Anna Maria, Holmes Beach and Bradenton Beach each set their own, and they change. We check the current ordinance for the exact address before you plan around rental income.",
      },
      {
        q: "Where do I look up the evacuation level?",
        answer:
          "Manatee County classifies evacuation levels A through E, with A called first, and publishes a lookup by address. Every researched place on the Atlas carries the level we checked at one address point; levels follow property lines, so confirm the exact address.",
      },
      {
        q: "What should I ask about a river condominium downtown?",
        answer:
          "Ask about the building’s insurance and reserves, which matter as much as the flood zone, plus the milestone inspection report Florida requires for condominium and cooperative buildings three stories or higher and, for a condominium, the structural integrity reserve study. The zone is AE along the Manatee River and X south of 6th Avenue.",
      },
    ],
    guides: ["flood-zones-and-elevation-certificates-on-the-suncoast", "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton", "barrier-island-rules-island-by-island", "condo-and-hoa-documents-after-the-2022-law"],
    sources: [
      { label: "Buying on the Suncoast · closing costs and timing", href: "/buy", supports: "title custom by county, flood zones, hurricane season" },
      { label: "Selling with us · what it costs and when to list", href: "/sell", supports: "documentary stamp tax, title custom, commission, timing, prep" },
      { label: "West Bradenton", href: "/neighborhoods/west-bradenton", supports: "canal streets in zone X, zones block to block, the elevation certificate" },
      { label: "Downtown Bradenton", href: "/neighborhoods/downtown-bradenton", supports: "AE along the river, X south of 6th Avenue, a building’s insurance and reserves" },
      { label: "Anna Maria Island", href: "/neighborhoods/anna-maria-island", supports: "seven miles, three cities, the height limit, AE and VE island-wide, rental rules by city, the two bridges" },
      { label: "Guide · Home inspections on the Suncoast", href: "/guides/inspections-on-the-suncoast-what-a-good-one-covers", supports: "the seawall, the dock, the roof" },
      { label: "Tide · Selling a home you don’t live in", href: "/blog/selling-a-home-you-dont-live-in", supports: "selling from away" },
      { label: "Tide · What to ask before you buy in a gated community", href: "/blog/what-to-ask-before-you-buy-in-a-gated-community", supports: "the CDD line on the tax bill" },
      { label: "Atlas · the neighborhood explorer", href: "/neighborhoods?market=bradenton", supports: "area, place, CDD and evacuation-zone counts in section 02, computed from the catalog at build time" },
      { ...STATUTE_MILESTONE, supports: "three stories or more, thirty years (twenty-five near salt water), every ten years" },
      { ...STATUTE_SIRS, supports: "three stories or higher, at least every ten years" },
      { ...MANATEE_EVAC, supports: "evacuation levels A through E, A first, lookup by address" },
    ],
  },
};

/** Every string on the hubs, for the Fair Housing check. */
export function hubStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const h of Object.values(HUBS)) {
    const add = (where: string, text: string) => out.push({ where: `${h.slug}: ${where}`, text });
    add("title", h.title);
    add("description", h.description);
    h.orientation.forEach((t, i) => add(`orientation ${i + 1}`, t));
    h.buying.forEach((t, i) => add(`buying ${i + 1}`, t));
    h.selling.forEach((t, i) => add(`selling ${i + 1}`, t));
    h.faqs.forEach((f, i) => {
      add(`faq ${i + 1} question`, f.q);
      add(`faq ${i + 1} answer`, f.answer);
    });
    h.sources.forEach((s, i) => add(`source ${i + 1}`, `${s.label} ${s.supports}`));
  }
  return out;
}
