# Integration handoff

External services this app talks to, what env vars they produce, and where in
the codebase those vars are consumed. Use this when wiring up the platform in
Vercel + Supabase + Resend (+ Zapier for the CRM, Sanity for content).

- **Repo:** `spirecoast/real-estate`
- **CRM:** Coldwell Banker's Home Platform. The site has no agent dashboard,
  no sign-in, no tasks, no drips and no lead routing; all of that lives in the
  Home Platform.
- **Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, Supabase
  (Postgres via Drizzle / postgres-js), Zod, Resend, Sanity, Vercel.

## Services to integrate now

| # | Service | Free tier? | Purpose |
|---|---|---|---|
| 0 | **Zapier** | paid (multi-step) | Lead webhook → Home Platform "Create a New Lead" |
| 1 | **Supabase** | yes | Postgres: the lead mirror, consent records, the questionnaire and (soon) search. Not auth, not a CRM |
| 2 | **Resend** | yes (3K/mo) | Team-only email (new-lead notice, alerts, newsletter hand-off) |
| 3 | **Vercel** | yes (hobby) | Hosting, preview deploys, cron |

Future-phase services are listed at the bottom — **don't set up yet.**

---

## 0) Lead delivery (forms → Postgres → Zapier → Home Platform)

The team's CRM is the Home Platform (Compass's platform at Coldwell Banker
Realty). It has no API, so leads reach it through Zapier. Follow Up Boss is
no longer used.

**The rule: the site emails a visitor only about the newsletters they asked
for.** Signing up for Tide or Encore, or ticking the email box, gets one
confirmation email; once confirmed, a short welcome and then each issue
(`docs/ISSUES.md`). No drip, no follow-up about the enquiry. Replies to the
visitor go out from Joelyn's and Jessica's own Coldwell Banker mailboxes,
through a Zapier step if the team wants a templated first reply.

### What happens on every form submit (`lib/lead-pipeline.ts`)

1. **Postgres first.** A row in `leads` (the exact payload, consent + timestamp
   + wording version, source/UTM) plus the `contacts`/`events` rows (the person
   and their consent record). Migration `0006_leads_and_deliveries.sql`.
2. **CRM.** `lib/crm.ts` POSTs the payload to `CRM_WEBHOOK_URL` (8s timeout,
   one retry, any 2xx is success). The result lands in `leads.delivery_status`
   and a `lead_deliveries` row.
3. **Team email.** The full payload to `TEAM_NOTIFY_EMAIL` via Resend, with
   reply-to set to the visitor. This is the safety net when Zapier is down.
4. **Alert.** If the CRM step failed (or no CRM is configured in production),
   an ALERT email to `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`)
   saying where the lead was kept.
5. **Conversion backstop.** A server-side Plausible event named `Lead server`
   (props `form`, `channel: server`) with the visitor's User-Agent and IP
   forwarded. The browser owns the real goals: `Lead` fires on the thank-you
   page, `Subscribe` inline on the Tide/Encore bars. Never add `Lead server`
   to `Lead`; it exists to show what ad blockers hid.
6. A lead form sends the visitor to `/thanks/<form>`; the Tide and Encore bars
   stay inline. They see an error only if **nothing** kept the lead.

### Env vars

| Var | What |
|---|---|
| `CRM_PROVIDER` | `webhook` (default when `CRM_WEBHOOK_URL` is set), `fub`, or `none` |
| `CRM_WEBHOOK_URL` | The Zapier Catch Hook URL |
| `TEAM_NOTIFY_EMAIL` | Every lead, full payload (needs `RESEND_API_KEY` + `RESEND_FROM_EMAIL`) |
| `LEAD_ALERT_EMAIL` | CRM failure alerts; falls back to `TEAM_NOTIFY_EMAIL` |
| `DATABASE_URL` | The Postgres mirror; run `npm run db:migrate` so `0006` is applied |
| `NEXT_PUBLIC_BOOKING_URL` | Shows "Book 15 minutes" on the thank-you pages when set |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Also enables the server-side `Lead server` backstop event |
| `LEAD_TEST_SECRET` | Bearer token for `POST /api/leads` on the live site (launch test only) |

In production at least one of Postgres, the CRM webhook or the team email must
be configured. With no CRM at all, set `CRM_PROVIDER=none` explicitly: an unset
or invalid `CRM_PROVIDER` in production sends the "not configured" alert on
every lead, an explicit `none` does not. The server logs an error at boot if none is (`instrumentation.ts`),
and `GET /api/health` returns `{ ok, sinks }` — booleans and the provider name
only, never values.

### The webhook payload

