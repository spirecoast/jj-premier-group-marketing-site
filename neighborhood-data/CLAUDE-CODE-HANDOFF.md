# Claude Code handoff: neighborhood data for the JJ Premier Group site

Read this first. It explains what the data is, where it should go in the `jj-premier-group-marketing-site` repo,
how it relates to what the site already has, the rules for showing it, and how to keep it current. The page
design is up to you and the owner.

## What this is

A catalog of 2,088 areas, communities and enclaves in the site's three markets. Every fact in it comes from a
primary source (county/city map services and registries, school-district locators, builder and developer sites,
association sites), and each record lists those sources with the date they were checked.

| Market | area | community | enclave |
|---|---|---|---|
| lakewood-ranch | 45 | 125 | 0 |
| sarasota | 25 | 316 | 72 |
| bradenton | 30 | 1,273 | 202 |

- 678 records were researched individually (`research: "full"`). 1,410 are `registry-only`: a county registry
  name plus map-service facts (ZIP, jurisdiction, schools, evacuation zone), usually with a template description.
- 2,038 have coordinates, 1,948 have zoned schools, 1,948 have an evacuation zone.
- Unknown values are `null`, never guessed. `docs/DATASET-README.md` covers method, gaps and coverage.

## Files

```
data/neighborhoods.json         canonical dataset (8.3 MB, sorted by slug) — server-side only
data/neighborhoods.search.json  slim search index (1.0 MB): no notes/sources/descriptions, adds path + q
data/neighborhoods.csv          flat copy for spreadsheets
data/sources.csv                one row per record × source
data/coverage.json              gaps and verification results
data/excluded.json              13 records dropped during the build, with reasons
data/discover-baseline.json     names the discovery script has already seen (see runbook)
data/manifest.json              counts and file list
schema/neighborhood.ts          TypeScript types (Neighborhood, NeighborhoodSource, ZonedSchools, NeighborhoodSearchEntry)
schema/neighborhood.schema.json JSON Schema (draft 2020-12)
scripts/                        validate, rebuild the index, refresh map-service facts, check builders, discover new places
docs/DATA-SOURCES.md            every source: endpoint, fields, access notes, cadence
docs/REFRESH-RUNBOOK.md         monthly / quarterly / yearly update steps
docs/RESEARCH-RULES.md          rules for adding or editing a record (sources, scope, fair housing, 55+, schools)
```

## Where to put it

Keep the folder together so the scripts work unchanged: copy it to the repo root as `neighborhood-data/`
(scripts find `data/` next to themselves; set `NEIGHBORHOODS_DATA_DIR` if you move them apart). Then:

- add `neighborhood-data/reports/` to `.gitignore`;
- add npm scripts, for example:
  ```json
  "nbhd:validate": "node neighborhood-data/scripts/validate.mjs",
  "nbhd:index": "node neighborhood-data/scripts/build-search-index.mjs",
  "nbhd:refresh-gis": "node neighborhood-data/scripts/refresh-gis.mjs",
  "nbhd:check-builders": "node neighborhood-data/scripts/check-builders.mjs",
  "nbhd:discover": "node neighborhood-data/scripts/discover.mjs"
  ```
- copy or re-export `schema/neighborhood.ts` from `lib/content/` so the app and the data share one type;
- consider running `nbhd:validate` in CI (it has no network access and no dependencies; Node 20+).

## How it fits the site as it stands

Observed in the repo at commit `1661e13` ("feat(site): client round three"); check that it still holds.

- `app/(site)/neighborhoods/page.tsx` lists `getNeighborhoods(market)` from `lib/content`, with a `?market=` filter
  and cards (hero, tagline, stat). `app/(site)/neighborhoods/[slug]/page.tsx` renders one neighborhood with
  listings and events.
- `lib/content/source.ts` has a `ContentSource` (seed or Sanity) returning `Neighborhood[]`; the type in
  `lib/content/types.ts` is editorial: `_id`, `name`, `slug`, `hero`, `overview`, `highlights`, `featuredListings`,
  `market`, `county`, `tagline`, `stat`. The Sanity schema is `sanity/schemas/neighborhood.ts`.
- `lib/content/seed/neighborhoods.ts` has 8 editorial neighborhoods. Slug join to the dataset:
  `country-club-east`, `waterside`, `siesta-key`, `west-bradenton`, `downtown-bradenton`, `anna-maria-island` match
  exactly; seed `lake-club` = dataset `the-lake-club`; `west-of-the-trail` is an editorial grouping with no dataset
  record.
- The dataset's `_id` is `neighborhood-<slug>`, the same convention as the seed.
- `lib/fair-housing.ts` exports `checkFairHousing(content)`.

**Suggested model:** keep the editorial layer (Sanity/seed: hero, overview, highlights) for the handful of
featured places, and treat this dataset as the directory underneath it, joined by slug. The JSON stays the source
of truth for the facts, because the refresh scripts write to it and every fact carries its sources. Importing 2,088
documents into Sanity is possible (`_id` already fits), but then the refresh scripts would need to write to Sanity
instead; decide that with the owner before building it.

## Search: what it needs to do

The owner wants to search within the neighborhoods tab. Behaviour, not layout:

