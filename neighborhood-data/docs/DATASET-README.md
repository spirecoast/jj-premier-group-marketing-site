# JJ Premier Group — neighborhood & community dataset

Catalog of areas, neighborhoods and communities in the three markets of the JJ Premier Group site
(`lakewood-ranch`, `sarasota`, `bradenton`), built for the `/neighborhoods` section of
`spirecoast/jj-premier-group-marketing-site`. Every fact carries its source URL and the date it was checked.

Built 2026-09-22 to 2026-09-23 (second research and geocoding pass on 2026-09-23). Census sources are stamped 2026-09-22; detail research, verification and map-service
lookups are stamped 2026-09-23 (the day each was checked).

## Files

| File | What it is |
|---|---|
| `neighborhoods.json` | All records, one object each, hierarchy via `parentSlug`. The site-ready file. |
| `neighborhoods.csv` | Same records, flattened (arrays joined with `; `, `hoa`/`cdd`/`zonedSchools` split into columns). |
| `sources.csv` | One row per record × source: URL, what it supports, checked date, the page's own date, and a stale flag (older than ~2 years). |
| `coverage.json` | Gaps: fill rates, records not researched, pages that need a browser, stale sources, scope-edge cases, 55+ candidates awaiting HOPA documents, conflicts, excluded records, verification results. The review page's Coverage tab reads the same data. |
| `excluded.json` | Records dropped during the build, with the reason (out-of-scope mailing city, duplicates, non-residential). |

## Counts

| Market | area | community | enclave | total |
|---|---|---|---|---|
| lakewood-ranch | 45 | 125 | 0 | 170 |
| sarasota | 25 | 316 | 72 | 413 |
| bradenton | 30 | 1273 | 202 | 1505 |
| **all** | | | | **2088** |

377 Bradenton-market records are flagged `bradentonArea`. 13 records were excluded during the build (`excluded.json`).

`research` tells you how deep each record goes:

- **full** (678 records): researched individually. Every Lakewood Ranch village and neighborhood, every builder and CDD
  community, the City of Sarasota and Sarasota County registered associations, islands, historic districts and area
  records, plus established Bradenton communities with their own association site.
- **registry-only** (1410 records): names from Manatee County's Neighborhoods map layer (it names neighborhoods down to
  small plats, condos and mobile-home parks). These carry only what the county/city map services give — coordinates, zip,
  jurisdiction, zoned schools, evacuation zone — and a one-line template description. They pass the inclusion test
  (a county registry names them) but most sites will want to hide them from the browse grid and use them for search.

## Field map to the site

The site's `neighborhood` Sanity type (`sanity/schemas/neighborhood.ts`) and `lib/content/types.ts` currently hold
`name, slug, market, county, tagline, hero, overview, highlights, stat, featuredListings`.

| Dataset field | Site field | Notes |
|---|---|---|
| `_id` | `_id` | `neighborhood-<slug>`, the seed convention in `lib/content/seed/neighborhoods.ts`. |
| `name` | `name` | |
| `slug` | `slug.current` | Unique across all markets. |
| `market` | `market` | Same three slugs as `MarketSlug`. |
| `county` | `county` | Site convention: set only when it differs from the market's county. Lakewood Ranch records are split between Manatee and Sarasota. |
| `description` | `overview` | One portable-text paragraph. Fair-housing checked (see below). |
| `yearsBuilt`, `homeTypes`, `hoa.name`, `amenities`, `waterAccess`, `status` | `highlights[]` | Suggested labels: Built, Homes, HOA, Amenities, Water, Status. Only non-null values. |
| — | `tagline`, `hero`, `stat` | Not generated. Taglines are brand voice; photos and market stats are out of scope for this pass. |
| `parentSlug` | *(new)* `parent` reference | Areas → communities → enclaves. |
| `level`, `type`, `bradentonArea`, `jurisdiction`, `zips`, `lat`/`lng`, `developer`, `activeBuilders`, `homeCount`, `gated`, `ageRestricted`, `hoa`, `cdd`, `zonedSchools`, `evacuationZone`, `officialUrl`, `sources`, `research` | *(new fields)* | Add to the Sanity type to use them. `lat`/`lng` → a `geopoint`. |
| `notes` | *(internal)* | Research notes, conflicts and flags; not for display. |

`bradentonArea: true` marks Palmetto, Ellenton and Parrish (and Palmetto-mailing places like Gillette, Terra Ceia,
Snead Island) so the Bradenton filter can leave them out.

### Existing seed entries

| Seed slug | Dataset record | |
|---|---|---|
| `lake-club` | `the-lake-club` | County is Manatee. The seed's build years and drive times aren't supported by an official source. |
| `country-club-east` | `country-club-east` | |
| `waterside` | `waterside` | |
| `siesta-key` | `siesta-key` | |
| `west-of-the-trail` | *(none)* | Not an official area name. Its neighborhoods are records: `harbor-acres`, `cherokee-park`, `avondale`, `mcclellan-park`, `granada` and others. |
| `west-bradenton` | `west-bradenton` | |
| `downtown-bradenton` | `downtown-bradenton` | |
| `anna-maria-island` | `anna-maria-island` | Parent of `anna-maria`, `holmes-beach`, `bradenton-beach`. |

## Sources and method

