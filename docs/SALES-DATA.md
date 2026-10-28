# County sales data

The "What sold on your street" tool at `/sell/sold` reads the qualified,
arm's-length sales the two county property appraisers publish, normalized
into `data/sales/`. Nothing on that page is typed by hand: every address,
date, price and median comes from these files or is absent.

## Sources

Both offices publish their rolls and sales as public record under Florida
Statutes chapter 119. Neither file is MLS data and neither carries a licence
beyond the statute; the manifest records that note.

| County | Page | Files the script reads |
| --- | --- | --- |
| Manatee | https://www.manateepao.gov/cama-reports/ | `/data/Manateesales.csv` (all sales from Jan 1 of the previous year, rebuilt nightly), `/data/manateesales<YYYY>.csv` for any earlier year the 24-month window reaches into, `/data/manatee_situs_addresses.zip` (parsed situs addresses), and from https://www.manateepao.gov/gis-shape-files/ `/data/shape_files/Parcels.zip` (parcel polygons) and `/data/shape_files/Condominium_Unit_Points.zip` (a point per condominium unit) for coordinates |
| Sarasota | https://www.sarasotapropertyappraiser.gov/downloads/download-data/ | `/downloads/SCPA_Parcels_Sales_CSV.zip`, entries `Parcel_Sales_CSV/ParcelSales.csv` (every transfer since 2000 with its FDOR qualification code), `Parcel_Sales_CSV/Sarasota.csv` (parcel characteristics from the last certified roll), and its code tables `SubdivisionCodes.csv` and `NeighborhoodCodes.csv` |

The Manatee sales file carries the situs address, use code, living area,
acreage and year built on each sale row; the situs zip supplies the parsed
number, street, suffix and unit. Sarasota keeps sales and parcel facts in
two files joined on the account number.

Coordinates come from Manatee's GIS layers, joined on the parcel number every
sales row carries: the centroid of the parcel polygon (area-weighted, in
`scripts/sales/geo.mjs`, projected from Florida West State Plane feet to
latitude and longitude and rounded to five decimals, about a metre), or the
unit's point for a condominium. About 97% of Manatee rows get one. Sarasota's
appraiser publishes no parcel geometry in its downloads (the state's GIS roll
is by request), so Sarasota rows carry none; the pages fall back to the
subdivision and the ZIP there. A GIS download that fails leaves the rows
without coordinates and the run goes on (the verify step warns).

## Running it

```
npm run sales:ingest                       # download, normalize, write data/sales/
node scripts/sales/ingest.mjs --no-download   # reuse .cache/sales/ from the last run
node scripts/sales/ingest.mjs --county manatee --months 24 --dry-run
```

The script needs only Node 22 (fetch, zlib, streams; the zips are read with
a small central-directory reader, no dependency). Source files are cached
in `.cache/sales/` (gitignored). A full run downloads about 150MB and takes
under a minute; the output is about 3MB gzipped and must stay under 8MB.

### Refresh cadence

The county files change nightly (Manatee) and after each roll update
(Sarasota). `.github/workflows/sales-refresh.yml` runs the script every
Sunday at 09:00 UTC (and on demand from the Actions tab) and opens a pull
request with the new files. A county file that fails to download fails the
run rather than writing an empty county.

### The regression gate

Two checks stand between a county file and a merge-ready pull request:

- **The header.** The ingest names every column it reads from each file
  (`REQUIRED` in `scripts/sales/ingest.mjs`). A renamed or dropped column
  fails the run with the missing names, instead of reading as empty values
  on every row.
- **The comparison.** `scripts/sales/verify.mjs` (rules in
  `scripts/sales/verify-lib.mjs`, tests in `lib/sales/verify.test.ts`)
  compares the new files with the ones the site serves now. Any of these
  fails the job and no pull request opens: a county's rows fall more than
  10%; its newest sale moves backwards; a property type it had is gone; the
  share of rows with a living area falls more than 5 points; more than 1% of
  rows carry a ZIP outside the county's known set (`KNOWN_ZIPS`). It warns,
  at the top of the pull request, when a county's newest sale hasn't moved
  for three refreshes in a row (`toUnchangedRuns` in the manifest) or is
  more than 21 days old, and when the share of rows with coordinates or a
  subdivision falls more than 5 points.

