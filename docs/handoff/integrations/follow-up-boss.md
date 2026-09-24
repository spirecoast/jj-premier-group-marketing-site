# Follow Up Boss integration spec

Base URL: `https://api.followupboss.com/v1`
Docs: https://docs.followupboss.com/reference/getting-started

## Authentication

HTTP Basic Auth over HTTPS. API key is the username, password is empty. HTTP without TLS fails.

Every request must also carry the registered system headers:

```
X-System: <FUB_SYSTEM>
X-System-Key: <FUB_SYSTEM_KEY>
```

**System registration is required.** Follow Up Boss asks anyone accessing the API to register their system, and requires it when the API is used to provide services to one of their customers, which is this case. Register at https://apps.followupboss.com/system-registration.

Registration also raises the request allowance: without valid system headers the global limit drops from ~250 to ~125 requests per sliding 10 second window.

`system` is the software identity. `source` is the marketing name of the lead source. Different fields, both required.

## Sending leads

**Use `POST /v1/events`. Never `POST /v1/people`.** Creating people directly skips automations and produces duplicates. The events endpoint deduplicates on phone and email and triggers the team's lead routing rules.

```
POST /v1/events
{
  "source": "jjpremiergroup.com",
  "system": "<FUB_SYSTEM>",
  "type": "Registration",
  "message": "<free text from the form>",
  "person": {
    "firstName": "", "lastName": "",
    "emails": [{ "value": "" }],
    "phones": [{ "value": "" }]
  },
  "property": { },            // listing inquiries only
  "campaign": { "source": "" } // campaign.source required if campaign is sent at all
}
```

Set `source` to the bare domain, no `www.`.

### Event types by form

| Form | `type` |
|---|---|
| Contact | `General Inquiry` |
| Listing inquiry | `Property Inquiry` |
| Home valuation | `Seller Inquiry` |
| Newsletter / calendar subscribe | `Registration` |
| Tracked page view (optional) | `Viewed Page` |

Only certain types trigger Action Plans and Automations. Action Plans fire on Registration, Seller Inquiry, Property Inquiry, General Inquiry, and Visited Open House. Automations fire on Registration, Property Inquiry, Seller Inquiry, and General Inquiry. The wrong type means the lead sits untouched.

Events older than one day are treated as historical and will not trigger workflows.

### Response handling — read this carefully

| Status | Meaning | Action |
|---|---|---|
| 201 | New person created | Success |
| 200 | Existing person updated | Success |
| **204** | **Lead flow for that source is archived. Lead accepted and silently ignored.** | **Log at error level and alert. This is not success.** |
| 404 | Supplied person id not found | Log, retry without the id |
| 429 | Rate limited | Honor `Retry-After` |

The 204 case will look fine in production while leads disappear. Handle it explicitly.

## Rate limits

Sliding 10 second window. Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Window`, `X-RateLimit-Context`. Contexts are independent.

| Context | Registered limit |
|---|---|
| `POST /v1/events` | Effectively unlimited |
| Global | 250 |
| `PUT /v1/people` | 25 |
| `GET /v1/events` | 20 |
| Notes | 10 |

A 429 can arrive even when `X-RateLimit-Remaining` suggests capacity. Honor the response, not the arithmetic. Monitoring: `GET /v1/rateLimit/usage` and `GET /v1/rateLimit/limits`.

Sending leads is unlimited, so this integration will not feel the limits. Implement backoff anyway.

## Pixel

Install the snippet in the root layout `<head>`. Admin > Integrations > Follow Up Boss Pixel.

**Disable form capture.** Follow Up Boss recommends turning it off when leads already arrive via the API; running both creates duplicates. The Pixel is here for activity tracking and source attribution only.

Known limits: tracking only begins once a contact is identified, it cannot read forms rendered inside iframes, and it cannot track social sign-ins that happen off-site.

## Webhooks

Not required at launch. If added later: registration is owner-only, two webhooks per event per system, payloads are pointers rather than data (fetch the supplied URI), retries continue for several hours.

## Voice — do not build against this

Follow Up Boss records calls and produces transcripts and AI summaries on the lead timeline. This is a product feature behind a paid power-up that an account owner enables.

**It is not available on the public API.** `POST /v1/calls` accepts only `personId`, `phone`, `isIncoming`, `note`, `outcome`, `duration`, `toNumber`, `fromNumber`, `userId`, and `recordingUrl`. There is no documented transcript or summary field, and `GET /v1/calls` carries an explicit notice that some call data is only visible inside the Follow Up Boss application.

A `callsCreated` webhook exists, so an external system can learn a call happened, but it cannot retrieve the AI summary text. **No part of this build reads, writes, or depends on call data.**

Product constraints, for client awareness rather than the build: recording and AI summaries are coupled and cannot be enabled separately, only calls longer than 15 seconds and shorter than 60 minutes are processed, transferred calls are excluded, English only.
