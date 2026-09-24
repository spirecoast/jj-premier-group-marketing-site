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
| Home page sections | `components/home/*` |
| Component library | `components/*` (cards, bands, forms, headings, wordmark, CB mark, Equal Housing mark) |
| Content types and data API | `lib/content/` — pages call `getListings()`, `getUpcomingEvents()`, … and never touch a source |
| Sample content | `lib/content/seed/` (used until Sanity is configured; also the seed for `scripts/seed-sanity.ts`) |
| Sanity | `sanity/` (schemas, clients, queries, fetch helper), `sanity.config.ts`, Studio at `/studio` |
| Lead capture | `lib/fub.ts` (Follow Up Boss client), `actions/submit-lead.ts` (the one server action), `lib/leads.ts`, `lib/lead-alert.ts` |
| Platform routes | `app/api/revalidate` (Sanity webhook), `app/api/draft-mode/*`, `app/api/calendar.ics`, `app/api/cron/archive-events`, `app/sitemap.ts`, `app/robots.ts` |
| SEO | `lib/seo.ts` (metadata + JSON-LD helpers), `components/json-ld.tsx` |
| Analytics | `components/analytics.tsx` (Plausible + Follow Up Boss Pixel, env-gated), `lib/analytics.ts` (custom events) |
| Encore dataset | `lib/content/encore/encore-calendar.json` (the source), `lib/content/encore.ts` (the converter) |
| Neighborhood explorer | `components/explorer/*` (map, panel, card), `components/place-map.tsx`, `lib/neighborhoods/*` (data access, search, URL state, brand map style) |
| Neighborhood dataset | `neighborhood-data/` (the catalog, its schema, scripts and docs; see its `CLAUDE-CODE-HANDOFF.md`) |

The agent portal (`app/portal`, `app/auth`, Supabase, Drizzle, Inngest, Resend) is untouched and
still works on the same theme.

## Names, places and what is deliberately not on the page

- Markets: Lakewood Ranch, Sarasota and Bradenton. Tampa was removed in September 2026 at the
  client's direction; `MarketSlug` has three values.
- The arts calendar is the **Encore Arts Calendar** ("Encore" in the nav). The quarterly market
  piece is **The Coast Market Report** ("Market Report" in the nav). Both names live in `lib/site.ts`.
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

The calendar is driven by the events dataset the client supplied (`lib/content/encore/`), not by
sample data. `lib/content/encore.ts` turns its productions and venues into the site's `Event` and
`Venue` shapes:

- A production with dated performances becomes one event whose `performances[]` carries every
  date and time (wall-clock America/New_York converted to UTC). `startsAt` is the next
  performance. The list and month views expand these to one row per date with `getOccurrences()`.
- A run with no published times (an exhibition) is an all-day event from its first day through
  `runsThrough`; the list view shows these in the "On view now" strip via `getOnView()`.
- Items marked `announced` and the three whose venue is still to be confirmed are left off.
  Sold-out productions show "Sold out" and their offers carry `SoldOut` in the Event JSON-LD.
- Each category has a placeholder photograph from the library until the venues supply art.
- The ICS feed emits one VEVENT per performance for the next six months plus every current run.

When Sanity is live the same shape lives in the `event` document (performances, presenter, room,
firstDate, runsThrough, status) and `scripts/seed-sanity.ts` imports the dataset once. To refresh
the dataset before then, replace the JSON file and rebuild.

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

## Leads: one action, one endpoint

Every form (`components/lead-form.tsx`, `components/letter-form.tsx`) posts to
`actions/submit-lead.ts`, which sends a Follow Up Boss **event** (`POST /v1/events`, never
`/v1/people`) with the registered system headers. Event type by form:

| Form | Type |
|---|---|
| contact, buy | General Inquiry |
| sell, valuation | Seller Inquiry |
| listing | Property Inquiry |
| letter, calendar | Registration |

Response handling in `lib/fub.ts`: 201/200 success; **204 = the lead flow is archived and the lead
was dropped** → error-level log plus an alert email to `LEAD_ALERT_EMAIL`; 429 honours
`Retry-After`; 5xx retries with backoff. The consent checkbox is unchecked by default, never
required, and its state and timestamp travel with the lead (message text and a `sms-consent` /
`no-sms-consent` tag). When `DATABASE_URL` is set the lead is also mirrored into the portal's
`contacts` table; when `TEAM_NOTIFY_EMAIL` is set the team gets an email copy.

The Follow Up Boss Pixel is loaded only when `NEXT_PUBLIC_FUB_PIXEL_ID` is set. **Form capture must
stay off** in the Follow Up Boss admin; forms already post server-side.

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
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` loads Plausible (outbound links and tagged events). The forms fire
  `Lead` (prop `form`: contact, buy, sell, valuation, listing, …) and `Subscribe` (prop `form`:
  letter or calendar). Add both as goals in Plausible. `NEXT_PUBLIC_PLAUSIBLE_HOST` only for a
  self-hosted instance.

## Launch checklist

1. Add the custom domain to the Vercel project and set `NEXT_PUBLIC_SITE_URL` to it (with
   `https://`). Every canonical, sitemap entry, Open Graph URL and ICS UID uses this value.
2. Remove `NEXT_PUBLIC_ROBOTS_NOINDEX` (or set it empty) in the production environment and
   redeploy. Check `/robots.txt` and one page's `<meta name="robots">` afterwards.
3. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to the bare domain and confirm a pageview in the dashboard.
4. Google Business Profile: the client is creating it. The name, address and phone on the profile
   must match the footer, the contact page and the RealEstateAgent JSON-LD exactly (same
   punctuation, same suite line). Once the profile is live, put its URL in `sameAs` in
   `lib/content/seed/settings.ts` (or the Sanity site settings) alongside the social links.
5. Submit the sitemap in Google Search Console and Bing Webmaster Tools.
6. Confirm the custom 404 renders on the live domain (`/this-does-not-exist`).
- `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`) receives the alert when a lead cannot be
  delivered to Follow Up Boss, including the archived-flow 204 case.
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
- The Coldwell Banker mark sizes (150 in the nav, 220 in the footer) follow the approved mockup.
- The privacy and terms pages carry a "draft for legal review" label until counsel signs off.

## Still open (needs the client or the brokerage)

Phase 0 blockers from `docs/handoff/BUILD-PLAN.md`:

1. Office street address and zip for the footer, JSON-LD and the privacy page.
2. Joelyn's Florida licence number (Jessica's is in; the footer hides a name until its number exists).
3. Follow Up Boss system registration (`FUB_SYSTEM`, `FUB_SYSTEM_KEY`) and the API key. Until they
   are set, leads are mirrored to the database and emailed only, and production logs an alert.
4. The Sanity project and dataset, then the seed script and webhook in the section above.
5. Consent wording sign-off from counsel (`CONSENT_WORDING` in `lib/leads.ts`) and 10DLC
   registration before any texting starts.
6. An IDX licence from Stellar MLS before any MLS data or MLS wording goes on the site. The sample
   listings are placeholders.
7. Coldwell Banker brand asset review, and licensed webfont files for IvyPresto Headline and
   Contralto (the CSS stacks already lead with them).

Also worth knowing:

- Market-letter subscribers are sent to Follow Up Boss as a Registration event and mirrored to the
  database, but are not enrolled in the portal's older welcome-email series.
- Every statistic on the site carries its source and date in the seed content. When the numbers
  are replaced in Sanity, keep the source field filled.