The pull request body carries the delta table (rows ±, the newest sale and
how far it moved, the new sales by Tide market). The same step writes
`data/sales/new-sales.json.gz`: the sales the county recorded since the
last refresh (a parcel and sale date that weren't in the old file), which
Street Watch emails once the refresh is merged and deployed (below).

Set the repository variable `SALES_AUTO_MERGE` to `true` and a refresh with
no failures and no warnings is set to merge itself (`gh pr merge --auto`)
once the branch's required checks pass; it needs "Allow auto-merge" on in
the repository settings. A pull request opened by the workflow's own token
doesn't start other workflows, so if `main` requires the CI check, that
check never reports and the auto-merge waits for a person. Unset, a person
merges as before. Merge one in the last week of each month:
the Tide issue built on the 1st reads whatever data is deployed, and without a
refresh it covers the same month as the run before (docs/ISSUES.md).

## Output

`data/sales/<county>.json.gz`: a gzipped JSON array of records, newest first.
`data/sales/manifest.json`: generated date, window, row counts by property
type, date range, `toUnchangedRuns`, the shares of rows with a living area,
coordinates and a subdivision, source URLs, checksum, the licence note and
`namesStripped: true` (`schema: 2`).
`data/sales/new-sales.json.gz`: `{ generatedAt, since, through, rows }`, the
sales new since the previous refresh (see the regression gate).

### Field map

| Field | Manatee column | Sarasota column | Notes |
| --- | --- | --- | --- |
| `county` | | | `manatee` or `sarasota` |
| `parcelId` | `PARID` | `Account` / `ACCOUNT` | the appraiser's parcel number |
| `number`, `predir`, `street`, `suffix`, `postdir`, `unit` | situs file `SITUS_ADDRESS_NUM`, `SITUS_PREDIR`, `SITUS_STREET_NAME`, `SITUS_STREET_SUF`, `SITUS_POSTDIR`, `SITUS_SECADDUNIT`; falls back to parsing `SITUS_ADDRESS` | `LOCN`, `LOCS` (split into name and suffix), `LOCD`, `UNIT` | situs (property) address only, never a mailing address |
| `city`, `zip` | `SITUS_POSTAL_CITY`, `SITUS_POSTAL_ZIP` | `LOCCITY`, `LOCZIP` | postal city as the county gives it |
| `lat`, `lng` | `Parcels.zip` polygon centroid, else `Condominium_Unit_Points.zip`, on `PARCELNO` | not published | five decimals; absent when the parcel has no shape. `nearby()` in `lib/sales` reads them |
| `subdivision` | `SUBDIVISION_NAME` | `SUBD` → `SubdivisionCodes.csv` | as the county spells it, minus Manatee's plat-book reference ("PB35/198"); "" for "not in a subdivision" |
| `nbhd` | `NEIGHBORHOOD_NAME` | `NGHB` → `NeighborhoodCodes.csv` | the appraiser's valuation neighborhood, same cleaning |
| `saleDate` | `SALE_DATE` | `SaleDate` | ISO `YYYY-MM-DD` |
| `salePrice` | `SALE_PRICE` | `SalePrice` | whole dollars; rows under $1,000 dropped |
| `qualified`, `qualCode` | `SALE_TRANSFER_CODE` | `QualCode` | FDOR codes 01–04 kept (see below) |
| `instrument` | `SALE_INSTR_TYPE` | `DeedType` | WD, SW, CD, PR… as the county codes it |
| `livingArea` | `BLDGS_SQFT_LIVING` | `LIVING` | heated square feet from the roll |
| `lotSqft` | `LAND_ACREAGE` × 43,560 | `LSQFT` | |
| `yearBuilt` | `BLDG1_YEAR_BUILT` | `YRBL` | |
| `beds`, `baths` | not in the sales file (null) | `BEDR`, `BATH` + ½ × `HALFBATH` | Manatee publishes these only in the 68MB CAMA file, not read today |
| `propertyUse` | `LAND_USE_CODE` | `STCD` | DOR use code, read per county: `single-family` (Manatee 0100/0101 model home/0105; Sarasota 0100/0105), `townhome` (Manatee 0110; Sarasota 0101/0102 attached units), `villa` (Manatee 0108 half duplex / paired villa), `condo` (04xx), `vacant` (00xx), `other` (the rest, Manatee 0164 uninhabitable, and 0900 common area) |

### Qualification

The FDOR sale qualification code says whether the appraiser treats a
transfer as an arm's-length market sale. The ingest keeps **01** (qualified
by deed examination), **02** (qualified by evidence), **03** and **04**
(qualified, but the parcel's characteristics or legal description changed
after the sale). Everything else is dropped: 05/06 are qualified but span
several parcels so the price belongs to more than one address; 11 and up
are quit claims, corrective deeds, transfers to or from lenders, estates,
affiliated parties, forced sales and the rest.

