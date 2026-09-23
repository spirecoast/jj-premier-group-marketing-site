# Encore Arts Calendar — data build (collected 2026-09-22)

782 listings · 2,229 upcoming dates · 105 venues · Sarasota, Bradenton, Lakewood Ranch · through 2028-01-09.
Every listing was taken from the venue's or presenter's own site (or the ticketing page it links to); `sources` holds those URLs.

## Files
- `encore-calendar.json` — the full dataset: `venues[]` and `events[]` (one record per production/program; runs list every performance).
- `encore-events.csv` — the same events, one row each, for review in a spreadsheet.
- `encore-performances.csv` — one row per upcoming date (what a day-by-day calendar shows).
- `encore-venues.csv` — the venue directory with event counts.
- `encore-calendar.ics` — subscribable feed, one VEVENT per dated performance (announced/placeholder items left out).

## Event fields (`events[]`)
| field | notes |
|---|---|
| `slug` | unique, URL-safe (`title-yyyy-mm`) |
| `title`, `presenter`, `description` | description is one factual sentence, written fresh (not copied) |
| `market` | `sarasota` · `bradenton` · `lakewood-ranch` |
| `category` | `music` `theater` `gallery` `festival` `family` `market` + `film` `talks` |
| `siteCategory` | the six current site filters only (film→theater, talks→gallery) |
| `subcategory` | broadway, musical, play, opera, ballet, dance, orchestra, chamber, choral, jazz, band, concert, comedy, cabaret, improv, circus, film, exhibition, art-walk, talk, festival, market, family, gala, other |
| `venueKey`, `venueName`, `room`, `city` | `venueKey` joins to `venues[].key` |
| `startDate`, `endDate`, `startTime` | ISO dates, 24h local (America/New_York) times; `endDate` null for single-day and open-ended series |
| `performances[]` | `{date, time}` for every published performance |
| `nextDate`, `nextTime` | first date on or after 2026-09-22 |
| `recurrence` | the organizer's stated pattern for recurring series |
| `price` | exactly as published; null when not published |
| `ticketUrl`, `sources[]` | ticket link and the page(s) the details were verified on |
| `status` | `scheduled` · `announced` (placeholder date) · `sold-out` |
| `notes` | conflicts between pages, TBA wording, advisories |

Mapping to the current site: `slug`→detail URL, `siteCategory`→`?category=`, `market`→`?market=`, `venueKey`→`/venues/<key>`,
`price`→ticket line, first `sources` URL → the "official site" link.
