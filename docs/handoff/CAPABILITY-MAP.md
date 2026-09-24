# Vendor capability findings

Research conducted against Follow Up Boss and Sanity documentation. Read before designing around any vendor feature. Verify anything marked experimental or contested before relying on it.

## Follow Up Boss

### Voice — the finding that changed the architecture

Follow Up Boss records calls and produces transcripts and AI summaries with action items on the lead timeline, in both web and mobile apps, within seconds of a call ending. It is a paid power-up an account owner enables.

**None of that output is on the public API.** The calls endpoint accepts a note, outcome, duration, and recording URL. There is no documented transcript or summary field, and the read endpoint carries an explicit notice that some call data is only visible inside the application.

Consequence: voice in Follow Up Boss is call intelligence for the agents, not a content input. It cannot create listings or calendar events. A `callsCreated` webhook exists and would tell an external system a call happened, but the summary text is not retrievable. **The website build does not integrate with it at all.**

Product constraints: recording and AI summaries are coupled and cannot be enabled separately; only calls longer than 15 seconds and shorter than 60 minutes are processed; transferred calls excluded; English only.

### Other findings

- **System registration is required** when the API is used to provide services to a Follow Up Boss customer. It also roughly doubles the global request allowance.
- **Leads must go to the events endpoint,** not the people endpoint. The documentation states directly that creating people skips automations and causes duplicates.
- **A 204 response is a silent drop.** It means the lead flow for that source is archived. It is not an error status and will read as success unless explicitly handled.
- **Sending leads is effectively unlimited.** The rate limits apply to reads, which this build barely performs.
- **A 429 can arrive with remaining capacity showing.** Honor the response, not the headers.
- **Only some event types trigger automations and action plans.** Type selection is functionally significant, not cosmetic.
- **The Pixel cannot read forms inside iframes** and only tracks after a contact is identified. Form capture should be off when leads arrive via the API.
- **Inbox Apps are limited to established integration partners.** Embedded Apps are buildable by any account owner and could later surface site data inside the CRM.

## Sanity

- **Direct API reads cost roughly ten times more than CDN reads.** Client configuration is the main cost lever.
- **Free tier has no overage billing.** Quotas are hard stops, not charges.
- **Document count includes drafts and internal records.** Hard cap even on the paid tier. The calendar is the type that would eventually breach it.
- **Scheduled publishing is paid and not needed here.** Date filtering handles the calendar.
- **Presentation tool and Visual Editing are free tier.** Worth using from day one for non-technical editors.
- **Custom roles, SSO, and Content Releases are Enterprise only.**
- **Agent Actions are documented as experimental** and require a non-date API version. Five operations: generate, transform, translate, prompt, patch. Notably, transform cannot add new fields or array items, only modify what exists.
- **A hosted MCP server exists** at mcp.sanity.io with schema-aware content operations, OAuth or scoped bearer token. Developer tooling, not a client-facing feature.
- **Published free tier figures vary between third-party sources.** Confirm against Sanity's own pricing page before quoting.

## Open questions requiring a vendor conversation

1. Whether the recording URL is readable back via the calls read endpoint. The response schema is not statically documented and the app-only restriction is explicit.
2. The exact Follow Up Boss webhook signature verification header.
3. Which Follow Up Boss plan tier includes calling and the recording power-up.
4. Current authoritative Sanity free tier request allowances.
