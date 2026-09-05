# Build plan

## Phase 0 — blocked until resolved

| Task | Owner | Blocks |
|---|---|---|
| Transcribe brand tokens | Spire Coast | All UI work |
| Register system with Follow Up Boss | Spire Coast | Lead integration testing |
| Confirm Sanity project and dataset | Spire Coast | All content work |
| Compliance sign-off on form consent wording | Brokerage + counsel | Form implementation |
| Coldwell Banker brand assets | Client | Footer |

## Phase 1 — foundation

- Next.js App Router project, Tailwind theme generated from tokens
- Sanity project, schemas per `content-model/schemas.md`, deployed
- Studio embedded at `/studio`, Presentation tool and Visual Editing wired
- Root layout: fonts, Pixel, GA4, base metadata, JSON-LD scaffold
- Component library from the design output

**Done when:** an editor can create a listing in Studio and see it on a live preview.

## Phase 2 — content surfaces

- All static pages
- Listing index and detail, filters functional
- Neighborhood index and detail, including the events query
- Blog index and detail
- Calendar index, event detail, venue detail
- ICS feed at `/api/calendar.ics`
- Structured data on all detail templates
- Revalidate route with signature verification, wired to the Sanity webhook

**Done when:** publishing in Studio updates the live page within seconds, without a deploy.

## Phase 3 — capture

- Server action posting to `POST /v1/events`
- Correct event type per form, per `integrations/follow-up-boss.md`
- Consent checkbox captured and stored with the lead
- **204 response logged at error level with alerting**
- Retry with backoff honoring `Retry-After`
- Pixel verified, form capture confirmed off in the Follow Up Boss admin
- Test leads confirmed arriving with correct source, type, and tags

**Done when:** a submission on every form appears in Follow Up Boss correctly attributed, and a deliberately archived lead flow produces an alert rather than silence.

## Phase 4 — hardening and launch

- Event archiving cron
- Lighthouse: performance, accessibility, SEO
- Keyboard navigation and focus states on every interactive element
- Sitemap, robots, OG images per page
- 404 and 500 pages
- Analytics verified
- Compliance block verified against sign-off
- Editor walkthrough with Jessica and Joelyn

## Explicitly out of scope

- MLS / IDX live search
- Any voice-to-content pipeline
- Sanity Agent Actions
- Anything reading Follow Up Boss call data
