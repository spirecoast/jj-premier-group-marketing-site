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
| Analytics | `components/analytics.tsx` (GA4 + Follow Up Boss Pixel, env-gated) |

The agent portal (`app/portal`, `app/auth`, Supabase, Drizzle, Inngest, Resend) is untouched and
still works on the same theme.

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

- "Broker Associate" is the title the brand system gives both agents. The brokerage should confirm
  it matches each licence type (SL vs BK) before launch.
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