- **Match** on `q` in the search index: name, aliases, ancestor names, ZIPs, active builders, developer, HOA name,
  jurisdiction and type, already normalized. Normalize the query the same way
  (`lower-case, & → and, drop apostrophes, non-alphanumerics → space`; see `norm` in `scripts/build-search-index.mjs`).
- **Rank** exact name/alias match, then name prefix, then whole-word matches, then substring; break ties with
  level (area, community, enclave) and `research: "full"` before `registry-only`.
- **Filter** by market (already a URL param), level, type, status (selling / coming-soon / established /
  built-out), `bradentonArea` (the Palmetto/Ellenton/Parrish group inside Bradenton), county, jurisdiction,
  home types, gated.
- **Hierarchy:** show `path` with each result ("Palmer Ranch › Deer Creek") and let an area or community list its
  children (`parentSlug`).
- **Weight:** don't send `neighborhoods.json` to the browser. Either filter on the server from `searchParams`
  (matches the current `?market=` pattern and needs no client JS), or ship the search index (about 1 MB raw, much
  smaller gzipped; trim fields you don't use) to a client-side filter. No search library is required at this size.

## Display rules (hard rules — brokerage fair-housing compliance)

- **Never render `notes`.** They are internal research notes (conflicts, stale-source flags, scope edges).
- **Descriptions** are fair-housing checked. Don't add adjectives about people or who a place is "for"; run
  `checkFairHousing` over any text you generate around them.
- **Schools:** show the names exactly as stored, link to `zonedSchools.sourceUrl`, and always show
  `zonedSchools.note` ("Zoning is by address and can change…"). No ratings, rankings, test scores or
  "good schools" language. Don't show schools on `area` records (they have none on purpose).
- **55+:** show nothing age-related. No record has `ageRestricted: true` (it needs HOPA documents). Don't derive it
  from names like "Active Adult" or builder labels.
- **No prices, values or market statistics** from this dataset.
- **Evacuation zone:** "Evacuation zone A" etc., linked to the county page in the record's sources
  (`mymanatee.org … know-your-evacuation-level` or `scgov.net/know-your-evacuation-zone`); `"none"` means outside every
  zone. Pair it with a note to confirm a specific address with the county.
- **Status and builders** are as of the checked date on their source; show that date ("Builders selling as of
  Sep 2026") or leave status out.
- **Registry-only records** are thin (a name plus map facts). Reasonable choices: keep them searchable but out of
  default browse lists, and consider `noindex` on their detail pages until they have more content.
- **Sources:** it is fine, even good, to show a "Sources" list with links. Never show anything that looks like a
  person's name, email or phone (there are none in the data; keep it that way).

## Keeping it current

`docs/REFRESH-RUNBOOK.md` has the full schedule. In short:

| When | Command | Result |
|---|---|---|
| Every edit | `validate` then `index` | exit 0; index rebuilt |
| Monthly | `check-builders`, `discover --source pulte-markers,mi-homes,lennar,mattamy,lwr-villages` | report of status changes and new builder communities, for a person to apply |
| Quarterly | `discover` (registries), `refresh-gis` then `refresh-gis --apply` | new registry names; ZIP / jurisdiction / school / evacuation drift applied |
| When Manatee posts 2027-28 zones | `refresh-gis --only schools --county Manatee --school-year 2027 --apply` | high-school rezoning applied; locator URL and note updated |
| Before June 1 | `refresh-gis --only evac --apply` | evacuation zones re-checked |

Only `refresh-gis --apply` writes facts to the data, because those come straight from county/district services.
Builder status and new communities are always reported for review, never applied. A scheduled GitHub Action that
runs the monthly reports and opens an issue with the findings would fit, if the owner wants it.

## Testing status of the scripts

- `validate.mjs` and `build-search-index.mjs` were run against this data: 0 errors; the rebuilt index is
  byte-for-byte equal to the shipped one. `validate.mjs` also caught every error in a deliberately broken copy.
- `refresh-gis.mjs`: the address formatter reproduces all 1,948 stored checked addresses exactly. The live query
  logic was run in a browser against the real services for 8 records in both counties (including a K-8 zone) and
  matched every stored value. The `--apply` path and a school-year change were tested with mocked responses.
- `check-builders.mjs`: the Pulte map-marker API was checked live (13 of 13 PulteGroup communities matched
  the dataset); host parsers and findings were tested with mocked pages.
- `discover.mjs`: every source was fetched live in a browser; with the shipped baseline, the dataset matches all
  builder and Lakewood Ranch lists and there are 0 new candidates.
- The network scripts have not been run end to end from Node against the live services (this workspace blocks
  those hosts). Start with `--limit 5`. Some builder sites (M/I behind Cloudflare, Taylor Morrison) may refuse
  server-side requests; the scripts report those as `blocked` for a browser check.

## A good first prompt

> Read neighborhood-data/CLAUDE-CODE-HANDOFF.md. Add the folder to the repo as described, wire the types into
> lib/content, and add search to the /neighborhoods page using data/neighborhoods.search.json, following the
> search and display rules. Keep the existing editorial neighborhoods and join them to the dataset by slug.
> Run `node neighborhood-data/scripts/validate.mjs` before committing.
