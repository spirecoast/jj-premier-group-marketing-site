# Scripts

Node 20+ (built-in `fetch`), ES modules, no npm packages. Run from the package root. Reports are written to
`reports/<script>-<timestamp>.json`. Paths: data defaults to `../data` next to this folder; override with
`NEIGHBORHOODS_DATA_DIR` / `NEIGHBORHOODS_REPORTS_DIR` or `--data <file>`.

| Script | Network | What it does |
|---|---|---|
| `validate.mjs` | no | Checks shape, enums, unique slugs/ids, parent links, coordinates, sources and dates, fair-housing and price language, 55+ rule, school fields, and people's contact details. Exit 1 on any error. |
| `build-search-index.mjs` | no | Rebuilds `data/neighborhoods.search.json` from the full dataset. |
| `refresh-gis.mjs` | yes | Re-runs the county/district lookups (address point, ZIP, jurisdiction, zoned schools, evacuation zone) and reports changes. `--apply` writes them. Flags: `--limit`, `--slug a,b`, `--county Manatee` (or `Sarasota`), `--only address,schools,evac`, `--school-year 2027`, `--concurrency 4`. |
| `check-builders.mjs` | yes | Reads builder pages (and the PulteGroup map-marker API) for selling / coming-soon / built-out records and reports mismatches. Never writes data. Flags: `--slug`, `--limit`. |
| `discover.mjs` | yes | Pulls the county/city registries, builder lists and Lakewood Ranch's villages API, and reports names not in the dataset and not in `data/discover-baseline.json`. Flags: `--source a,b`, `--save <dir>`, `--from <dir>`, `--update-baseline`. |
| `lib.mjs` | — | Shared helpers: fetch with retries, ArcGIS query/paging, name normalization, source/note helpers, address formatting. |

Typical order after any edit: `node scripts/validate.mjs && node scripts/build-search-index.mjs`.
See `../docs/REFRESH-RUNBOOK.md` for the schedule and how to review each report.
