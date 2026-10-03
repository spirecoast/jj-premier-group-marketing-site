# JJ Premier Group — website build notes

The public site lives in `app/(site)`. It is built from the handoff in `docs/handoff/` and
modelled on the approved homepage composition in
`design/brand-system/JJ Premier Group Website.dc.html` (also deployed at
jj-premier-brand-system.vercel.app).

## Map

| Area | Where |
|---|---|
| Brand tokens (the single definition) | `app/globals.css` `@theme`, `styles/tokens.css`, `docs/handoff/design/BRAND-TOKENS.md` |
| Fonts | `app/layout.tsx` (Newsreader, Cormorant Garamond, Jost, IBM Plex Mono via `next/font`) |
| Site chrome | `components/site-header.tsx`, `site-footer.tsx`, `mobile-action-bar.tsx`, `app/(site)/layout.tsx` |
| Home page sections | `components/home/*`, in page order: 01 `hero`, 02 `meet`, 03 `doors`, 04 `what-we-do`, 05 `three`, 06 `places`, 07 `find-home`, 08 `questions`, 09 `calendar-preview` (Encore), 10 `letter-band` (Tide); composed in `app/(site)/page.tsx`. The design treatments for 03, 04 and 05 live in `components/home/variants/` and are chosen by the `variant` default in `doors.tsx`, `what-we-do.tsx` and `three.tsx`; the gallery is `docs/screenshots/home-design/index.html` |
| Component library | `components/*` (cards, bands, forms, headings, wordmark, CB mark, Equal Housing mark) |
| Data portraits | `lib/art/*` (pure geometry: Tide ridgeline, Atlas star chart, Encore season clock, with tests) and `components/art/*` (the server components that load the data and draw the SVG); on the home page's 05 and as Tide's masthead via `lib/content/mastheads.ts` |
| Content types and data API | `lib/content/` — pages call `getListings()`, `getUpcomingEvents()`, … and never touch a source |
| Sample content | `lib/content/seed/` (used until Sanity is configured; also the seed for `scripts/seed-sanity.ts`) |
| Sanity | `sanity/` (schemas, clients, queries, fetch helper), `sanity.config.ts`, Studio at `/studio` |
| Lead capture | `actions/submit-lead.ts` (the one server action), `lib/lead-pipeline.ts` (Postgres → CRM → team email → Plausible), `lib/crm.ts` (provider switch: Zapier webhook, Follow Up Boss, none), `lib/leads.ts`, `lib/lead-alert.ts`, `lib/lead-sinks.ts`, `app/(site)/thanks/[form]`, `app/api/leads`, `app/api/health`, `scripts/test-lead.mjs` |
| Platform routes | `app/api/revalidate` (Sanity webhook), `app/api/draft-mode/*`, `app/api/calendar.ics`, `app/api/cron/archive-events`, `app/api/search/reindex`, `app/sitemap.ts`, `app/robots.ts` |
| Site search | `lib/search/*` (chunks, indexer, scored hybrid query, fallback, `eval/`), `app/(site)/search`, `app/api/search`, `components/search/*`, `supabase/functions/embed`, `scripts/search-eval.ts`, migrations `0010_search.sql` and `0011_search_score_fusion.sql`; see "Site search" below |
| SEO | `lib/seo.ts` (metadata + JSON-LD helpers), `components/json-ld.tsx` |
| Analytics | `components/analytics.tsx` (Plausible, env-gated), `lib/analytics.ts` (custom events), `lib/plausible-server.ts` (server-side Lead/Subscribe) |
| Encore dataset | `lib/content/encore/encore-calendar.json` (the source), `lib/content/encore.ts` (the converter) |
| Neighborhood explorer | `components/explorer/*` (map, panel, card), `components/place-map.tsx`, `lib/neighborhoods/*` (data access, search, URL state, brand map style) |
| Neighborhood dataset | `neighborhood-data/` (the catalog, its schema, scripts and docs; see its `CLAUDE-CODE-HANDOFF.md`) |

The team's CRM is Coldwell Banker's Home Platform. The site has no agent dashboard, sign-in, tasks,
drips or lead routing; leads reach the Home Platform through the Zapier webhook (`lib/crm.ts`).
Supabase (through Drizzle) holds the lead mirror, the consent records, the questionnaire and the
search index; Resend sends only team-facing email.

## Names, places and what is deliberately not on the page

- Markets: Lakewood Ranch, Sarasota and Bradenton. Tampa was removed in September 2026 at the
  client's direction; `MarketSlug` has three values.
