# JJ Premier Group — website build handoff

Bundle for the implementing agent. Read in this order.

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | Stack, repo layout, routes, rendering strategy. Start here. |
| `BUILD-PLAN.md` | Phased task list with acceptance criteria. |
| `content-model/schemas.md` | Sanity document types, field by field. |
| `integrations/follow-up-boss.md` | CRM integration spec. Exact endpoints, headers, failure modes. |
| `integrations/sanity.md` | CMS configuration spec. Client config, webhooks, tier limits. |
| `design/BRAND-TOKENS.md` | Token block. **Must be filled before any UI work.** |
| `design/FRAMER-BRIEF.md` | Brief for the design pass, if design is regenerated. |
| `COMPLIANCE.md` | Florida recording consent, 10DLC, brokerage footer. Blocking items. |
| `CAPABILITY-MAP.md` | Vendor research findings. Read before designing around any vendor feature. |
| `.env.example` | Environment variables. |
| `architecture.html` | Client-facing version of the architecture. Not a build input. |

## Non-negotiables

1. **Leads go to `POST /v1/events`, never `POST /v1/people`.** See `integrations/follow-up-boss.md`.
2. **Sanity public reads use the CDN endpoint.** Direct API reads cost ~10x. See `integrations/sanity.md`.
3. **Do not enable Follow Up Boss Pixel form capture.** Forms post server-side. Running both creates duplicate leads.
4. **Call recording stays off** until the Florida all-party consent disclosure is configured and approved. See `COMPLIANCE.md`.
5. **No secrets in client code.** All CRM and Sanity write tokens are server-side only.
6. **Voice does not touch the website.** Follow Up Boss call transcription is a CRM-side product feature with no public API surface. Do not build against it.

## Context

Two-agent real estate team (Jessica and Joelyn) operating under Coldwell Banker, serving Lakewood Ranch and Sarasota, Florida. The site carries property listings, a culture and arts calendar, neighborhood pages, testimonials, team bios, and a blog. Live MLS search is a later phase and is explicitly out of scope for this build.
