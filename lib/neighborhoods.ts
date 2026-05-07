/**
 * Neighborhoods seed data — used to drive the programmatic per-neighborhood
 * pages until the MLS feed (Phase 3) and ATTOM/county records (Phase 4) wire
 * in real stats.
 *
 * Per ARCHITECTURE.md §17, anything user-facing about a neighborhood is
 * Fair-Housing-sensitive. Keep `description` strictly factual and structural —
 * geography, HOA mechanics, master-plan history. NO demographic claims, NO
 * "good for X" framing, NO school-quality assertions.
 */

export type Neighborhood = {
  slug: string;
  name: string;
  area: "lakewood-ranch" | "sarasota";
  /** Optional descriptor — strictly factual, no demographic / fair-housing language. */
  blurb?: string;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "country-club-east",
    name: "Country Club East",
    area: "lakewood-ranch",
    blurb:
      "Master-planned section within Lakewood Ranch with golf-course-adjacent home sites and an HOA-managed amenity center.",
  },
  {
    slug: "esplanade",
    name: "Esplanade Golf & Country Club",
    area: "lakewood-ranch",
    blurb:
      "Maintenance-included community within Lakewood Ranch with private golf, fitness, and dining amenities.",
  },
  {
    slug: "lakewood-national",
    name: "Lakewood National",
    area: "lakewood-ranch",
    blurb:
      "Bundled-golf community with two 18-hole courses, an HOA, and short-term-rental restrictions.",
  },
  {
    slug: "del-webb",
    name: "Del Webb at Lakewood Ranch",
    area: "lakewood-ranch",
    blurb:
      "Active-adult (55+) community with HOA-managed clubhouse, pickleball courts, and resort-style pool.",
  },
  {
    slug: "polo-run",
    name: "Polo Run",
    area: "lakewood-ranch",
    blurb:
      "Solar-powered community within Lakewood Ranch with maintenance-included single-family floorplans.",
  },
  {
    slug: "greenbrook",
    name: "Greenbrook",
    area: "lakewood-ranch",
    blurb:
      "Established Lakewood Ranch village with a mix of villa and single-family floorplans and access to the LWR amenity network.",
  },
  {
    slug: "heritage-harbour",
    name: "Heritage Harbour",
    area: "lakewood-ranch",
    blurb:
      "Master-planned community along the Manatee River with golf, recreation, and the River Strand sub-community.",
  },
  {
    slug: "rosedale",
    name: "Rosedale Golf & Country Club",
    area: "lakewood-ranch",
    blurb:
      "Gated golf community with an HOA-managed clubhouse and tennis facility.",
  },
  {
    slug: "the-meadows",
    name: "The Meadows",
    area: "sarasota",
    blurb:
      "1,650-acre master-planned community in Sarasota with three 18-hole courses, walking trails, and an HOA.",
  },
  {
    slug: "palmer-ranch",
    name: "Palmer Ranch",
    area: "sarasota",
    blurb:
      "Master-planned area south of Sarasota with multiple sub-communities and access to the Legacy Trail.",
  },
];

export function neighborhoodBySlug(
  area: Neighborhood["area"],
  slug: string,
): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.area === area && n.slug === slug);
}

export function neighborhoodsByArea(area: Neighborhood["area"]): Neighborhood[] {
  return NEIGHBORHOODS.filter((n) => n.area === area);
}