- Photographs: sources stay JPEG under `public/images` (2560px max on the long side); `next.config.ts`
  asks the image optimizer for AVIF first and WebP second, so browsers never receive the source
  file. Every photo goes through `components/photo.tsx`, which gives every box the same treatment:
  square corners, a crop to the box's shape (cards 3:2, the event hero 21:9), and, given the box's
  `frame`, a picture whose shape is far from it shown whole on a blurred copy of itself (Encore tiles
  learn the shape on load, since the index carries no dimensions). Type over a card photograph sits
  on the one `.scrim`; heroes keep `.hero-shade`. Credits are `.image-credit` under a picture and
  `.image-credit-on` as the chip in a card's corner. Provenance, as of October 2026:
  six library files are Adobe Stock photos the client supplied on September 22, 2026
  (`venice-pier-sunrise`, `gulf-beach-aerial`, `modern-home-pool-dusk`, `kitchen-navy-island`,
  `kitchen-white-palms`, `lakes-aerial-sunset`); two came from the team in Slack
  (`culture-opera-house-red-seats`, `lwr-fairways-bay-aerial`; the second looks like the same
  Gasparilla Island golf course as Adobe Stock 1149024203, not Lakewood Ranch, so its alt text no
  longer names a place and Waterside doesn't use it); fifteen are free Adobe Stock
  photos licensed through the Adobe connector on October 2, 2026, kept under their old file
  names with the alt text rewritten to describe the new photo: `place-skyway-bridge` (432458105),
  `sarasota-bayfront-blue-hour` (577886062), `place-sea-oats-wind` (1438764162, Anna Maria
  Island), `place-barrier-island` (402902579, Siesta Key Beach), `place-storm-gulf` (194827807),
  `place-sea-oats-dusk` (1868759290), `place-mangrove-tunnel` (214498460), `moment-key-handoff`
  (409726562), `moment-contract` (484663402), `moment-crossing-room` (383514597),
  `listing-kitchen-4pm-island` (181666488), `listing-twilight-exterior-pool` (482062652),
  `listing-living-room-terrazzo` (1246229897), `listing-exterior-canal-golden` (695619400) and
  `listing-primary-bath-terrazzo` (760469784). A second batch, the same day, under new names:
  `bradenton-courthouse` (1196178507, the Manatee County Courthouse in downtown Bradenton),
  `bradenton-robinson-preserve` (821476786), `golf-course-lakes-aerial` (1149024203),
  `lakefront-houses-palms` (550545686), `palm-lined-street` (569850021) and `tampa-bay-sunset`
  (478498102). None is flagged as AI-generated by Adobe, and none shows people.
  A photo of a named place is used only where that place is named. The rest of
  `public/images/library` are generated frames from the original brand handoff, 1200px or 1376px
  wide. Nothing a visitor sees uses them now: they're left only in the sample listings, which are
  hidden unless `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`. Where free stock had no photo of the named
  place (The Lake Club, Country Club East, West of the Trail), the neighborhood page uses a nearby
  kind of scene with alt text that describes the photo, not the place; Waterside uses the client's lake
  aerial (`lakes-aerial-sunset`). The team photos in `public/images/photos` are
  the team's own. `lib/content/image-dims.ts` groups the files the same way.
- The three products are a family, named once in `lib/site.ts` (`products`, `primaryNav`):
  **Atlas** (the neighborhood explorer, `/neighborhoods`), **Encore** (the arts calendar,
  `/calendar`) and **Tide** (the newsletter and its archive, `/blog`). The desktop nav is two
  groups on one line: the plain pages as caps labels (Buy, Sell, Joelyn & Jessica), a hairline,
  then the products as the name in the display serif with its descriptor beside it on the
  baseline in small mono caps (Atlas NEIGHBORHOODS, Encore ARTS CALENDAR, Tide NEWSLETTER).
  To the right sit the search button (a 44px target that takes 16px of the row) and the Coldwell
  Banker mark, which stays at 185px. Below 1360px (1440px on the home page, where from 1280px the
  header is inset 56px each side to follow the hero; between 1024 and 1279 the home inset is
  16px with a 24px gap so the mark stays inside the frame) the descriptors drop and the names
  stand alone, so the nav never wraps into the search button or the mark. The tightest fits,
  measured in Chromium: 11px spare at 1440 on home, 43px at 1360 elsewhere, 27px at 1024 (11px
  on home). Re-measure at 1440, 1360, 1320, 1024 and 390 after any change to the nav. Each product link's `aria-label` is "name,
  descriptor" and the visible descriptor is `aria-hidden`, so it is read once. The phone menu
  keeps every item at display size with its descriptor on the baseline. "Buy" goes to `/buy`
  until there are live listings to search. The home page carries the three products as section
  05 with a live fact from each, and page eyebrows use the long form ("Tide · The Coast real
  estate newsletter"). To rename one, change it there; the pages read the value.
- The phone menu is a fixed panel inside the header, so the header must not carry a
  `backdrop-filter` while the menu is open (a backdrop filter would make the header the panel's
  containing block and collapse it to the header's height). `SiteHeader` swaps to a solid navy
  while `open` for that reason.
- Nothing hand-typed reaches the page: no market figures, no ticker, no stat band, no sample
  listings. The sample listings stay in the seed for previews and return with
  `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true` or an MLS feed. `/listings` is a "Find your home" page: a
  lead form prefilled from the home-page search, plus a link to the team's live listings when
  `NEXT_PUBLIC_LISTINGS_URL` is set.
- Voice: written to the reader, guide not hero. A mother and daughter team. No slogans, no numbers
  without a source.
- Testimonials are empty in the seed. Reviews go live only through the Sanity `testimonial`
  document, with `permissionOnFile` checked.

## Movement between pages

The site moves on the View Transitions API, through React's `ViewTransition` and Next's
`experimental.viewTransition` flag (`next.config.ts`). The pieces, all in the brand easing and all
off for anyone who asked for reduced motion (`lib/use-reduced-motion.ts`):

- **The page body.** `components/page-transition.tsx` wraps the page in one boundary keyed by the
  pathname, so a route change is the old page leaving and the new one arriving: a 240 ms cross-fade
  (`app/globals.css`, "View transitions"). State changes inside a page (Encore's filters, the map)
  are updates to the same boundary and run no transition. Browser back and forward run outside a
  React transition and stay instant.
- **The nav rule.** The Sky rule under the current page carries one name (`nav-underline`) and
  slides between items (320 ms). A hover rule draws in under the others at half strength.
- **Card to hero.** `components/shared-link.tsx` and `components/shared-frame.tsx`: a card's
  picture grows into the hero of the page it opens (Encore tiles and event cards to the event hero,
  venue cards to the venue hero, the home page's place cards to the hub heroes). Only the clicked
  card is named, through a small store the link writes on click (`lib/shared-element.ts`), since a
  calendar can show one event twice and two boxes with one name cancel the browser's transition.
  The link prefetches on hover, focus and touch so the page is ready when the change happens; a
  loading state has no hero to pair with.
- **The header.** Past the first screen it tucks away on a scroll down and returns on the first
  scroll up, a route change, keyboard focus, or while the phone menu is open
  (`components/site-header.tsx`).
- **Waiting.** The route loading bar (`app/(site)/loading.tsx`) and the veil a clicked link shows
  (`components/link-pending.tsx`, Next's `useLinkStatus`) both wait 150 ms, so a prefetched route
  never flashes them.
- During a route change React waits up to 500 ms (its own cap) for the new page's in-view images
  and fonts, so a page never fades in with holes. Initial loads are untouched.

## The neighborhood explorer

`/neighborhoods` is a map product built on the neighborhood dataset in `neighborhood-data/`
(2,088 areas, communities and enclaves, every fact from a county, district, association or
builder source with its checked date).

- **Map stack.** MapLibre GL JS renders a style written in the brand (`lib/neighborhoods/map-style.ts`:
  linen land, harbor water, hairline roads). Tiles come from MapTiler when `NEXT_PUBLIC_MAPTILER_KEY`
  is set (100k map loads a month free, then paid, with an SLA; register the domain as an allowed
  origin in MapTiler) and from OpenFreeMap otherwise (free, no key). Both serve the OpenMapTiles
  schema, so the style is the same. MapLibre's worker is copied to `public/vendor/` by
  `scripts/copy-maplibre-worker.mjs` before every dev and build (the copy is git-ignored).
- **Data to the browser.** Only the trimmed search index (`/api/neighborhoods/index`, about 90KB
  gzipped, built at deploy time and cached hard) reaches the client. The full 8MB dataset is read
  server-side by `lib/neighborhoods/data.ts` for the detail pages, the sitemap and the share images.
- **URL state.** Every view is a link: `q`, `market`, `level`, `type`, `status`, `gated=1`, `all=1`
  (include county-registry names), `place=<slug>` and `map=zoom/lat/lng`. The Share button uses
  the phone's share sheet or copies the link.
- **Detail pages.** Every record has `/neighborhoods/[slug]`, statically generated. The eight
  editorial neighborhoods keep their hero, overview, highlights and FAQs and gain the dataset
  facts underneath, joined by slug (`lake-club` became `the-lake-club`; the old path redirects).
  County-registry names (`research: "registry-only"`) render with `noindex` and stay out of the
  sitemap until they are researched.
- **Share images.** `opengraph-image.tsx` beside the explorer and the detail pages draws every
  point in the catalog as a constellation on linen with the chosen place in amber. No tiles, no key.
- **Display rules (brokerage fair-housing compliance, non-negotiable).** Places, never people: no
  demographic, income, crime or safety layers; no rankings or scores; school names exactly as
  stored with the district locator link and the zoning note, never on `area` records; nothing
  age-related; no prices or statistics from the dataset; `notes` is never rendered. Run
  `checkFairHousing` over new copy. The dataset's own rules are in `neighborhood-data/docs/RESEARCH-RULES.md`.
- **Keeping it current.** `npm run nbhd:validate` (must exit 0) and `npm run nbhd:index` after any
  edit; the monthly and quarterly refresh scripts are in `neighborhood-data/docs/REFRESH-RUNBOOK.md`.
  Boundaries are not drawn: the dataset has points only. If polygons are wanted, source them from the
  county layers listed in `neighborhood-data/docs/DATA-SOURCES.md` rather than drawing them.

## The Encore Arts Calendar

`/calendar` is a calendar product built on the events dataset the client supplied
(`lib/content/encore/`), the way `/neighborhoods` is built on the neighborhood dataset.

- **The page.** `components/encore/encore.tsx` holds one state (view, day, category, market,
  venue, search) that the URL, the day strip and the body reflect. Views: Days (agenda with sticky
  day headers), Week (seven columns on desktop), Month (grid plus the chosen day's agenda) and
  On view (exhibitions, closing soonest first, then opening later). On today, the Days view opens
  with Tonight and This weekend rails. Categories are the dataset's eight (music, theater,
  galleries, talks, film, festivals, family, markets), each with a muted accent from
  `lib/encore/categories.ts`.
- **Data to the browser.** The server renders the first view from a slice of the index
  (`sliceIndex` in `lib/encore/data.ts`) so the page is complete for crawlers and without
  JavaScript; the client then fetches `/api/encore/index` once (about 90KB gzipped, regenerated
  hourly) and every move after that is instant. Local days and times are precomputed in the site
  timezone, so the client does no timezone math (`lib/encore/select.ts`).
- **URL state.** `view`, `date` (YYYY-MM-DD), `category`, `market`, `venue`, `q`, and `list`
  (comma-separated slugs of a shared list). `lib/encore/url.ts` parses and prints it.
- **My list.** Save keeps slugs in `localStorage` (`encore:list`); "Share my list" turns it into a
  `?list=` link, and a visitor who opens one can save it all to their own list.
- **Feeds.** `/api/calendar.ics` with no parameters is a rolling **90-day** window (every dated
  performance in the next 90 days, plus the exhibitions on view now or opening inside the window),
  because calendar apps refetch it every few hours and the six-month file was over a megabyte.
  `?all=1` is the full feed (six months of performances plus every current and upcoming run).
  `category`, `market` and `venue` give a six-month subscription of just that filter,
  `event=<slug>` one production, and `event=<slug>&at=<iso>` a single performance (the "+ Cal"
  links on event pages). The "Subscribe" links on `/calendar` point at the 90-day feed; a
  subscriber's calendar rolls forward on every refresh, so nothing has to change on their side.
- **Plan a visit.** `/calendar/plan` is for someone coming to look at homes: arrival and
  departure (up to 14 days, the coming weekend by default), the markets to see, optional
  category preferences and an evenings-only toggle, all in the URL (`from`, `to`, `market`,
  `cat`, `evenings`) so a plan is shareable. `lib/encore/plan.ts` builds it: each day gets a
  market or two by rotating through the chosen ones and a "Showings with us (10 to 4)" block,
  then up to three timed performances from five o'clock (and one weekend matinee), scored to
  prefer the chosen categories and the day's market and to spread categories and venues across
  the stay; no production is picked twice. The server paints the first plan from a slice of
  the index and the client refetches the full index for new dates. "Add this plan to my
  calendar" is `/api/calendar/plan.ics` (showing blocks ten to four plus the picks, passed as
  `pick=slug:start` so the file matches the screen); the ICS pieces shared with the feed live in
  `lib/ics.ts`. The ask at the end is the buy form with the dates and places in the message.

`lib/content/encore.ts` turns the dataset's productions and venues into the site's `Event` and
`Venue` shapes:

- A production with dated performances becomes one event whose `performances[]` carries every
  date and time (wall-clock America/New_York converted to UTC). `startsAt` is the next
  performance. The list and month views expand these to one row per date with `getOccurrences()`.
- A run with no published times (an exhibition) is an all-day event from its first day through
  `runsThrough`; the list view shows these in the "On view now" strip via `getOnView()`.
- Items marked `announced` and the three whose venue is still to be confirmed are left off.
  Sold-out productions show "Sold out" and their offers carry `SoldOut` in the Event JSON-LD.
- **Guide covers.** Each guide's cover is a free Adobe Stock photo licensed through the Adobe
  connector on October 3, 2026, 2400px wide so it stays sharp full-bleed, none flagged
  AI-generated and none with an identifiable person. They're in `public/images/guides/<slug>.jpg`.
  Adobe Stock IDs: barrier-island 297480009, cdd-fees 713644680, condo-hoa 637443918,
  flood-zones 289523694, getting-here 576081666, wind-and-flood insurance 199682484, homestead
  120382429, hurricane-season 194827807, inspections 698842009, selling-a-home-you-dont-live-in
  1587155923, spring-start-in-october 529733750, gated-community 532484718. Only the
  getting-here (Sarasota) and barrier-island (Anna Maria) photos are of a named place, and only
  because Adobe's own titles say so; the alt text names none.
- **Tide covers.** Each Tide issue page (`/tide/<issue>`) opens on one of three free Adobe Stock
  photos licensed through the Adobe connector on October 3, 2026, 2400px wide, none flagged
  AI-generated and none with an identifiable person, in `public/images/tide/tide-{1,2,3}.jpg`.
  Adobe Stock IDs: tide-1 (a bayfront marina and towers at dusk, titled "Downtown Sarasota with
  Boats") 456377261, tide-2 (a Gulf inlet between two jetties, titled as Nokomis) 1082458028,
  tide-3 (red mangroves on a tidal flat) 1660124415. The issue month picks one
  (`lib/tide/cover.ts`): January, April, July and October take tide-1, and so on. The alt text
  names no place.
- **Stock photos, then key art.** An event without the presenter's own image (see "Images"
  below) gets a stand-in photograph for its kind of event: 51 free Adobe Stock photos, three
  each for 17 themes (exhibition, concert, chamber, orchestra, choral, jazz, theater, musical,
  ballet, comedy, talk, film, festival, art walk, family, gala, market), licensed through the
  Adobe connector on October 3, 2026, none flagged AI-generated. They're in
  `public/images/encore-stock/`, listed with their Adobe Stock IDs and alt text in
  `lib/content/encore/stock-photos.json`. `lib/encore/stock.ts` maps the subcategory, then the
  category, to a theme and picks one of its three by the event slug, so neighbouring cards
  differ. They show no faces, logos, readable signs or recognisable local venues, and the event
  page captions them "Stock photo · Adobe Stock" so nobody takes one for the production. The
  share image uses the same photo. Only if no theme fits does `components/key-art.tsx` fall back
  to the art drawn in code by `lib/encore/key-art.ts` (one motif per category, varied by slug).
- The ICS feed emits one VEVENT per performance: the next 90 days by default, six months with
  `?all=1` or any filter, plus the current runs.

When Sanity is live the same shape lives in the `event` document (performances, presenter, room,
firstDate, runsThrough, status) and `scripts/seed-sanity.ts` imports the dataset once.

### Keeping Encore current

The calendar lives in Supabase Postgres (`encore_*` tables, migration `0012_encore.sql`) and
refreshes itself from the venues' and presenters' own sites. The JSON file is the seed and the
fallback: `lib/encore/live.ts` reads the tables (five minutes in memory, then the pages' hourly
ISR) and uses the JSON whenever the database is missing, down, slow (8 s) or empty, so a build
never needs it.

- **Tables.** `encore_venues`, `encore_events`, `encore_performances` (one row per date and time,
  with `status` scheduled / cancelled / postponed / removed, `availability` on-sale / few-left /
  sold-out / not-on-sale / unknown, price range, `checked_at`), `encore_sources` (one row per
  feed: adapter, `config` overrides, frequency, `last_ok_at`, `last_error`, counts),
  `encore_checks` (every status/price reading), `encore_review_queue`, `encore_images`,
  `encore_runs`. RLS on, no policies: only DATABASE_URL reads them.
- **Sources and adapters** (`lib/encore/collect/`). `sources.ts` lists all 83 domains from the
  source audit, each with its adapter. Generic: The Events Calendar REST (`tribe`), iCal
  (`ical`), schema.org Event JSON-LD and plain event pages (`jsonld` / `pages`, with per-site
  readers in `adapters/sites.ts`), Squarespace JSON (`squarespace`). Platforms: Tessitura TNEW's
  own JSON (`tnew`: Orchestra, Ringling, Asolo Rep, Opera, Ballet), OvationTix
  (`ovationtix`: Artist Series, SCD, Urbanite, SCA, Via Nova), TicketSpice (`ticketspice`).
  Per site: Van Wezel, SILL, MPAC. Sources the audit found closed to automation (captchas,
  Cloudflare and Akamai challenges, prose-only gallery pages) are listed as `manual` and never
  fetched. A row's `config` in `encore_sources` is merged over the code's, so a moved URL can be
  fixed with one UPDATE and no deploy; `enabled = false` pauses a source.
- **Manners.** One request at a time per host, 1.2 to 2 seconds apart (Van Wezel's paging five
  seconds apart), real browser headers, 20-second timeouts, one retry, robots.txt honoured for
  `User-agent: *` (and FST's ticketing host and WBTT's Salesforce site never fetched). A source
  whose content hash hasn't changed since its last good run is marked checked and skipped.
- **What applies on its own and what waits** (`reconcile.ts`). Known events update
  themselves: a date added or dropped, a time moved, status (on sale, few left, sold out,
  cancelled, postponed), price, ticket link, a run's closing day, the image. Matching is by a
  link that belongs to one event only, then by title, dates and venue together. Dates are only
  added from structured sources (feeds, APIs, listings with times); a date is dropped only when
  the source lists every date and more than half of them haven't vanished at once (that goes to
  review). Dates read off a page's prose never add or move anything. Everything new goes to
  `encore_review_queue`, because a new listing needs a description written fresh (never copied)
  and a check of its category and venue.
- **Schedule** (`vercel.json`). `/api/encore/collect` early Sunday (05:17 UTC), the weekly
  refresh of every due source and then the images; `/api/encore/check` daily (07:41 UTC), the
  sources with performances in the next 21 days, read again for status and price only. Each
  route stops starting work about a minute before its 300-second limit, reports `remaining`
  and `remainingImages`, and calls itself again (up to eight times) until both are 0; a daily
  check with time to spare finishes whatever the weekly run left due. Both accept
  `Authorization: Bearer $CRON_SECRET` or `$ENCORE_COLLECT_SECRET`; `?only=<id>,<id>` runs
  named sources whether due or not.
- **Health.** `GET /api/encore/status` (same secret) returns every source with its last good
  run, last error and counts, the review queue by kind, the last runs, and counts of events,
  dates in the next 21 days and how many were checked, images. `?queue=1` adds the pending
  items. `npx tsx --conditions=react-server scripts/encore-collect.ts status` prints the same
  from a terminal that can reach the database.
- **Seeding.** `scripts/encore-collect.ts seed` (over DATABASE_URL) or `POST /api/encore/seed`
  (same secret, for when only Vercel reaches the database) loads the JSON. It only adds what is
  missing, so it is safe to run again.
- **Local runs.** `scripts/encore-collect.ts collect --file /tmp/encore.json --images
  public/encore-local` keeps everything in a JSON file and the images on disk; start the site
  with `ENCORE_SNAPSHOT_FILE=/tmp/encore.json` to see it. `scripts/encore-probe.ts` runs adapters
  live and prints what they found against the dataset, per source; `--record <dir>` saves the
  responses (the unit tests' fixtures in `lib/encore/collect/__fixtures__` came from it).

**Event pages.** The side panel is "From the venue" (`components/encore/venue-panel.tsx`):
the next dates as the source lists them, each with its status and its price when published,
"Checked … ago" from the last reading, the price or range, the venue, and buttons to tickets
and to the presenter's own page. It stands in for an embedded venue page: it uses the site's
type, fits a phone and loads no third-party frame. A production that is called off keeps its
page (with the dates struck through) and leaves the calendar and every list.

**Images.** Each event's picture is the presenter's own promotional image for that event (the
og:image or JSON-LD image of its page, or the listing's card art), used to promote their own
event, credited under it ("Image: <presenter>", linked to the page it came from). The collector
resizes it to at most 1600px wide as WebP and stores it in the public `encore-images` bucket
(`encore_images` keeps the source URL, the page, the credit and the size). Logos, icons and
anything under 400px wide are refused (a listing thumbnail that small is retried with the
image on the event's own page), and the stock photo stays the fallback. Every collect run also
looks on the event's own page for current events no source has offered an image for. To take one down on
request: `update encore_images set hidden = true where event_slug = '<slug>';` (the collector
never touches `hidden`, so it stays down), then call `/api/encore/collect?only=<source id>` or
wait for the hourly ISR.

### Reviewing the queue

1. Read the pending items: `GET /api/encore/status?queue=1` or
   `scripts/encore-collect.ts review`. Each has its source, the page, the first date, what the
   source said (`payload`: title, dates, price, image, the source's own wording for reference
   only) and a proposal (`proposed`: slug, venue, market, presenter).
2. **New event, worth listing:** add it with a description written fresh in the site's voice
   (one factual sentence, never the source's words), the right `category`/`site_category`/
   `subcategory`, the venue (`venue_key`, adding an `encore_venues` row if it's a new place),
   `origin = 'review'`, `source_id`, the page in `sources`, then its dates in
   `encore_performances`. Mark the item `status = 'approved'`, `event_slug = '<slug>'`. The next
   run keeps it current like any other event.
3. **Not for the calendar** (a class, a fitness session, a rental under a company's name, a
   duplicate): `update encore_review_queue set status = 'rejected', reviewed_at = now(),
   reviewed_by = '<name>' where id = …;`. A rejected or approved item never comes back.
4. **Already listed under another slug:** `status = 'merged'`, `event_slug = '<that slug>'`,
   and add the item's page to that event's `sources` so the next run matches it by link.
5. **change / removed:** the collector wouldn't make the change on its own (most of a run's
   dates gone, a run's dates read off prose, a production no longer on its ticketing
   platform). Check the source, make the change in `encore_events`/`encore_performances` (or
   hide the event: `hidden = true`) and approve or reject the item.

Claude can do all of this with the Supabase connector (only INSERT/UPDATE; deletes belong in
app code) given this section.

### When an adapter breaks

`/api/encore/status` shows it: `lastError`, `failures`, or a source whose `eventsFound` fell to
nothing. Then:

1. Run it alone against the live site:
   `npx tsx scripts/encore-probe.ts <source id> --record /tmp/rec --json /tmp/out.json` (or
   `/api/encore/collect?only=<source id>` on Vercel) and read the error and the saved response.
2. A moved page or a new listing URL is configuration: `update encore_sources set config =
   config || '{"listings": ["https://…"]}' where id = '<source id>';` (merged over `sources.ts`).
   Put the same fix in `sources.ts` when convenient.
3. A changed page layout is code: fix the reader in `lib/encore/collect/adapters/`, save a new
   trimmed fixture under `__fixtures__/`, update its test in `collect.test.ts`, and run
   `npm run -s test:unit`.
4. A site that now blocks automated reading (a captcha or a JS challenge): set its `adapter`
   to `manual` in `sources.ts` and keep its events by hand through the review steps above.
   Never route around a block or a robots.txt rule.

## The data portraits

The three products each draw their own picture from their own data, on the server, as inline SVG
(`components/art/*`, geometry in `lib/art/*`). Nothing is typed by hand and nothing is a file, so
the pictures are never grainy and never out of date; the raw data stays on the server.

- **Tide** is a ridgeline of the market's sale prices: one ridge per month, the oldest at the back
  and the newest at the front, each the smoothed distribution of that month's qualified home sale
  prices in the three markets (a Gaussian kernel density over log price, `lib/art/tide.ts`). The
  months are the ones ending with the latest month complete in all three markets, the same month
  the Tide issue reports on (`lib/art/load.ts`). It is the masthead on `/blog` and `/tide`, composed
  once at 3:1 and once at 4:3, and the card head on the home page. An issue page opens with a cover
  photograph instead (below).
- **Atlas** is every place in the index as a point of light (`lib/art/atlas.ts`): areas the bright
  stars, communities the field, enclaves faint; each market in its own light; threads between the
  areas and from each community to its nearest neighbour.
- **Encore** is a season clock (`lib/art/encore.ts`): the next 365 days as a ring, today at the top,
  every performance a stroke at its day in its category's light, stacked outward on busy days;
  exhibitions as arcs inside the ring. The category lights are the `art` colours in
  `lib/encore/categories.ts`, separate from the chip colours.

All three share the deep ground and the luminous set in `lib/art/palette.ts`. The masthead version
drifts slowly and its horizon breathes; both stop under `prefers-reduced-motion` and neither moves
layout. A masthead slot in `lib/content/mastheads.ts` is either a photograph (at least 2000px
wide, held to it by `lib/content/mastheads.test.ts`) or an art piece.

## Site search

`/search` searches the site's own content: every guide section, every researched Atlas place
(plus the editorial neighborhood pages), the Tide posts and issues, the Encore events and venues,
the market hubs, the relocation page's sections and a hand-written summary of each main page.
Everything runs in Supabase: Postgres full-text search, pgvector, and the `gte-small` embedding
model (384 dimensions) built into Supabase Edge Functions. No other vendor.

**How a query is answered** (`lib/search/search.ts`):

1. A cached answer for the same words from the last five minutes (per server instance).
2. The query is embedded by the `embed` Edge Function (`supabase/functions/embed`, called with
   the anon key, 4s timeout), then `search_scored()` (migration `0011_search_score_fusion.sql`)
   runs in Postgres over `DATABASE_URL`. It takes the 40 nearest chunks by cosine (HNSW, with
   `hnsw.ef_search` raised to 200 for the call) and the 40 best full-text matches
   (`websearch_to_tsquery`, `english`; plain questions match on any word, a query with quotes or
   a minus sign keeps its strict web-search meaning), and scores every candidate on both
   signals, each on a fixed 0–1 scale:
   - **semantic** = (cosine − 0.82) / (0.92 − 0.82), clamped. On the live index gte-small puts
     gibberish at 0.79–0.82 and strong matches at 0.90–0.94, so 0.82 is the noise floor and
     0.92 a strong match.
   - **keyword** = √(share of the query's words the chunk contains, each word weighted by its
     IDF in the index). 1 when every word is there, whatever the chunk's length; low when it
     only shares a common word ("price", "fix"). Words the index has never seen count against
     the match, so nonsense stays near 0.
   - **score** = 0.8 × semantic + 0.2 × keyword, plus 0.15 when the title is exactly the query
     (a place or venue typed by name).

   A row is shown only if its score is at least 0.2. In words: a chunk with no word in common
   needs cosine ≥ 0.845, a chunk with no semantic signal needs every word of the query, and
   anything between needs some of both. When nothing reaches 0.2, the search returns nothing.
   The settings are `SCORING` in `lib/search/query.ts` (passed on every call; the function's
   defaults match). The excerpt is `ts_headline` with the matched words wrapped in
   U+E000/U+E001, which the page turns into `<mark>`; no HTML ever travels in a result. At most
   three sections of one page are shown. If the query can't be embedded, the same function runs
   on keywords alone (semantic = 0, so only chunks with every word pass).
3. If there's no `DATABASE_URL`, the database errors, the index has nothing yet, or a
   keyword-only search found nothing, the page answers from an in-memory BM25 keyword search
   over the same chunks (`lib/search/fallback.ts`). An embedded query that nothing reaches the
   threshold for is answered with no results, not sent to the fallback. The page never breaks.

**Why not reciprocal rank fusion.** The first version (`search_hybrid()`, 0010) fused the two
lists with RRF, the pattern in Supabase's hybrid search guide. RRF looks only at each list's
order: the nearest neighbour gets the same boost whether its cosine is 0.95 or 0.80, a chunk that
matches one common word ranks like one that matches all of them, and the fused number has no
meaning of its own, so it can't be thresholded. Gibberish ("xyzzy blorp") came back as theater
listings until a rule was bolted on outside the fusion. Fusing the scores themselves keeps
"how good is this match" in the number, which is what a threshold needs.

**The eval** (`lib/search/eval/queries.json`, `scripts/search-eval.ts`): 50 queries a buyer,
seller or relocator would type (14 keyword, 11 place or venue names, 5 typos, 13 paraphrased
questions with little or no keyword overlap, 7 gibberish or off-topic queries that should return
nothing), each labelled with the chunk ids that answer it, written from the index's contents
before either method was run. Every third query was held out from tuning. Measured on the live
index, October 2026 (hit@k and MRR over the 43 real queries, top ten after the per-page cap):

| | hit@1 | hit@3 | MRR | real queries with no results | noise with results |
| --- | --- | --- | --- | --- | --- |
| RRF (`search_hybrid` + the noise rule), all | 0.651 | 0.814 | 0.755 | 1 of 43 | 4 of 7 |
| Score fusion (`search_scored`), all | **0.837** | **0.860** | **0.851** | 3 of 43 | **0 of 7** |
| RRF, held-out third (14 + 2 noise) | 0.643 | 0.929 | 0.780 | 0 | 1 of 2 |
| Score fusion, held-out third | 0.857 | 0.857 | 0.857 | 1 | 0 of 2 |

By type (MRR, RRF → scored): keyword 0.96 → 1.00, places 0.87 → 1.00, paraphrases 0.53 → 0.74,
typos 0.51 → 0.40. Typos are the one loss: "siesta kee" and "flod zone" have one real word, a
made-up one and a weak cosine, so they fall under the threshold, where RRF showed them at ranks
5 and 3. "hommestead portabilty" fails both ways (gte-small doesn't see through it). Raising
`hnsw.ef_search` alone doesn't move RRF's numbers (identical at 200); the gain is the fusion.
Keyword-only mode (no embedding) is much weaker (MRR 0.36, every word required) and leans on the
in-memory fallback, as before.

How much of this is fitted: the weights and threshold were picked by grid search on the tuning
two-thirds (29 real + 5 noise queries). Most settings near the chosen one score within 0.01 MRR
of it, so the exact numbers aren't what's doing the work; the threshold is the fragile part.
On the tuning split the highest-scoring noise query reached 0.149 and the weakest right answer
0.174; 0.2 was chosen for margin over the noise, and it costs one held-out query ("flod zone",
0.194). 50 queries is a small set: treat ±0.05 on these numbers as noise.

`GET /api/search?q=` returns the same JSON (`q`, `source`: hybrid or keyword, `results`), 2–200
characters, 30 a minute per IP per instance (429 past it), `s-maxage=300`. `/search` itself has
its own limit of 60 a minute per IP; past it the page answers from the in-memory index. Result
pages (`?q=`) are `noindex, follow`; `/search` alone is in the sitemap. The header's search
button and ⌘K / Ctrl+K open it with the cursor in the box. The Plausible `Search` goal carries
only a bucket of the result count.

**The index** (`search_documents`, migration `0010_search.sql`): one row per chunk, id readable
and stable (`guide:<slug>#<section>`, `place:<slug>`, `post:<slug>`, `tide:<issue>#what`,
`event:<slug>`, `venue:<slug>`, `page:<path>#<part>`; later parts of a long chunk end `~2`,
`~3`), the url with the section's anchor, the body, a `content_hash`, the `embedding` and a
generated `fts` (title A, section B, body C). RLS on with no policies and execute on
`search_scored` (and the retired `search_hybrid`) revoked from `anon` and `authenticated`: only
the server reads it. Chunks are
150–300 words where the content allows (a place or an event is shorter), and each is embedded
with its title and section in front. Zoned schools, research notes and anything age-related are
left out of the index; county-registry places aren't indexed (their pages are noindex). The page
summaries live in `lib/search/copy.ts` and are checked by `check:copy`; when a main page changes,
change its summary there.

**Reindexing** (`lib/search/indexer.ts`): load every chunk, compare by id and content hash,
delete rows whose ids are gone, embed only new or changed chunks (the Edge Function stops at
its CPU budget and returns `complete: false`; the client sends the rest, four calls at a time,
with retries), and upsert each group of 48 as it finishes, so a run cut short keeps its work. If
a content source fails to load, or the run has under half the stored rows, deletes are held
back (`?force=1` lets the second case through).

- Daily: Vercel Cron calls `GET /api/search/reindex` at 08:23 UTC with `CRON_SECRET`.
- By hand: `curl -X POST -H "Authorization: Bearer $SEARCH_REINDEX_SECRET" https://<site>/api/search/reindex`.
  A run stops starting new work a minute before its 300s limit and reports `remaining`; repeat
  until it's 0. The first full index (about 1,700 chunks) should take one or two calls.
- From a machine that can reach Postgres: `npm run search:index` (no deadline; reads
  `.env.local`). `npm run search:index -- --dry-run` lists the chunks without touching anything.
- After a deploy that changes content, the next daily run picks it up; call the route to do it
  sooner. Neither the build nor the pages depend on the database.

**Environment:** `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(already set for the site), plus `SEARCH_REINDEX_SECRET` and/or `CRON_SECRET` for the reindex
route. `SEARCH_EMBED_URL` overrides the function's address (defaults to
`<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/embed`).

**The Edge Function** `embed`: `POST {texts: string[]}` (1–64 texts, 2,000 characters each,
otherwise 400) → `{model, dims, complete, embeddings}`, `gte-small` with mean pooling and
normalisation. `verify_jwt` is on; it has no database access. The file in
`supabase/functions/embed/index.ts` is the deployed source: redeploy with
`supabase functions deploy embed` after a change. It's excluded from `tsc` (it's Deno).

**Tuning:** `SCORING` in `lib/search/query.ts` holds the match count, the semantic weight, the
cosine floor and ceiling, the title boost, the threshold and the candidate count. `search_scored`
also returns each row's `cosine` and `keyword` score, so a query can be inspected in the SQL
editor: `select id, score, cosine, keyword from search_scored('flood insurance', '<vector>'::extensions.vector);`
(pass `min_score => 0` to see what the threshold drops). To re-tune:

1. Add or fix queries in `lib/search/eval/queries.json` from what the index holds
   (`select id, kind, title, section_title from search_documents`), never from what a method
   returned. Keep some gibberish and off-topic queries.
2. `npm run search:eval` (needs `DATABASE_URL` reachable, plus the Supabase URL and anon key)
   prints hit@1, hit@3, MRR, real queries with no answer and the noise false-positive rate for
   the tuning and held-out splits. `--verbose` lists each query's top three; `--set
   minScore=0.18` tries a setting; `--grid` sweeps weight × floor × threshold and lists the best
   settings with no noise results.
3. Choose from the tuning split, from a plateau rather than a peak, then read the holdout once.
   Watch the cosine floor if the model or the content changes: re-measure where gibberish lands
   (`select max(1 - (embedding <=> '<vector>')) from search_documents` for a few nonsense
   queries).
4. Change `SCORING`, and the function's defaults in a new migration, together.

The eval was first run through the Supabase connector with its queries and embeddings in a
scratch schema, `search_eval` (not used by the site; RLS on, nothing granted to the API roles).
It can be dropped. `search_hybrid` is no longer called; `0011_search_score_fusion.sql` carries a
commented `DROP` for it, to run once the new function has been live for a while.

## Search and answer engines

- FAQPage structured data on the home page (five questions), the buy page, the sell page and every
  neighborhood page (three questions each, in `lib/content/seed/neighborhoods.ts` and the Sanity
  `faqs` field). Every FAQ carries a plain-text `answer` beside its JSX `a`; keep both in step.
- Open Graph images are generated per page (`opengraph-image.tsx` beside home, buy, sell, about,
  listings, events and neighborhoods) from the page's photograph and the brand lockup.
- Three evergreen guides ship in the seed (gated communities, inspections, selling from away). They
  carry no figures. The sample market reports stay behind `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS`.
- RealEstateAgent and Person on every page, Article on reports and guides, Event and Place on the
  calendar, BreadcrumbList on detail pages. No license numbers anywhere, at the client's direction.
- Team photographs were upscaled 2x with a light denoise and sharpen; the originals are 1100px on
  the long edge. Replace them with the photographer's full-resolution files when available.

## Content: seed now, Sanity when ready

`lib/content/index.ts` picks the source at request time:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` empty → `lib/content/seed-source.ts` (sample data, relative event dates).
- Set → `lib/content/sanity-source.ts` (GROQ through the CDN client, tagged for on-demand ISR).

Both return the same TypeScript shapes, so no page changes when the switch is flipped.

To bring Sanity online:

1. Create the project and dataset; put the ids in `.env` (see `.env.example`).
2. `npx sanity exec scripts/seed-sanity.ts --with-user-token` — pushes the sample content and photographs.
3. Add a GROQ-powered webhook in Sanity Manage → `POST https://<site>/api/revalidate`, secret =
   `SANITY_REVALIDATE_SECRET`, projection `{ _type, "slug": slug.current }`.
4. Open `/studio`. The Presentation tool previews the live site with click-to-edit
   (`/api/draft-mode/enable`). `SANITY_VIEWER_TOKEN` (read-only) is enough for previews.
5. `npm run sanity:typegen` to generate typed query results once a project exists.

Tier notes, cost levers and the archive requirement are in `docs/handoff/integrations/sanity.md`.

## Leads: one action, one pipeline

Every form (`components/lead-form.tsx`, `components/letter-form.tsx`) posts to
`actions/submit-lead.ts`, which validates and hands off to `lib/lead-pipeline.ts`:

1. **Postgres first** (`leads` + `lead_deliveries`, plus `contacts`/`events` for the consent record), when
   `DATABASE_URL` is set. The lead row exists before anything external is tried.
2. **CRM** through `lib/crm.ts`. `CRM_PROVIDER=webhook` (the default when `CRM_WEBHOOK_URL` is
   set) POSTs the payload to a Zapier Catch Hook, which runs Compass "Create a New Lead" into the
   Home Platform; 8s timeout, one retry, any 2xx is success. `fub` keeps the old Follow Up Boss
   client (`lib/fub.ts`); `none` means no CRM. The result lands in `leads.delivery_status`.
3. **Team email** with the full payload to `TEAM_NOTIFY_EMAIL` (Resend), reply-to the visitor.
4. **Alert** to `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`) when the CRM step failed.
5. **Server-side Plausible** `Lead server` event (`form`, `channel: server`), with the visitor's
   User-Agent and IP forwarded, as a backstop for visitors whose ad blocker stops the script.

Then a `LeadForm` sends the visitor to `/thanks/<form>` (what happens next, both direct numbers,
"Book 15 minutes" when `NEXT_PUBLIC_BOOKING_URL` is set, one next step; `noindex`; fires the `Lead`
goal). The `LetterForm` bars stay inline: the success line shows where the bar was and `Subscribe`
fires there. With JavaScript off the inline success state shows for every form. The visitor sees an error only
when nothing kept the lead; in production a deployment with no sink at all logs an error at boot
(`instrumentation.ts`) and `GET /api/health` reports `ok: false`.

**The site never emails a visitor.** No confirmation, no welcome series. Replies come from the
agents' own Coldwell Banker mailboxes (a Zapier step if they want a template).

Consent: every form with an email field shows an unchecked **email** box; forms with a phone also
show the unchecked **calls/texts** box (`CONSENT_EMAIL_WORDING`, `CONSENT_WORDING` in
`lib/leads.ts`). Neither is required. State, timestamp and `CONSENT_WORDING_VERSION` are stored on
the lead and travel as `consent:email` / `consent:sms` tags. The Tide and Encore boxes imply email
consent and record `IMPLIED_CONSENT_VERSION` (`implied:subscribe`) instead, since the visitor saw
the band copy, not a checkbox. The payload field map for Zapier is in `docs/INTEGRATIONS.md`.

## Growth pages: channels, referrals and reviews

- **Channel landings** `/from/youtube`, `/from/instagram`, `/from/facebook`, `/from/nextdoor`: the
  links for bios and posts. One component (`components/growth/channel-landing.tsx`) and one copy file
  (`lib/channels/copy.ts`): a line in the team's voice, one primary action (the relocation planner
  for YouTube and Instagram, What sold on your street for Facebook and Nextdoor), then Atlas match,
  the Encore visit planner and the Tide bar. `noindex, nofollow` and left out of the sitemap. The
  visit's channel is kept for the session and every form sends it as `source`, so the lead is tagged
  `source:<channel>`; a first visit with no `utm_*` also gets `utm_source=<channel>`,
  `utm_medium=social` in the first-touch record (`docs/MEASUREMENT.md` §4).
- **`/refer`**: "Know someone moving here?" The `referral` form is two labelled groups: "About you"
  (the referrer's first name, last name, email and phone) and "About them" (the person moving: first
  name, last name, email and/or phone, what they're planning, a note), plus a required box: "They know
  I'm passing their details along and expect to hear from Joelyn and Jessica." The referred person
  travels under `referral` in the payload with a CRM note naming the referrer (`lib/crm.ts`,
  `docs/INTEGRATIONS.md`). The copy says we write back to the referrer first and reach out to the
  person at their pace. No gifts or rewards are mentioned (anything like that is cleared with the
  brokerage first). Tags `form:referral`; a `General Inquiry` like `contact`.
- **`/reviews`**: the Google review link from `NEXT_PUBLIC_GOOGLE_REVIEW_URL` (an `https` URL; when
  it's empty the page says the link is coming soon), and the `review-permission` form: name, email,
  the words, and a required box ("You can use these words on the site with my first name and the
  place we bought or sold", `REVIEW_CONSENT_WORDING`, versioned `REVIEW_CONSENT_VERSION`). Stored
  like every lead, tagged `consent:review`. **Nothing from it is displayed anywhere on the site**; a
  quote goes up only when someone enters it as a Sanity `testimonial` with `permissionOnFile`.
- **Where they're linked.** `/refer` and `/reviews` sit at the end of the footer's "The team"
  column and in the sitemap; the `/from/*` pages are linked only from the profiles themselves.
- **Copy check.** Each page's strings live in a `copy.ts` (`lib/channels`, `lib/refer`,
  `lib/reviews`) and `scripts/check-copy.mjs` (prebuild) runs the Fair Housing list and the stricter
  hub rules over them alongside the hubs.
- **Social links.** `socialLinks` in `lib/site.ts` (empty until the client sends the URLs) plus any
  in the Sanity site settings feed the footer's icon row and `sameAs` on the RealEstateAgent
  JSON-LD; both render nothing while the list is empty.

## The questionnaire: private links for Joelyn, Jessica and the owner

The website questionnaire (121 questions in 10 sections, the facts the site still needs from the
team) lives on the site at three private links. Nobody needs an account.

- **Routes.** `/q/<token>` in its own route group, `app/(questionnaire)`: no site header, footer,
  analytics or lead pixels, and nothing loaded from another origin. Joelyn's token shows her own
  section plus the eight shared ones (team, promises, first questions, footer and legal, accounts
  and tools, photos, Tide and Encore, anything else) and hides Jessica's; Jessica's is the mirror.
  Each sees 107 questions, numbered 1 to 107 on their own link; the compiled view and the
  exports use the source numbering, 1 to 121. The admin token shows the compiled view: both answers to every question
  side by side (stacked on phones), each person's progress and last save, an "Answers differ"
  marker on shared questions, Print, and Download Markdown / Download CSV from
  `/q/<admin token>/export?format=md|csv` (checks the admin token, 404 for anything else). Any
  other token is a 404 that says nothing about what the link was for.
- **Kept private.** `robots: noindex, nofollow`, `X-Robots-Tag`, `Referrer-Policy: no-referrer`
  and `Cache-Control: no-store` on `/q/:path*` (`next.config.ts`), `Disallow: /q/` in
  `app/robots.ts`, and not in the sitemap. There is no proxy/middleware in front of it.
- **Code.** The questions are `lib/questionnaire/questions.ts`, copied verbatim from the
  questionnaire artifact; ids are the storage keys, so never rename one. Who sees what and the
  numbering are in `model.ts`, the Markdown and CSV in `compile.ts`, the save rules (Zod, 10,000
  characters an answer, only your own questions and the options a question offers) in
  `validate.ts`, the wording around the questions in `copy.ts` (checked by `check:copy`), and the
  pages in `components/questionnaire/*`. Tests: `lib/questionnaire/questionnaire.test.ts`.
- **Storage.** Postgres table `questionnaire_answers` (respondent, question_id, value, choice,
  updated_at; primary key respondent + question_id; RLS on, no policies), migration
  `0007_questionnaire.sql`. `lib/questionnaire/store.ts` also runs the same `CREATE TABLE IF NOT
  EXISTS` and `ENABLE ROW LEVEL SECURITY` once per server process, so the links work even if the
  migration hasn't been run. Saves go through a server action that checks the token again and
  writes only that person's rows. `updated_at` is when the answer was typed, and an older copy
  never overwrites a newer one.
- **Without a database.** Every change is written to the browser's `localStorage` straight away
  (`jj-questionnaire:v1:<joelyn|jessica>`) and sent ~900ms after typing stops; the local copy is
  cleared only once the server confirms it. With no `DATABASE_URL` the form says answers are kept on
  this device until the database is connected, and the status reads "Kept on this device". A failed
  save reads "Couldn't save, kept on this device". The next time the link is opened with a working
  database, anything kept locally that is newer than the server copy is sent and then cleared. The
  admin page says plainly when the database isn't connected; answers typed before then are only on
  the phone or computer they were typed on until that person opens their link again.
- **Tokens.** `lib/questionnaire/access.ts` holds only the SHA-256 of each token, compared in
  constant time. The raw links are kept outside the repo by whoever sends them (never in code,
  commits, docs or issues). To rotate one:
  1. `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"` for a new token.
  2. `node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" <token>`
     for its hash.
  3. Replace that role's `sha256` in `TOKEN_HASHES`, deploy, and send the new
     `https://<site>/q/<token>` link. The old link stops working on deploy; answers stay, since
     they're stored by person, not by token.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit (run `npx next typegen` first if routes changed)
npm run build
npm run sanity:typegen
```

`npm run lint` still calls `next lint`, which Next 16 removed, and the repo has no ESLint config.
That predates this build; wire up `eslint` + `eslint-config-next` directly when there is time.

Useful switches:

- `NEXT_PUBLIC_ROBOTS_NOINDEX=true` sets `noindex, nofollow` on every page and in `robots.txt`.
  Turn it on for previews and the pre-launch domain, off at launch.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` loads Plausible (outbound links and tagged events). Custom events
  go through `track()` in `lib/analytics.ts`; register each as a goal in Plausible, with the props
  as custom properties:

  | Goal | Fired from | Props |
  | --- | --- | --- |
  | `Lead` | `/thanks/<form>` after a `LeadForm` send | `form`: contact, buy, sell, valuation, listing, referral · `market` · `source` (the `/from/<channel>`, or none) |
  | `Subscribe` | the `LetterForm` bars (Tide band, blog, calendar, Encore row, `/from/*`) inline on success | `form`: letter or calendar · `source` when there is a channel |
  | `Review permission` | `/thanks/review-permission` after the `/reviews` form | `form` · `market` · `source` |
  | `Lead server` | `lib/plausible-server.ts`, from the server action, for every form | `form` · `channel`: server. A backstop for visitors whose ad blocker stops the script; never add it to `Lead` |
  | `Calendar feed` | ICS links: the calendar page feed, Encore's filtered subscribe, the event page, the visit plan | `kind`: feed, event, performance, list, plan · `filter`: `all`, the feed query, or the event slug |
  | `Phone tap` | `tel:` and `sms:` links | `where`: header, footer, action-bar, action-bar-text, contact, contact-text, thanks, thanks-text, from-<channel> |
  | `Share` | `ShareButton` | `what`: calendar-view, my-list, … |
  | `Explore` | the tools, the footer's hub links, the `/from/*` buttons | `action`: select, filter, match, calendar-day, visit-plan, relocate-plan, sold-search, home-value, net-proceeds, hub, channel-cta, channel-more |
  | `Search` | `/search`, once per query shown | `results`: 0, 1-3, 4-9 or 10+. Never the query text (people type names and addresses) |

  The full list of props, the funnel each goal answers and the exact Plausible setup are in
  `docs/MEASUREMENT.md`.

  Server-rendered `tel:`/`sms:` and ICS anchors use `components/tracked-link.tsx`, which fires the goal
  on click and leaves the navigation alone. `NEXT_PUBLIC_PLAUSIBLE_HOST` only for a self-hosted instance.
- First-touch attribution lives in `components/utm-tracker.tsx`: the landing path, external referrer,
  timestamp and any `utm_*`, `gclid` or `fbclid` are kept in `localStorage` for 90 days (no cookies),
  never overwritten while fresh, and forwarded by every form as `utm__<key>` hidden fields into
  `contacts.utm`, `leads.source` and the `source` block of the CRM webhook payload.

## Launch checklist

The operator's runbook for the cutover itself (client and brokerage checklist, Vercel variables, Zapier, Supabase, DNS, verification, first week) is `docs/LAUNCH.md`; the list below is the short form.

1. Add the custom domain to the Vercel project and set `NEXT_PUBLIC_SITE_URL` to it (with
   `https://`). Every canonical, sitemap entry, Open Graph URL and ICS UID uses this value.
2. Remove `NEXT_PUBLIC_ROBOTS_NOINDEX` (or set it empty) in the production environment and
   redeploy. Check `/robots.txt` and one page's `<meta name="robots">` afterwards.
3. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to the bare domain and confirm a pageview in the dashboard.
4. Google Business Profile: the client is creating it. The name, address and phone on the profile
   must match the footer, the contact page and the RealEstateAgent JSON-LD exactly (same
   punctuation, same suite line). Once the profile is live, add it to `socialLinks` in
   `lib/site.ts` (or the Sanity site settings) alongside the social links, which puts it in
   `sameAs`, and set `NEXT_PUBLIC_GOOGLE_REVIEW_URL` to its review link for `/reviews`.
5. Submit the sitemap in Google Search Console and Bing Webmaster Tools.
6. Confirm the custom 404 renders on the live domain (`/this-does-not-exist`).
- `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`) receives the alert when a lead cannot be
  delivered to the CRM (webhook rejected or unreachable; with `CRM_PROVIDER=fub`, also the
  archived-flow 204 case).
- `CRON_SECRET` protects `GET /api/cron/archive-events` (Bearer token), scheduled weekly in
  `vercel.json`, and the daily search reindex (`/api/search/reindex`, which also takes
  `SEARCH_REINDEX_SECRET`).

## Verification done for this build

- `npm run typecheck` (0 errors) and `npm run build` (80 static pages) pass with no env configured.
- Every route rendered in Chromium at 1440, 810 and 390: 200 status, exactly one `h1`, no
  horizontal scroll, no console errors. The one exception is the deliberate 404 test URL.
- Five independent review passes (design fidelity against the mockup, responsive layout,
  accessibility, compliance, code correctness) and all findings applied, except three deliberate
  keeps listed below.
- Fair-housing check (`lib/fair-housing.ts`) run over all copy files: nothing flagged.
- Open Graph images checked for the home page and a listing; the ICS feed checked for RFC 5545
  folding, escaping, CRLF and correct America/New_York times; listing filters fuzzed with
  `__proto__`, `constructor` and malformed values (all 200).

Deliberate keeps from the review passes:

- Both agents are titled REALTOR® (client correction; the brand system originally said Broker
  Associate). The mark is always set in capitals with the ® symbol.
- The Coldwell Banker mark sizes (185 in the nav, 220 in the footer) follow the approved mockup.
- The privacy and terms pages carry a "draft for legal review" label until counsel signs off.

## Security headers, legal pages and the error pages

- `next.config.ts` `headers()` sets `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN` (not DENY: the Studio's Presentation tool
  frames site pages from `/studio`) and a `Content-Security-Policy-Report-Only` whose hosts are
  derived from the same env vars the app reads (Plausible host, MapTiler or OpenFreeMap, the
  Sanity project). `/studio` gets a wider variant. It stays report-only until a per-request nonce
  is issued from a `proxy.ts`: Next's inline hydration scripts and the inlined Plausible queue need
  `'unsafe-inline'`, and the dev server needs `'unsafe-eval'`. Watch the browser console for
  `[Report Only]` violations after adding any third-party script.
- The privacy policy names the stack as deployed: Plausible (cookieless), Vercel, Supabase,
  Zapier to the brokerage's CRM (the Home Platform), Resend for team notifications only, MapTiler
  for tiles. Production needs `NEXT_PUBLIC_MAPTILER_KEY` set for the map paragraph to be exact;
  without it the explorer falls back to OpenFreeMap.
- `app/global-error.tsx` is the last-resort page (own `<html>`, seed phone numbers, fallback font
  stacks); `app/(site)/error.tsx` handles errors inside the site layout; both `not-found.tsx`
  files share `components/not-found-content.tsx`.

## Still open (needs the client or the brokerage)

Phase 0 blockers from `docs/handoff/BUILD-PLAN.md`:

1. Office street address and zip for the footer, JSON-LD and the privacy page.
2. Joelyn's Florida licence number (Jessica's is in; the footer hides a name until its number exists).
3. The Zapier Catch Hook URL (`CRM_WEBHOOK_URL`) and the Zap into the Home Platform. Until it is
   set, leads are mirrored to the database and emailed only, and production logs an alert.
4. The Sanity project and dataset, then the seed script and webhook in the section above.
5. Consent wording sign-off from counsel (`CONSENT_WORDING` in `lib/leads.ts`) and 10DLC
   registration before any texting starts.
6. An IDX licence from Stellar MLS before any MLS data or MLS wording goes on the site. The sample
   listings are placeholders.
7. Coldwell Banker brand asset review, and licensed webfont files for IvyPresto Headline and
   Contralto (the CSS stacks already lead with them).

Also worth knowing:

- Tide and Encore subscribers go through the same pipeline as every other lead (tagged
  `consent:email`) and are mirrored to the database. Nothing emails them from the site.
- Every statistic on the site carries its source and date in the seed content. When the numbers
  are replaced in Sanity, keep the source field filled.

## Personal data retention

`lib/db/migrations/0009_retention.sql` installs `public.retention_purge()` and a pg_cron job
(`retention-purge`, 07:17 UTC daily). Home Platform is the CRM, so the site database applies one
rule to everyone: `lead_deliveries` after 90 days; on `leads`, names, message, address, source and
payload cleared after 2 years (email, phone and the consent proof stay), rows deleted after 5;
on `contacts`, names, source and UTM cleared after 2 years without contact, rows deleted after 5
unless the person unsubscribed or asked not to be called (then email, phone and those flags stay
for good); `events` payloads cleared after 2 years and rows removed after 5, except unsubscribe
entries. Five years covers the 4-year window for TCPA claims. IP addresses are never stored.
Questionnaire answers are deleted by hand once the site copy is final. The privacy page states
the same periods; change both together. Check runs with
`select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'retention-purge') order by start_time desc limit 5;`.