A sale is treated as **roll-changed** when its code is 03/04 or when the
roll's year built is later than the sale year (`rollChanged()` in
`lib/sales`). The page's $/sqft median uses only rows that are not
roll-changed and have a recorded living area, because otherwise the
building facts are not the ones that were paid for; those rows carry a
dagger. Rows the roll still shows as vacant are labelled "Vacant on the
roll" and the summary counts them apart from homes.

## The no-names rule

Owner, grantor and grantee columns (Manatee `SALE_GRANTOR`, `SALE_GRANTEE`;
Sarasota `Grantor`, `NAME1`…`NAME_ADD5` and the mailing address) are
present in the source rows and are discarded in `scripts/sales/ingest.mjs`
before anything is written. They never reach `data/sales/`, `lib/sales` or
the browser. The script logs the rule on every run, the manifest records
`namesStripped: true`, and the page shows a street, a number, a date and a
price, nothing about who. Keep it that way: a future column added to the
record should be a fact about the property or the transaction.

## Serving

- `lib/sales/index.ts` (`server-only`) loads and caches both files in
  memory on first use, indexes by a folded street key (suffix and
  directional variants, ordinals, case) and exposes `searchByStreet`,
  `nearby`, `summarize`, `getSalesManifest` and `formatSaleAddress`.
- `app/api/sales/route.ts` is the only way the browser sees the data:
  `GET /api/sales?street=&zip=&city=&county=`, inputs length-capped, every
  row on the street newest first (up to 1,000; a street in the window has a
  few hundred at most), a summary computed over every match on the street
  (`medianPrice` over everything, `medianResalePrice` over the rows the roll
  shows as a building and `medianNewerPrice` over the new builds and lots,
  since a street of lot transfers must not set the price a seller sees),
  `Cache-Control: s-maxage=60`. With no data it answers 503
  `{ error: "no-data" }` and the page shows its "not loaded yet" state.
  `source.through` lists each county's `to` date, so a page can say
  "Manatee records through Sep 24, 2026" instead of the manifest's date.
  A typed `city` is resolved to the ZIPs the county files that city in
  (`lib/sales/area.ts`: a ZIP counts for a city when the city labels 5% or
  25 of its rows), because the county labels 34211 both LAKEWOOD RANCH and
  BRADENTON row by row; the rows keep their stored label. An ambiguous
  street (several spellings or ZIPs, nothing to pick one) answers 400
  `zip-required` with `options`, one `{ street, zip, count }` per pair, which
  Tide Street offers as chips.
  With `&number=` (one to eight digits) the response adds `parcel`: that
  house's own qualified sales, newest first, from `findParcelSales` (exact
  number, street key and ZIP; a typed unit picks the unit). The ZIP may be
  left out when the street runs through one ZIP only; otherwise the answer
  is `zip-required`. `/sell/home-value` reads it for "This address on the
  record", and Tide Street for the parcel card above the street. The pure
  matcher and street parsing live in `lib/sales/parcel.ts` and
  `lib/sales/street.ts` so `lib/sales/parcel.test.ts` runs on a fixture.
