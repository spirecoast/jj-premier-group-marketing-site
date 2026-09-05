# Content model

Six document types. Slugs are required and unique on every type that has a public page.

## listing

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | source: address |
| `address` | object | street, city, state, zip |
| `geo` | geopoint | for map display |
| `price` | number | |
| `beds` `baths` `sqft` | number | baths allows halves |
| `status` | string | `active` \| `pending` \| `sold` |
| `hero` | image | required, with alt |
| `gallery` | array of image | each with alt |
| `description` | portable text | |
| `features` | array of string | |
| `mlsNumber` | string | |
| `neighborhood` | reference -> neighborhood | |
| `agent` | reference -> teamMember | |
| `featured` | boolean | drives the home page grid |
| `soldDate` | date | required when status is sold |

## event

The culture and arts calendar. Highest volume type.

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | |
| `summary` | text | one or two sentences |
| `startsAt` | datetime | required, indexed |
| `endsAt` | datetime | |
| `allDay` | boolean | |
| `venue` | reference -> venue | required |
| `category` | string | `music` \| `theater` \| `gallery` \| `festival` \| `family` \| `market` |
| `ticketUrl` | url | |
| `priceNote` | string | free text, e.g. "Free" or "$15 at the door" |
| `image` | image | |
| `source` `sourceUrl` | string, url | attribution for where the listing came from |
| `featured` | boolean | |

## venue

Separate type, not a string on the event. Venues recur, and a venue page is a useful local page.

| Field | Type |
|---|---|
| `name`, `slug` | string, slug |
| `address`, `geo` | object, geopoint |
| `neighborhood` | reference -> neighborhood |
| `website`, `image` | url, image |

## neighborhood

| Field | Type | Notes |
|---|---|---|
| `name`, `slug` | string, slug | |
| `hero` | image | |
| `overview` | portable text | |
| `highlights` | array of object | label + description |
| `featuredListings` | array of reference -> listing | optional manual curation |

Events and listings link to a neighborhood, so the neighborhood page can query both. That reference is where most of the calendar's SEO value comes from: a neighborhood page showing what is happening there this month outranks one made of adjectives.

## post

`title`, `slug`, `cover`, `excerpt`, `body` (portable text), `publishedAt`, `author` (reference -> teamMember), `categories`.

## teamMember

`name`, `slug`, `headshot`, `title`, `licenseNumber`, `bio`, `phone`, `email`, `order`.

## siteSettings

Singleton. Brokerage name, brokerage logo, office address, both license numbers, social links, default OG image, footer disclosure text.

## Queries

- Upcoming events: filter `startsAt >= now()`, order ascending. No scheduled publishing needed.
- Past events: available at their permalinks until archived.
- Neighborhood page: pull that neighborhood's active listings plus its upcoming events in one query.

## Archiving

Cron route `POST /api/cron/archive-events` runs weekly. Deletes or unpublishes events whose `endsAt` is more than 12 months past. Required at launch, not later — the free tier document cap counts drafts and system records, and an unbounded calendar is what would eventually breach it.

## Structured data

- `listing` detail -> schema.org `Residence` / `Product` as appropriate
- `event` detail -> schema.org `Event` with `startDate`, `location`, `offers`
- `teamMember` and `siteSettings` -> `RealEstateAgent` on the home and about pages

Also expose `GET /api/calendar.ics` so visitors can subscribe to the calendar. Cheap to build, disproportionately good for repeat visits.
