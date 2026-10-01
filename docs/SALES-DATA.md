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
| Manatee | https://www.manateepao.gov/cama-reports/ | `/data/Manateesales.csv` (all sales from Jan 1 of the previous year, rebuilt nightly), `/data/manateesales<YYYY>.csv` for any earlier year the 24-month window reaches into, `/data/manatee_situs_addresses.zip` (parsed situs addresses) |
| Sarasota | https://www.sarasotapropertyappraiser.gov/downloads/download-data/ | `/downloads/SCPA_Parcels_Sales_CSV.zip`, entries `Parcel_Sales_CSV/ParcelSales.csv` (every transfer since 2000 with its FDOR qualification code) and `Parcel_Sales_CSV/Sarasota.csv` (parcel characteristics from the last certified roll) |

The Manatee sales file carries the situs address, use code, living area,
acreage and year built on each sale row; the situs zip supplies the parsed
number, street, suffix and unit. Sarasota keeps sales and parcel facts in
two files joined on the account number.

## Running it

```
npm run sales:ingest                       # download, normalize, write data/sales/
node scripts/sales/ingest.mjs --no-download   # reuse .cache/sales/ from the last run
node scripts/sales/ingest.mjs --county manatee --months 24 --dry-run
```

The script needs only Node 22 (fetch, zlib, streams; the zips are read with
a small central-directory reader, no dependency). Source files are cached
in `.cache/sales/` (gitignored). A full run downloads about 100MB and takes
under a minute; the output is about 1.7MB gzipped and must stay under 8MB.

### Refresh cadence

The county files change nightly (Manatee) and after each roll update
(Sarasota). `.github/workflows/sales-refresh.yml` runs the script every
Sunday at 09:00 UTC (and on demand from the Actions tab) and opens a pull
request with the new files. Review the PR's manifest diff (row counts, date
range) before merging; a county file that fails to download fails the run
rather than writing an empty county. Merge one in the last week of each month:
the Tide issue built on the 1st reads whatever data is deployed, and without a
refresh it covers the same month as the run before (docs/ISSUES.md).

## Output

`data/sales/<county>.json.gz`: a gzipped JSON array of records, newest first.
`data/sales/manifest.json`: generated date, window, row counts by property
type, date range, source URLs, checksum, the licence note and
`namesStripped: true`.

### Field map

| Field | Manatee column | Sarasota column | Notes |
| --- | --- | --- | --- |
| `county` | | | `manatee` or `sarasota` |
| `parcelId` | `PARID` | `Account` / `ACCOUNT` | the appraiser's parcel number |
| `number`, `predir`, `street`, `suffix`, `postdir`, `unit` | situs file `SITUS_ADDRESS_NUM`, `SITUS_PREDIR`, `SITUS_STREET_NAME`, `SITUS_STREET_SUF`, `SITUS_POSTDIR`, `SITUS_SECADDUNIT`; falls back to parsing `SITUS_ADDRESS` | `LOCN`, `LOCS` (split into name and suffix), `LOCD`, `UNIT` | situs (property) address only, never a mailing address |
| `city`, `zip` | `SITUS_POSTAL_CITY`, `SITUS_POSTAL_ZIP` | `LOCCITY`, `LOCZIP` | postal city as the county gives it |
| `lat`, `lng` | not published | not published | omitted; `manifest.hasCoordinates` is false. `nearby()` in `lib/sales` returns nothing until a source adds them |
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
  `GET /api/sales?street=&zip=&city=&county=`, inputs length-capped, at
  most 50 rows newest first, a summary computed over every match on the
  street, `Cache-Control: s-maxage=60`. With no data it answers 503
  `{ error: "no-data" }` and the page shows its "not loaded yet" state.
  With `&number=` (one to eight digits; a ZIP is then required) the
  response adds `parcel`: that house's own qualified sales, newest first,
  from `findParcelSales` (exact number, street key and ZIP; a typed unit
  picks the unit). `/sell/home-value` reads it for "This address on the
  record". The pure matcher and street parsing live in `lib/sales/parcel.ts`
  and `lib/sales/street.ts` so `lib/sales/parcel.test.ts` runs on a fixture.
- `next.config.ts` lists `data/sales/**` in `outputFileTracingIncludes`
  for the route and the page so the files ship with the serverless
  functions.

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
- **No coordinates.** Neither public file carries lat/lng, so the nearby
  search is a stub until a geocoded source is added.
- **Manatee beds and baths** are null; they live in the larger CAMA file.
- **Window.** Only the last 24 months are kept; the window moves with each
  ingest run, so a stale file quietly loses its oldest months.
