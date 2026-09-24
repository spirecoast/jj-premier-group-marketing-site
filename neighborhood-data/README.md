# JJ Premier Group — neighborhood data package

2,088 areas, communities and enclaves across the site's three markets (Lakewood Ranch, Sarasota, Bradenton),
each fact backed by a primary source with the date it was checked. Exported 2026-09-23.

Start with **CLAUDE-CODE-HANDOFF.md** — it covers where this goes in the site repo, how search should behave,
the display rules, and how to keep the data current.

```
CLAUDE-CODE-HANDOFF.md   read first
data/                    neighborhoods.json (canonical), neighborhoods.search.json (search index), CSVs, coverage
schema/                  TypeScript types + JSON Schema
scripts/                 validate, rebuild index, refresh county facts, check builders, discover new places
docs/                    DATA-SOURCES, REFRESH-RUNBOOK, RESEARCH-RULES, DATASET-README
```

Quick check (no network needed):

```bash
node scripts/validate.mjs
node scripts/build-search-index.mjs
```
