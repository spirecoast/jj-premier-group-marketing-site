# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router |
| Styling | Tailwind, theme generated from brand tokens |
| CMS | Sanity, Studio embedded at `/studio` |
| Host | Vercel |
| CRM | Follow Up Boss |
| DNS | Cloudflare |

Design originates in Framer and is rebuilt as code. Framer is not a runtime dependency and must not appear in the repo, package manifest, or any request path.

## Repo layout

```
app/
  (site)/
    page.tsx                        home
    buy/page.tsx
    sell/page.tsx
    listings/page.tsx
    listings/[slug]/page.tsx
    calendar/page.tsx
    calendar/[slug]/page.tsx
    venues/[slug]/page.tsx
    neighborhoods/page.tsx
    neighborhoods/[slug]/page.tsx
    about/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
    valuation/page.tsx
    contact/page.tsx
    privacy/page.tsx
    terms/page.tsx
  studio/[[...tool]]/page.tsx       embedded Sanity Studio
  api/
    revalidate/route.ts             Sanity webhook -> ISR
    cron/archive-events/route.ts    scheduled event archiving
    calendar.ics/route.ts           ICS feed
  layout.tsx                        Pixel, GA4, JSON-LD, fonts
actions/
  submit-lead.ts                    server action -> Follow Up Boss
sanity/
  schemas/                          document types
  lib/client.ts                     read client (CDN)
  lib/write-client.ts               write client (no CDN)
  lib/queries.ts                    GROQ, defineQuery for typegen
components/
lib/
  fub.ts                            Follow Up Boss client
  seo.ts                            metadata + JSON-LD helpers
```

## Rendering

- Public pages: server components, static where possible, ISR revalidated on demand.
- Listing, calendar, venue, neighborhood, and blog detail pages: `generateStaticParams` from Sanity, revalidated by webhook.
- Draft mode enabled for editor preview of unpublished content.
- No client-side Sanity fetching. No Sanity token ever reaches the browser.

## Data flow

**Publish:** editor publishes in Studio -> Sanity webhook -> `POST /api/revalidate` (HMAC verified) -> affected paths/tags expired -> next request rebuilds that page only.

**Lead:** visitor submits a form -> server action validates -> `POST https://api.followupboss.com/v1/events` with system headers -> response status handled per `integrations/follow-up-boss.md` -> confirmation rendered.

**Activity:** Follow Up Boss Pixel in root layout head tracks page and listing views, attaches history to the lead record once identified. Form capture disabled.

**Voice:** entirely inside Follow Up Boss. No website surface. No inbound or outbound integration.

## Out of scope for this build

- MLS / IDX live search
- Any voice-to-content pipeline
- Sanity Agent Actions (experimental; optional tooling only, not on the launch path)
