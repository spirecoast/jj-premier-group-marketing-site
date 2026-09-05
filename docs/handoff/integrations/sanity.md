# Sanity configuration spec

## Clients

Two clients. Never one.

```ts
// sanity/lib/client.ts — public reads
createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!, // date-pinned, e.g. 2026-09-01
  useCdn: true,
})

// sanity/lib/write-client.ts — drafts, preview, mutations
createClient({
  // same base config
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,  // server only
})
```

**`useCdn: true` for every public page read.** Direct API requests are metered separately from CDN requests and cost roughly ten times more per request. A client misconfigured to bypass the CDN is the standard way this project stops being free.

`useCdn: false` is correct only for draft mode, preview, and writes.

Pin `apiVersion` to a date string, never `vX` in production code.

## Studio

Embed at `/studio` via `next-sanity`'s `NextStudio` in `app/studio/[[...tool]]/page.tsx`. Schemas live in the repo under `sanity/schemas` and are deployed with the CLI.

Enable the Presentation tool and Visual Editing. Both are included on the free tier, and click-to-edit on a live preview is the single biggest usability win for non-technical editors. Wire `defineEnableDraftMode` and `<VisualEditing />` per the `next-sanity` docs.

## Publishing to live

GROQ-powered webhook in Sanity Manage pointing at `POST /api/revalidate`.

Verify the signature with `parseBody` from `next-sanity` and `SANITY_REVALIDATE_SECRET`. Reject unverified requests. Expire by tag or path, not the whole site.

## Typegen

Write queries with `defineQuery` and run Sanity TypeGen so query results are typed end to end. Do not hand-write result types.

## Tier limits that affect design

| | Free | Growth |
|---|---|---|
| Seats | 20 | up to 50, ~$15/seat/mo |
| Roles | 2 (admin, viewer) | 5 |
| Datasets | 2, public only | private available |
| Documents | 10,000 | 25,000 hard cap |
| Scheduled publishing | no | yes |
| Custom roles / SSO | no | Enterprise only |

Launch on Free. It is sufficient. Confirm current figures at https://www.sanity.io/pricing before quoting anything to the client.

**On Free there is no overage billing.** Hitting a quota blocks the functionality rather than charging for it. Treat quotas as hard stops.

**The document count includes drafts and internal records.** The calendar is the content type that will push against it, which is why event archiving is a launch requirement rather than a later optimization.

## Scheduling

Scheduled publishing is a paid feature and **is not needed**. Events carry `startsAt` / `endsAt` and queries filter out past events. Do not upgrade for this.

## Agent Actions

Available (`generate`, `transform`, `translate`, `prompt`, `patch`) but documented as experimental and requiring the `vX` API version. Useful for optional internal tooling. **Not on the launch path.** Do not introduce a launch dependency on an experimental API.