```json
{
  "form": "buy",
  "firstName": "Pat", "lastName": "Example",
  "email": "pat@example.com", "phone": "(941) 555-0100",
  "message": "…", "market": "sarasota", "propertyAddress": null,
  "timing": "Inside three months", "sellFirst": "Yes",
  "property": null,
  "referral": null,
  "consent": { "email": true, "sms": false, "timestamp": "2026-10-01T15:04:05.000Z", "wordingVersion": "2026-10-01.2",
               "review": false, "reviewAt": null, "reviewWordingVersion": null },
  "source": { "channel": null, "page": "https://jjpremiergroup.com/buy", "referrer": "…", "utm_source": "google", "utm_medium": "cpc",
              "utm_campaign": "…", "utm_term": null, "utm_content": null, "gclid": "…", "fbclid": null,
              "landingPath": "/buy", "firstTouchReferrer": null, "firstTouchAt": "2026-10-01T14:58:00.000Z" },
  "submittedAt": "2026-10-01T15:04:05.000Z",
  "tags": ["form:buy", "market:sarasota", "consent:email", "source:google", "site:jjpremiergroup"],
  "site": "jjpremiergroup.com",
  "test": false
}
```

`form` is one of `contact`, `buy`, `sell`, `listing`, `valuation`, `letter`,
`calendar`, `referral` (`/refer`) and `review-permission` (`/reviews`).
`referral` is set on a referral from `/refer` and `null` otherwise. The lead's
own `firstName`, `lastName`, `email` and `phone` are the **referrer's**; the
person who is moving is under `referral`: `firstName`, `lastName`, `email`,
`phone` (at least one of email and phone), `plan` (`Buying`, `Selling`,
`Moving here` or null), `told: true` with `toldAt` and `toldWordingVersion`
(the referrer ticked "They know I'm passing their details along and expect to
hear from Joelyn and Jessica."), `referredBy` (the referrer's name),
`referredByEmail`, `referredByPhone`, and `note`: one paragraph saying the
contact came via a referral, who referred them, what they're planning, how to
reach them and the referrer's note. Create the CRM contact from `referral.*`
and put `referral.note` on it; the lead is tagged `form:referral`.
`consent.timestamp` and `consent.wordingVersion` describe the email and
call/text boxes only. A review permission shows neither box, so it carries
`email: false`, `sms: false`, `timestamp: null` and `wordingVersion:
"none:not-shown"` (any marketing consent posted with it is ignored); its own
permission is `consent.review: true` with `reviewAt` and
`reviewWordingVersion`, and the lead is tagged `consent:review`. `source.channel` is youtube, instagram,
facebook or nextdoor when the visit came through `/from/<channel>`; the
`source:` tag uses it ahead of `utm_source`. `property` is set on listing inquiries only (`slug`, `title`,
`street`, `city`, `state`, `zip`, `price`, `mls`, `url`). The letter and
calendar boxes imply email consent, so they always carry `consent:email`, with
`wordingVersion` set to `implied:subscribe` (no checkbox was shown).
`source` is the visitor's 90-day first touch from `components/utm-tracker.tsx`
(`readFirstTouch()`): the campaign tags, the landing path, the external referrer
and when it was recorded, plus the page the form was on. `test: true` (and a
`test` tag) marks a rehearsal lead from `scripts/test-lead.mjs`.

### The Zap

Trigger: **Webhooks by Zapier → Catch Hook**. Copy its URL into
`CRM_WEBHOOK_URL`. Then:

1. *(Optional)* **Filter**: continue only if `test` is not `true`.
2. **Compass → Create a New Lead**. Field map:

   | Compass field | From the payload |
   |---|---|
   | First name | `firstName` |
   | Last name | `lastName` (may be empty for the letter/calendar boxes) |
   | Email | `email` |
   | Phone | `phone` |
   | Tags | `tags` (Zapier joins arrays with commas; pick "comma-separated" if asked) |

   Nothing else fits a Compass field. Put `message`, `timing`, `sellFirst`,
   `market`, `propertyAddress` and `source.utm_*` into the Zap's note or
   email step so the agent sees them. For `form:referral`, a Filter or Path
   on `referral` not empty creates the contact from `referral.firstName`,
   `referral.lastName`, `referral.email` and `referral.phone` with
   `referral.note` as the contact's note (it names the referrer and says the
   contact came via a referral); the referrer's thank-you goes to `email`.
3. *(Optional)* **Gmail/Outlook → Send email** from the agent's own
   Coldwell Banker mailbox, to `email`, as the first reply. This is the only
   place a visitor ever receives email, and it comes from a person.

Zapier returns 200 as soon as the hook catches the payload, so a failing
later step does not alert the site. Watch the Zap history after launch.

### Launch test

