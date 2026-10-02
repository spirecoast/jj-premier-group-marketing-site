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
| Platform routes | `app/api/revalidate` (Sanity webhook), `app/api/draft-mode/*`, `app/api/calendar.ics`, `app/api/cron/archive-events`, `app/sitemap.ts`, `app/robots.ts` |
| SEO | `lib/seo.ts` (metadata + JSON-LD helpers), `components/json-ld.tsx` |
| Analytics | `components/analytics.tsx` (Plausible, env-gated), `lib/analytics.ts` (custom events), `lib/plausible-server.ts` (server-side Lead/Subscribe) |
| Encore dataset | `lib/content/encore/encore-calendar.json` (the source), `lib/content/encore.ts` (the converter) |
| Neighborhood explorer | `components/explorer/*` (map, panel, card), `components/place-map.tsx`, `lib/neighborhoods/*` (data access, search, URL state, brand map style) |
| Neighborhood dataset | `neighborhood-data/` (the catalog, its schema, scripts and docs; see its `CLAUDE-CODE-HANDOFF.md`) |

The agent portal (`app/portal`, `app/auth`, Supabase, Drizzle, Inngest, Resend) is untouched and
still works on the same theme.

## Names, places and what is deliberately not on the page

- Markets: Lakewood Ranch, Sarasota and Bradenton. Tampa was removed in September 2026 at the
  client's direction; `MarketSlug` has three values.
- Photographs: sources stay JPEG under `public/images` (2560px max on the long side); `next.config.ts`
  asks the image optimizer for AVIF first and WebP second, so browsers never receive the source
  file. Every photo goes through `components/photo.tsx`. Provenance, as of October 2026:
  six library files are Adobe Stock photos the client supplied on September 22, 2026
  (`venice-pier-sunrise`, `gulf-beach-aerial`, `modern-home-pool-dusk`, `kitchen-navy-island`,
  `kitchen-white-palms`, `lakes-aerial-sunset`); two came from the team in Slack
  (`culture-opera-house-red-seats`, `lwr-fairways-bay-aerial`); the rest of `public/images/library`
  are generated frames from the original brand handoff, 1200px or 1376px wide, which look soft
  when shown large and are being replaced with images the client approves. Nothing on the site
  was downloaded or licensed from Adobe Stock by us. The team photos in `public/images/photos` are
  the team's own. `lib/content/image-dims.ts` groups the files the same way.
- The three products are a family, named once in `lib/site.ts` (`products`, `primaryNav`):
  **Atlas** (the neighborhood explorer, `/neighborhoods`), **Encore** (the arts calendar,
  `/calendar`) and **Tide** (the newsletter and its archive, `/blog`). The desktop nav is two
  groups on one line: the plain pages as caps labels (Buy, Sell, Joelyn & Jessica), a hairline,
  then the products as the name in the display serif with its descriptor beside it on the
  baseline in small mono caps (Atlas NEIGHBORHOODS, Encore ARTS CALENDAR, Tide NEWSLETTER).
  Below 1320px (1400px on the home page, where the header is inset 56px each side to follow the
  hero) the descriptors drop and the names stand alone so the nav never wraps into the Coldwell
  Banker mark, which stays at 185px. Each product link's `aria-label` is "name,
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
- **Key art.** No stock photographs. An event without a venue-supplied `image` gets art drawn in
  code by `lib/encore/key-art.ts`: one motif per category (staff and notes, proscenium and
  spotlight, hung frames, sound waves, film strip, bunting, balloons, market awnings), varied by
  a seed from the event slug and by subcategory (jazz, choral, orchestra, circus, ballet, comedy
  and so on), in the brand palette. `components/key-art.tsx` renders it wherever a card or hero
  needs a picture, and the event share image uses the same SVG. A venue photo added in Sanity
  (`image`) overrides it automatically, so no picture on the site needs a license.
- The ICS feed emits one VEVENT per performance: the next 90 days by default, six months with
  `?all=1` or any filter, plus the current runs.

When Sanity is live the same shape lives in the `event` document (performances, presenter, room,
firstDate, runsThrough, status) and `scripts/seed-sanity.ts` imports the dataset once. To refresh
the dataset before then, replace the JSON file and rebuild.

## The data portraits

The three products each draw their own picture from their own data, on the server, as inline SVG
(`components/art/*`, geometry in `lib/art/*`). Nothing is typed by hand and nothing is a file, so
the pictures are never grainy and never out of date; the raw data stays on the server.

- **Tide** is a ridgeline of the market's sale prices: one ridge per month, the oldest at the back
  and the newest at the front, each the smoothed distribution of that month's qualified home sale
  prices in the three markets (a Gaussian kernel density over log price, `lib/art/tide.ts`). The
  months are the ones ending with the latest month complete in all three markets, the same month
  the Tide issue reports on (`lib/art/load.ts`). It is the masthead on `/blog`, `/tide` and every
  issue page, composed once at 3:1 and once at 4:3, and the card head on the home page.
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

1. **Postgres first** (`leads` + `lead_deliveries`, plus the portal's `contacts`/`events`), when
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
  `vercel.json`.

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
  Sanity project, Clerk's frontend API decoded from the publishable key). `/studio`, `/portal`
  and `/auth` get wider variants. It stays report-only until a per-request nonce is issued from
  `proxy.ts`: Next's inline hydration scripts and the inlined Plausible queue need
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