- When the typed street names a place instead (an Atlas area, community or
  enclave by name or alias, or a postal city), a non-exact answer carries
  `place: { slug, name, zips }` and Tide Street offers "Sales in {place}".
  `GET /api/sales?place=<slug>` then answers `match: "area"` with every
  qualified sale in the place's ZIPs (its own and its descendants'; newest
  200 rows, the summary over all of them). A postal city's set is the slug
  `city:<zip>-<zip>`. The matcher is `lib/sales/area.ts`; the route reads the
  Atlas search index through `lib/neighborhoods/data.ts`, so `next.config.ts`
  traces it for `/api/sales`.
- **Joined to places** (`lib/sales/places.ts`, `lib/sales/similar.ts`, tests in
  `lib/sales/places.test.ts`). Each row's `subdivision` and `nbhd` are matched to Atlas places by
  name (docs/SITE.md, "What sold here"); `salesForPlace(slug)` gives a place's own sales and its
  ZIP area, for its page and the compare table. On a street result `/api/sales` adds `places` (the
  Atlas places the street's sales belong to, then the areas its ZIP is in; Tide Street links them
  under the result) and, for a street with fewer than three sales, `alsoIn` (the other sales in its
  subdivision). With a house number and a parcel on the record it adds `similar`: the same kind of
  home within 20% of its living area, roll facts as paid for, sold in the twelve months before the
  county's newest sale, nearest first within half a mile (widening to one and two miles until there
  are three) when the parcel has coordinates, else in the same subdivision, else the same ZIP. Home
  Value shows them as evidence beside the house, never as a number for it. Coordinates never leave
  the server; a similar row carries its distance to a tenth of a mile.
- Tide Street draws every row on a timeline (`lib/sales/timeline.ts`,
  `components/sales/sales-timeline.tsx`): date across, price up, resales
  filled and new builds and lots hollow, the chosen group's median as a
  dashed rule. The median toggle (resales, new builds and lots, and "like
  yours" when a house number found a parcel with a recorded size: resales
  within 300 square feet of it, `sizeBand` in `lib/sales/stats.ts`) swaps the
  median and the $/sqft; the timeline and the table keep every sale. The
  table sits behind a disclosure, 25 rows at a time. The last five streets
  searched are kept in the visitor's own browser (`lib/sales/recent.ts`),
  never a house number.
- `next.config.ts` lists `data/sales/**` in `outputFileTracingIncludes`
  for the route and the page so the files ship with the serverless
  functions.

## Street Watch

`new-sales.json.gz` feeds Street Watch (docs/ISSUES.md, "Street Watch"): after a refresh is merged
and deployed, the daily `/api/cron/street-watch` run emails each confirmed watcher the new sales on
their street or in their place. `getNewSales`, `placeMatcher`, `streetSales` and `throughDates` in
`lib/sales` are its inputs.

## Limitations

- **Roll latency.** The county's roll runs weeks behind the closing table,
  and a new build sold before the roll caught up appears as vacant with a
  house price. Sarasota usually recodes these 03 (qualified, characteristics
  changed); Manatee keeps them 01 with the vacant use code, so the use code
  and the year built, not the qualification code, are what the page reads.
  Vacant rows are labelled "Vacant on the roll" and counted apart from
  homes; a year built after the sale year marks a row roll-changed.
- **Not MLS.** No list price, days on market, photos or agent remarks;
  these are deed transfers as the appraiser recorded them.
- **Unqualified sales excluded.** Transfers the appraiser did not qualify
  as arm's-length are not shown, so a street's count here is lower than a
  title search would give.
- **Coordinates in Manatee only.** Sarasota's appraiser doesn't publish
  parcel geometry in its downloads; geocoding its situs addresses once (the
  Census geocoder is free) is the way to add them if the nearby panel
  should reach Sarasota.
- **Manatee beds and baths** are null; they live in the larger CAMA file.
- **Window.** Only the last 24 months are kept; the window moves with each
  ingest run, so a stale file quietly loses its oldest months.
