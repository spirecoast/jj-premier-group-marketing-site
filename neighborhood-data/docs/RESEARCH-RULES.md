# Research rules

The rules every record in `data/neighborhoods.json` was built under. Follow them when adding or editing a record
(by hand or with Claude Code). This is brokerage marketing material for JJ Premier Group (Joelyn Nauman and
Jessica Garza, Coldwell Banker Realty, Lakewood Ranch FL): the fair-housing rules are hard rules.

## 1. Sources

- **Primary only.** A fact may cite only a primary source (DATA-SOURCES.md lists them): city/county/town sites and
  map services, school-district locators, county evacuation layers, property appraisers, the state special-district
  list and CDD sites, sunbiz.org (legal name and status only), Lakewood Ranch's own sites, builder/developer sites,
  and the association's own site.
- **Discovery only.** Zillow, Realtor.com, Redfin, Niche, Homes.com, NewHomeSource, 55places, brokerage blogs,
  Wikipedia, news, review sites, management-company portals and business directories can help you find a name or
  URL. They are never a source.
- **Unknown → null.** Never infer a count, a year, an amenity, a gate, a builder or an age restriction. If the only
  support is a discovery site, leave the field null and say so in `notes`.
- **Every fact has a source entry**: `{ url, supports, checked, sourceDate }`. `supports` lists the fields it backs
  (`"existence,name,hoa,amenities"`). `checked` is the date you opened it (YYYY-MM-DD). `sourceDate` is the page's
  own published/updated date if it shows one, else null. A `sourceDate` older than about two years is stale: keep
  it, and add "stale source" with the date to `notes`.
- **People's details never go in.** No names, emails, phones or home addresses of residents, officers, registered
  agents or association contacts, from any source. Some county layers carry contact fields (Sarasota
  NeighborhoodAssociation, City of Sarasota Neighborhoods `Email`, Sarasota ParcelAppraisal `name1` = owner): never
  request them.

## 2. Scope

- **sarasota**: City of Sarasota; Longboat Key, Lido Key, St. Armands, Bird Key, Siesta Key; unincorporated
  Sarasota County with a Sarasota mailing address. Manatee County places with a Sarasota mailing address (e.g.
  34243) are included here with `county: "Manatee"` and a scope-edge note.
  **Excluded:** Osprey, Nokomis, Venice, North Port, Englewood, Laurel, Casey Key.
- **lakewood-ranch**: every village and community inside the Lakewood Ranch master plan (both counties), per
  Lakewood Ranch's own pages. Places with a Lakewood Ranch mailing address outside the master plan go to the market
  of their mailing city, noted "not in LWR master plan".
- **bradenton**: City of Bradenton; unincorporated Manatee County with a Bradenton mailing address; Anna Maria
  Island (Anna Maria, Holmes Beach, Bradenton Beach) and Cortez. Palmetto, Ellenton and Parrish are included with
  `bradentonArea: true`. Myakka City is out of scope.

## 3. Levels

- `area`: a district, island or broad part of town (Downtown Sarasota, Siesta Key, a Lakewood Ranch village,
  Palmer Ranch, a barrier-island city).
- `community`: a named neighborhood, master-planned community, or subdivision with its own identity.
- `enclave`: a named section inside a community, only when an official source names it.
- `parentSlug` builds the hierarchy (area → community → enclave).

## 4. Inclusion test

Include a place when an official source names it: a city/county neighborhood registry, an HOA/POA/condo
association or CDD, a developer/builder page, or a recorded plat with a public identity. Skip:
apartments and rentals, RV parks/campgrounds/motels, retirement or senior residences, plat-only names
("Smith Subdivision", "Replat of Lot 4", "Addition"), and unit/phase plats of something already included (those
become aliases, or enclaves only if officially named as a section). Condo buildings only when they are a named
condo community with an association site or a registry entry (`type: "condo community"`).

## 5. Fields

The full list with allowed values is in `schema/neighborhood.ts` and `schema/neighborhood.schema.json`.

