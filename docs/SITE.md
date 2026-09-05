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

## Verification done for this build

- `npm run typecheck` and `npm run build` pass with no env configured (seed content).
- Every page rendered in Chromium at 1440, 810 and 390 and compared against the design.
- Fair-housing check (`lib/fair-housing.ts`) run over all seed copy.

## Still open (needs the client or the brokerage)

See the bottom of `docs/handoff/design/BRAND-TOKENS.md` and `docs/handoff/BUILD-PLAN.md` Phase 0:
office street address, Joelyn's license number, Follow Up Boss system registration and keys, the
Sanity project, consent wording sign-off, Coldwell Banker brand assets review, and licensed webfont
files for IvyPresto Headline and Contralto.
