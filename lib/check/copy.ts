/**
 * The words of Atlas Check (/check). No imports, so scripts/check-copy.mjs
 * can load this file and run the voice and Fair Housing checks over every
 * string. Places and parcels only: nothing here says who lives anywhere.
 */

export const CHECK_COPY = {
  title: "Atlas Check: the flood zone and evacuation zone for an address",
  description:
    "Type an address in Manatee or Sarasota County and see its evacuation zone from the county’s map, its FEMA flood zone and map panel, and what the county’s roll says about the house, each with where it comes from and the day it was read.",
  lead: "Type an address. See its evacuation zone, its flood zone and what the county’s roll says, each with where it comes from.",
  form: {
    label: "Check an address",
    address: "Street address",
    addressPlaceholder: "1660 Ringling Blvd",
    zip: "ZIP",
    zipPlaceholder: "34236",
    submit: "Check it",
    checking: "Checking…",
    hint: "Any address in Manatee or Sarasota County. Add the unit for a condo.",
    errors: {
      number: "Start with the house number, like 1660 Ringling Blvd.",
      street: "Add the street name after the number.",
      zip: "Add the five-digit ZIP.",
    },
  },
  results: {
    heading: "What the public maps say",
    county: { manatee: "Manatee County", sarasota: "Sarasota County" },
    onRoll: "Found on the county’s parcel map.",
    geocoded:
      "We couldn’t match this address to a parcel on the county’s roll, so the Census geocoder placed it along the street. The zones below are for that point, which can be a few lots off.",
    units: "{n} units share this address on the roll. Add the unit number to see that unit’s own record.",
    notFound: "We couldn’t find that address on either county’s roll.",
    notFoundHelp: "Check the house number and the ZIP, or spell out the street’s full name. A house finished this year may not be on the roll yet.",
    outside: "That address is outside Manatee and Sarasota counties.",
    outsideHelp: "Atlas Check reads those two counties’ maps. For anywhere else, FEMA’s flood map covers the whole country.",
    unavailable: "The county or FEMA map didn’t answer just now.",
    unavailableHelp: "Try again in a minute. Nothing you typed was lost.",
    rate: "That’s a lot of checks in a row.",
    rateHelp: "Give it a minute and try again.",
    error: "Something went wrong on our side.",
    errorHelp: "Try again in a minute.",
    retry: "Try again",
    partial: "This map didn’t answer just now. Try again in a minute, or look it up yourself:",
  },
  evacuation: {
    label: { manatee: "Evacuation level", sarasota: "Evacuation zone" },
    value: { manatee: "Level {z}", sarasota: "Zone {z}" },
    none: { manatee: "Outside every level", sarasota: "Outside every zone" },
    others: { manatee: "Part of the lot is in level {z}.", sarasota: "Part of the lot is in zone {z}." },
    outsideOthers: { manatee: "The middle of the lot is outside every level; part of it is in level {z}.", sarasota: "The middle of the lot is outside every zone; part of it is in zone {z}." },
    source: { manatee: "Manatee County evacuation levels map", sarasota: "Sarasota County evacuation zones map" },
    page: "Check it with the county",
  },
  flood: {
    label: "FEMA flood zone",
    value: "Zone {z}",
    none: "Not on FEMA’s map here",
    noneHelp: "FEMA’s flood map has no zone at this point. Check it on FEMA’s map before you count on that.",
    sfha: "In the special flood hazard area.",
    notSfha: "Outside the special flood hazard area.",
    shaded: "Shaded X: the 0.2% annual chance flood area.",
    bfe: "Base flood elevation {ft} ft ({datum}).",
    others: "Part of the lot is in zone {z}.",
    panel: "Map panel {id}, effective {date}.",
    source: "FEMA National Flood Hazard Layer",
    page: "Check it on FEMA’s map",
  },
  roll: {
    label: "On the county roll",
    built: "Built {year}",
    livingArea: "Living area",
    lot: "Lot",
    use: "Use",
    lastSale: "Last qualified sale",
    noSale: "None since {date}",
    noSaleUndated: "None in the county file",
    notOnRoll: "No parcel record to show.",
    unitsHidden: "Add the unit number for its own record.",
    blank: "Not recorded",
    noBuilding: "No building recorded",
    source: { manatee: "Manatee County Property Appraiser", sarasota: "Sarasota County Property Appraiser" },
    page: "Open the parcel record",
    salesSource: "Sales: the county’s qualified sales file, through {date}",
  },
  guide: {
    floodHeading: "What zone {z} means",
    floodNoCard: "What the flood zone means",
    evacHeading: "An evacuation zone is not a flood zone",
    read: "Read the guide",
  },
  verify: {
    heading: "Check before you count on it",
    body:
      "These come from public maps, read on {date}. Maps change, a line can split a lot, and FEMA can change the zone for a single property with a letter of map change. Before you buy, insure or build, confirm each one with the county and on FEMA’s map, and ask for the elevation certificate.",
  },
  next: {
    heading: "Next, for this address",
    value: "What’s it worth",
    sold: "What sold on {street}",
    ask: "Ask us about this address",
  },
  how: {
    title: "How Atlas Check works",
    body: [
      "Atlas Check finds the parcel on the county’s own parcel map, by house number, street and ZIP. If the roll doesn’t have it yet, the Census geocoder places the address along its street instead, and the page says so.",
      "The evacuation zone comes from the county’s map: Manatee calls them levels, Sarasota calls them zones, and both run from A to E. The flood zone and its map panel come from FEMA’s National Flood Hazard Layer, the map lenders use. The year built, living area and lot come from the county’s parcel map, and the last qualified sale from the property appraiser’s sales file.",
      "Each map is read at the parcel itself. When a lot touches more than one zone, the page names the zone at its middle and the others it touches. Every answer is kept for up to 30 days, and the page shows the day it was read.",
    ],
  },
} as const;

/** Every string, for scripts/check-copy.mjs. */
export function checkStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const walk = (v: unknown, where: string) => {
    if (typeof v === "string") out.push({ where, text: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`);
  };
  walk(CHECK_COPY, "lib/check/copy.ts: CHECK_COPY");
  return out;
}