```bash
# straight to the Catch Hook, to give the Zap editor a full sample (no site needed)
CRM_WEBHOOK_URL="<hook url>" node scripts/test-lead.mjs --hook --form buy
# through the local dev server (open in development, no secret needed)
node scripts/test-lead.mjs --form buy
# through the live site
LEAD_TEST_SECRET=… node scripts/test-lead.mjs --live https://jjpremiergroup.com --form sell
```

Through the site it posts a test lead (tagged `test`) and prints which sinks
accepted it. Then check: the `leads` row, the Zap history, the team inbox, and
the Plausible goal.

### Consent

Every form that asks for an email shows an unchecked **email** box
("Yes, you can email me about the market and my search. I can stop any time by
replying 'stop' to any email.");
forms that ask for a phone also show the unchecked **calls/texts** box. Neither
is required. The state, timestamp and `CONSENT_WORDING_VERSION` (lib/leads.ts)
are stored on the lead and carried as `consent:email` / `consent:sms` tags.
Bump the version whenever the wording changes. Subscribers from the Tide and
Encore bars record `implied:subscribe` instead.

---

## 1) Supabase

Supabase is the site's database, not its CRM and not its auth. It holds:

- **The lead mirror:** `leads` (one row per form submission, written before
  any delivery is tried) and `lead_deliveries` (what each sink said).
- **Consent records:** `contacts` and `events` (who ticked which box, when,
  under which wording version; unsubscribes from `/unsubscribe`).
- **The website questionnaire:** `questionnaire_answers` behind the private
  `/q/<token>` links (`docs/SITE.md`).
- **Search** (coming): the listings/neighborhood search will live here too.

Nobody signs in to the site; Supabase Auth is not used.

### Provision
- New project at https://supabase.com/dashboard
- Region: `us-east-1` (closest to FL market)
- Save the database password
- Wait ~2 min for provisioning

### Env vars produced
| Var | Source in dashboard |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` `secret` key |
| `DATABASE_URL` | Settings → Database → Connection string → **Transaction pooler** (port 6543), URL-encoded password |

### Where these are consumed
- `lib/db/index.ts` — Drizzle / postgres-js connection (the only path that
  reads/writes today). Bypasses RLS via the postgres role.
- `drizzle.config.ts` — drizzle-kit migrate target
- `lib/env.ts` — Zod schema for the above (nothing calls it yet)

`lib/supabase/server.ts` and `lib/supabase/browser.ts` are kept for the
search work; nothing uses them today.

### Apply schema migrations
Migrations in `lib/db/migrations/` (apply all, in order):
- `0000_init_contacts_events.sql` — `contacts` + `events`, RLS enabled (deny-by-default)
- `0001`–`0005` — the old agent dashboard's tables, policies and auth columns.
  Historical; `0008` removes all of it.
- `0006_leads_and_deliveries.sql` — `leads` and `lead_deliveries`, the tables
  the forms write to
- `0007_questionnaire.sql` — `questionnaire_answers` for the private questionnaire
  links, RLS enabled. `IF NOT EXISTS`, because the server also creates the
  table on first use.
- `0008_remove_portal.sql` — drops the dashboard tables (agents, tasks, the
  two drip tables, the routing rules), the agent foreign keys and the contacts
  columns only the dashboard used. `IF EXISTS` throughout, so it is safe on
  any database state.

Apply via either:
```bash
npm run db:migrate
```
or paste each `.sql` file into Supabase SQL Editor in order.

Every table has RLS enabled and no policies: the `anon` and `authenticated`
roles can read nothing. The server writes through the postgres role.

### No storage buckets needed
Leave Storage alone for now.

---

## 2) Resend

### Provision
- Sign up at https://resend.com
- Add a domain (e.g., `mail.yourdomain.com`) — Domains → Add Domain
- Add the DNS records Resend shows you to your DNS provider (3-4 TXT records:
  SPF, DKIM, DMARC). Wait for verification (5–60 min).
- Once verified, you can send from `anything@mail.yourdomain.com`.

### Env vars produced
| Var | Where to find |
|---|---|
| `RESEND_API_KEY` | API Keys → Create API Key (full access) |
| `RESEND_FROM_EMAIL` | Pick any address on the verified domain (e.g., `[email protected]`) |
| `TEAM_NOTIFY_EMAIL` | Internal inbox for new-lead notifications (e.g., `[email protected]` — can be a Google Workspace alias) |

### Where these are consumed
- `lib/email/index.ts` — Resend client + from-address resolution
- `lib/lead-alert.ts` — the team notification (`TEAM_NOTIFY_EMAIL`) and the
  CRM failure alert (`LEAD_ALERT_EMAIL`)

### Verify
After deploy, submit the contact form. You should receive one email, a
"New lead · contact · …" at `TEAM_NOTIFY_EMAIL`. The visitor receives
nothing from the site.

Resend logs every send under **Logs** in their dashboard — useful for debugging
deliverability.

---

## 3) Vercel

### Provision
- https://vercel.com → Add New → Project → Import Git Repository
- Pick `spirecoast/real-estate`
- **Branch to deploy:** `claude/clone-real-estate-repo-D0RgV` (until merged to
  main)
- Framework preset: Next.js (auto-detected)
- Build/install commands: defaults are correct
- Root directory: `./`

### Env vars to set (Project Settings → Environment Variables)
Set all of these for **Production** AND **Preview**:

```
NEXT_PUBLIC_SUPABASE_URL          # from Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY     # from Supabase
SUPABASE_SERVICE_ROLE_KEY         # from Supabase (mark as Secret)
DATABASE_URL                      # Supabase pooler URL
RESEND_API_KEY                    # from Resend (mark as Secret)
[email protected]
[email protected]
UNSUBSCRIBE_SECRET                # `openssl rand -base64 48` (mark as Secret)
NEXT_PUBLIC_SITE_URL              # https://your-prod-domain.com
CRM_WEBHOOK_URL                   # the Zapier Catch Hook (mark as Secret)
LEAD_ALERT_EMAIL                  # optional; defaults to TEAM_NOTIFY_EMAIL
LEAD_TEST_SECRET                  # `openssl rand -hex 24` (mark as Secret)
NEXT_PUBLIC_BOOKING_URL           # optional; the booking page link
```

`UNSUBSCRIBE_SECRET` is the HMAC key used to sign marketing-email unsubscribe
links. **Required in production** — `lib/unsubscribe.ts` throws at boot if it's
missing or shorter than 32 chars when `NODE_ENV=production`.

`NEXT_PUBLIC_SITE_URL` is consumed in `lib/site.ts` (metadata base, absolute
links, the listing URL in the CRM payload).

### Custom domain
Settings → Domains → Add. Vercel auto-provisions SSL.

---

## Order of operations

1. Provision Supabase → grab 4 env vars → run the migrations (`0000`–`0008`)
2. Provision Resend → verify domain → grab API key → pick from-address
3. Build the Zap (Catch Hook → Home Platform "Create a New Lead") → copy the
   hook URL into `CRM_WEBHOOK_URL`
4. Connect repo to Vercel → paste all env vars (Production + Preview) → deploy
5. Set custom domain on Vercel
6. Verify end-to-end:
   - `https://your-domain.com/` renders; `/api/health` answers `ok: true`
   - `/contact` form submits → rows in `leads` and `contacts`, the Zap runs and
     the lead appears in the Home Platform, one "New lead" email at
     `TEAM_NOTIFY_EMAIL`, visitor lands on `/thanks/contact`. No email to the
     visitor.
   - Tide box signup → `leads` row tagged `consent:email`, visitor lands on
     `/thanks/letter`

## Files not to touch when integrating

- `lib/db/migrations/*.sql` — applied migrations are immutable. New schema →
  new migration.
- `lib/db/schema.ts` — only edit alongside a new migration.
- Anything under `styles/themes/*.css` — brand work happens later; current
  placeholders are intentional.
- `[YOUR PLACEHOLDER]` strings — global find-and-replace target for when the
  brand is set. Keep grep-able.

## Stop-and-ask triggers (from CLAUDE.md)

Pause before:
- Adding any package outside §3 of `ARCHITECTURE.md`
- Changing the locked stack
- Anything Fair Housing-sensitive (listing copy, AI-generated marketing,
  neighborhood content)
- Schema changes — every one requires an explicit new migration
- Compliance work (consent, retention, MLS attribution)
- Crossing $50/mo external service threshold

## Future-phase services (do NOT set up yet)

These are in `.env.example` commented out. Skip until the corresponding phase:

- **Anthropic API** (Phase 7) — logical role env vars:
  `ANTHROPIC_MODEL_TRIAGE` / `_STANDARD` / `_DEEP`. Per CLAUDE.md hard rule,
  never hardcode model IDs.
- **Twilio + 10DLC** (Phase 6) — SMS, requires 2-4 week brand registration
- **CallRail** (Phase 1/2 nice-to-have) — call tracking
- **Showcase IDX / Stellar MLS** (Phase 3) — listings feed
- **ATTOM / GreatSchools / First Street / Walk Score / Mapbox** (Phase 4) —
  property data
- **Loops or Customer.io** (Phase 8) — marketing email at scale (transactional
  stays on Resend)
- **Cloudinary / Mux** (Phase 3/8) — media hosting
- **PostHog / Sentry** (Phase 1/2 if budget allows) — observability
- **Langfuse** (Phase 7) — LLM observability
- **AWS S3 with Object Lock** (Phase 6) — compliance archive