- `slug`: kebab-case of the name (lower-case ASCII, `&` → "and", no apostrophes), unique. `_id` = `neighborhood-<slug>`.
- `name`: as the primary source writes it. `aliases`: other official spellings.
- `jurisdiction`, `zips`, `county`, `zonedSchools`, `evacuationZone`: from the county/district map services
  (`scripts/refresh-gis.mjs --slug <slug> --apply` fills them). Areas get no schools or evacuation zone — one point
  can't speak for a whole area.
- `lat`/`lng`: WGS84 from GIS, a plat or an official address; else null.
- `activeBuilders`: builders selling there per the builder's own site today.
- `status`: `selling` (at least one builder lists homes or homesites), `coming-soon` (builder/developer says so or
  runs an interest list), `built-out` (developer community, no builder selling — note the evidence),
  `established` (older neighborhood / resale only).
- `yearsBuilt`, `homeCount`, `gated`, `homeTypes`, `waterAccess`: official sources only. A National Register period
  of significance is not a construction span.
- `amenities`: exactly as the official amenity list names them, without adjectives.
- `hoa`: the association's legal/official name and its own website. Management-company pages don't count.
- `cdd`: only when the CDD's own site or the county/state list ties it to the community (a point inside a CDD
  boundary on the county map, plus the state list).
- `research`: `full` if researched individually, `registry-only` if the record is just a registry name plus
  map-service facts.
- `notes`: renames, annexations, dissolved HOAs, conflicts, stale sources, scope edges, what couldn't be verified.
  Internal only — never rendered.

## 6. Fair housing (hard rules)

- Describe places, homes and amenities — never the people who live there or who a place is "for".
- Never mention race, color, religion, sex, disability, familial status or national origin of residents.
- Banned in descriptions (any form): family-friendly, families, kids, children, retirees, retirement (unless a proper
  name), young professionals, professionals, empty nesters, singles, couples, exclusive, safe, safety, quiet,
  desirable, prestigious, up-and-coming, good/great schools, top-rated, churches, places of worship, crime anything,
  active adult, seniors. No selling adjectives: luxury, premier, stunning, beautiful, vibrant, charming, idyllic,
  pristine, upscale, elite.
- No prices, values, HOA fee amounts or market statistics.
- `scripts/validate.mjs` enforces these patterns (a record's own proper name, like "Church Hill Downs", is
  allowed). Also run the site's `lib/fair-housing.ts`.

Good: "A gated Lakewood Ranch neighborhood of single-family homes and paired villas built by Taylor Morrison around a
central lake, with a clubhouse, pool and pickleball courts."
Bad: "A family-friendly, exclusive community perfect for active retirees."

## 7. 55+ communities

Set `ageRestricted: true` only when the community's own governing documents say it is housing for older persons
under HOPA (the Fair Housing Act's 55-and-older exemption), and cite that document with `supports: "ageRestricted"`.
A builder calling a community "active adult", a builder API flag, or an association site saying "55+" is not
enough: leave null and note "association/builder describes the community as 55+; no HOPA document found".
Never mention age in a description.

## 8. Schools

Exactly as the district locator returns them (Sarasota names end in "Zone"; K-8 zones fill elementary and middle),
linked to the locator, with the note "Zoning is by address and can change; confirm a specific address with the
district locator." No ratings, rankings or test scores, and no "good schools" language anywhere.

## 9. Adding a record — checklist

1. Confirm it's in scope and passes the inclusion test (§2, §4).
2. Find the primary sources; fill only what they support; everything else null.
3. Write a 1–2 sentence description from sourced facts only (§6).
4. Add it to `data/neighborhoods.json` (any position; `saveData` sorts by slug), with `research: "full"`.
5. With `lat`/`lng` set, run `node scripts/refresh-gis.mjs --slug <slug> --apply` for ZIP, jurisdiction, schools and evacuation zone.
6. `node scripts/validate.mjs && node scripts/build-search-index.mjs`, then the site's fair-housing check.
