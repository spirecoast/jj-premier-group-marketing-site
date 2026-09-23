# Refresh runbook

How to keep `data/neighborhoods.json` current. The scripts never invent facts: they re-read the same official
sources the dataset was built from and write a report. Anything a person has to judge (a community's status, a
new community, a scope question) is reported, never applied automatically. Only the county map-service lookups
(`refresh-gis.mjs --apply`) write to the data, because those values come straight from the county or district.

Requirements: Node 20 or newer, no npm packages. Network access to the hosts in DATA-SOURCES.md (if you run the
scripts inside a sandbox with an egress allowlist, add those hosts or run them on your own machine).
Reports go to `reports/` (git-ignore it).

## Every change, however small

```bash
node scripts/validate.mjs            # must exit 0
node scripts/build-search-index.mjs  # regenerates data/neighborhoods.search.json
```

Then, in the site repo, run its own fair-housing check (`lib/fair-housing.ts`) over any new or changed
descriptions, and commit data + index together. For every fact you add or change, add or update the source entry
(`url`, `supports`, `checked` = today, `sourceDate` if the page shows one). See RESEARCH-RULES.md.

## Monthly (about 30 minutes)

1. **Builder status**
   ```bash
   node scripts/check-builders.mjs
   ```
   Open the newest `reports/check-builders-*.json` and work through `findings`:
   - "a builder page shows selling; dataset status is …" → confirm on the page, set `status: "selling"`, add
     the builder to `activeBuilders`, touch the source's `checked` date.
   - "every builder page is sold out / gone … consider built-out" → confirm on the page. A developer community
     with no builder selling becomes `built-out`; note the evidence in `notes`.
   - "X no longer selling here" → remove X from `activeBuilders`.
   - Pages reported `blocked`, `needs-browser` or `unknown` → open them in a browser and read the status.
   - Records flagged "no builder page on record" are selling through a developer (often lakewoodranch.com);
     check the developer page by hand.
2. **New builder communities**
   ```bash
   node scripts/discover.mjs --source pulte-markers,mi-homes,lennar,mattamy,lwr-villages
   ```
   Each candidate in the report is a name a builder or Lakewood Ranch now lists that the dataset doesn't have.
   `possibleMatches` suggests existing records it may be (a renamed phase, a builder's marketing name).
   Research new ones per RESEARCH-RULES.md, add them, then run `refresh-gis.mjs --slug <new-slug> --apply`
   to fill ZIP, jurisdiction, schools and evacuation zone.
3. Validate, rebuild the index, commit.

## Quarterly

1. **Registries**
   ```bash
   node scripts/discover.mjs --source manatee-neighborhoods,sarasota-neighborhood-associations,city-of-sarasota-neighborhoods
   ```
   New names in the county/city registries. Apply the same inclusion test as the build (RESEARCH-RULES.md §4):
   skip apartments, RV parks, senior residences, plat-only names, out-of-scope places. After reviewing, mark
   what you decided not to add as seen so it stops appearing:
   ```bash
   node scripts/discover.mjs --update-baseline
   ```
   (Only run `--update-baseline` after you have reviewed the report: it marks every current candidate as seen.)
2. **Map-service drift** (annexations, re-addressed points)
   ```bash
   node scripts/refresh-gis.mjs --limit 5          # smoke test
   node scripts/refresh-gis.mjs                    # full report, ~2,000 records, 15–30 min
   ```
   Read `changes` and `flags` in the report. When the changes look right:
   ```bash
   node scripts/refresh-gis.mjs --apply
   ```
3. **Stale sources.** `validate.mjs` prints how many records cite a source whose own date is more than two years
   old. Pick the selling / full-research ones first and re-check them.

## Yearly

- **School zones — when the districts publish the next school year** (usually spring/summer).
  - Manatee: when `https://app.guidek12.com/manateefl/school_search/2027/` exists, run
    ```bash
    node scripts/refresh-gis.mjs --only schools --county Manatee --school-year 2027            # report
    node scripts/refresh-gis.mjs --only schools --county Manatee --school-year 2027 --apply
    ```
    Manatee's high-school zones change for 2027-28, so expect many high-school changes. The script rewrites the
    locator URL, the note and the source entry for the new year.
  - Sarasota: `node scripts/refresh-gis.mjs --only schools --county Sarasota` (same layer every year).
- **Evacuation zones — before June 1 (hurricane season):** `node scripts/refresh-gis.mjs --only evac`, then `--apply`.
- **HOPA / 55+:** no record is marked age-restricted today. Only set `ageRestricted: true` with a governing
  document that cites the Housing for Older Persons Act; `coverage.json` lists the 8 communities that still need
  documents (Camelot Lakes' prospectus is a scanned image; Cresswind's and Woodland Preserve's documents sit behind resident logins; a builder calling a community "active adult" is not a HOPA document).

## What the scripts touch

| Script | Network | Writes data? |
|---|---|---|
| `validate.mjs` | no | no |
| `build-search-index.mjs` | no | writes `data/neighborhoods.search.json` |
| `refresh-gis.mjs` | ArcGIS (Manatee, Sarasota), GuideK12 | only with `--apply`: `zips`, `jurisdiction`, `zonedSchools`, `evacuationZone`, source checked dates, one note line |
| `check-builders.mjs` | builder sites, Pulte API | no (report only) |
| `discover.mjs` | registries, builder lists, LWR API | only `data/discover-baseline.json` (first run or `--update-baseline`) |

## When a script breaks

- **ArcGIS error "Invalid field"**: the county renamed a field. Open the layer URL in a browser (`?f=json`), find
  the new name, update the `outFields` in the script, and update DATA-SOURCES.md.
- **GuideK12 `list_schools failed`**: the year path doesn't exist yet, or the API refuses server-side requests.
  Check the locator page in a browser; if it works there but not from Node, run the lookups from a browser tab on
  app.guidek12.com (the same request body works with `fetch` there).
- **check-builders reports `unknown` for a host that has a parser**: the builder changed its markup. Open a page,
  find the new status marker, update `PARSERS` in `check-builders.mjs`.
- **Cloudflare / 403**: some builders block non-browser requests. Check those pages in a browser.