Census: Lakewood Ranch's official site (its WordPress village API, maps and magazine), the City of Sarasota
neighborhood-association map layer, Sarasota County's Neighborhood Online Directory and registration layer, the
City of Bradenton neighborhoods layer, Manatee County's Neighborhoods layer, Manatee's 2025 tax roll and CDD map layer,
the Sarasota Property Appraiser's special-district list, and builders' own community pages. Six census agents, then
seven detail agents (each with its own output file and scratch folder, one shared `INSTRUCTIONS.md`), then a separate
verification agent.

Map-service lookups (run in a real browser against the services the official lookup tools call):

- **Coordinates**: a representative point inside the county's own polygon (Manatee Neighborhoods layer, Sarasota County
  plat boundaries), the association's registered polygon, the county address point for a builder's or association's listed
  address, or the most central parcel of the property appraiser's subdivision(s). Area records use the most central address
  point of their development names, the most central of their child records, a Census Bureau internal point (CDPs, towns)
  or the center of a National Register district boundary. Each record's `notes` says which (`point: ...`).
- **zips, jurisdiction, checkedAddress**: the nearest county address point to that representative point
  (Manatee County and Sarasota County address-point layers; Manatee city boundaries).
- **Zoned schools**: Manatee — the district's SchoolSearch locator (`app.guidek12.com/manateefl/school_search/2026/`,
  linked from manateeschools.net/schoollocator), queried at the checked address, 2026–27 zones. Sarasota — the Sarasota
  County School Zone Lookup the district links from its attendance-zones page, via the layer it reads. Names are exactly
  as the locator returns them (Sarasota's locator names zones "<School> Zone"). **Zoning is by address and can change.**
- **Evacuation zone**: the layers behind each county's official lookup at the checked address — Manatee County's
  *Know Your Evacuation Level* map (`mymanatee.org/.../know-your-evacuation-level`) and Sarasota County's
  *Know Your Evacuation Zone* lookup (`scgov.net/know-your-evacuation-zone`). Manatee levels are A–E; Sarasota zones are
  A–E. `none` means the point is outside every zone. Both links are in each record's `sources`.
- **Builder status**: each builder's own community page, opened in a real browser on 2026-09-23 (Taylor Morrison, Lennar,
  M/I, Meritage, Mattamy, Homes by WestBay, Perry, Centex, Del Webb, Pulte, D.R. Horton). `selling` means the builder's page
  shows the community open with homes or floor plans for sale; `built-out` means the builder marks it sold out or has
  removed it and no other builder is selling there.

Discovery-only sites (Zillow, Realtor.com, Niche, NewHomeSource, brokerage blogs, Wikipedia, news, management-company
directories) were used to find names and never cited for a fact. Unknown values are `null`.

## Fair housing

- Descriptions describe places, homes and amenities only; a banned-phrase scan (the repo's `lib/fair-housing.ts`
  patterns plus the brief's list) passes on every description. The one hit is a recorded subdivision name,
  "Church Hill Downs".
- `ageRestricted` is `true` only when a community document citing HOPA was found. None was, so it is `null` everywhere;
  8 communities whose developer or operator describes them as 55+ are listed in `coverage.json` →
  `ageRestrictionPendingHOPA` (Cresswind, Del Webb Catalina and others). Age wording was removed from their descriptions.
- Schools are listed without ratings; no prices, values, fees or market statistics anywhere.

## Known gaps

- **Website searches**: every full-research record has now had one (the last 27 were searched in a third pass). Small associations with no web presence carry registry facts, a factual description and a note saying no official website was found.
- **Builder statuses** were re-checked in a real browser on 2026-09-23 for every Taylor Morrison, Lennar, Homes by WestBay, Perry, M/I, Meritage, Mattamy, Richmond American, Centex, Del Webb and Pulte community in the dataset. M/I's full community list was read from its sitemap and PulteGroup's (Pulte, Del Webb, Centex) from its community map data, which added M/I at Southpointe and Coasterra. Builder neighborhoods missing from the census were added (Cove at Coasterra, The Towns at Firethorn, The Towns at Skye Ranch, Longleaf at Grand Park, Maple Ridge, Estates at Rivers Edge, Rye Manor), and Wildcat Preserve now carries its current name, Windwater.
- **170 records cite a source older than about two years** (association manuals, historic-district nominations, older press); flagged in `notes` and `sources.csv`.
- **125 scope-edge records**: mostly Manatee County places with a Sarasota mailing address (market `sarasota`, county Manatee) and the Manatee portion of Longboat Key.
- **50 records have no coordinates**, mostly area records and associations with no plat or address match; those records also have no zoned schools or evacuation zone.
- **Zoned schools**: 1 non-area record with coordinates has no `zonedSchools` (Jewfish Key, an island with no county address point on it).
- **Area records** (cities, islands, villages, districts) carry no zoned schools or evacuation zone: one address can't describe a whole area. Every other record with coordinates has both.
- **Verification**: an independent agent re-checked 50 random records; 28% (13 of 37 full-research records, 1 of 13 registry-only) had at least one wrong or unsupported field. All findings were fixed and the systemic ones were fixed dataset-wide, but expect some residual errors in builder amenity lists and small-association details. A second independent check of 30 records changed in the second pass confirmed 524 of 559 fields (25 unreadable by automated fetch); its 10 findings were fixed except one, overruled after a browser re-check (see coverage.json → verification.secondPass).
- **yearsBuilt** is sparse (21 of 678 full records): official sources rarely state build years, and none were inferred.

See `coverage.json` for the full lists.
