# Integration handoff

External services this app talks to, what env vars they produce, and where in
the codebase those vars are consumed. Use this when wiring up the platform in
Vercel + Clerk + Supabase + Resend + Inngest.

- **Repo:** `spirecoast/real-estate`
- **Active branches:** `main` (production) + `claude/clone-real-estate-repo-D0RgV` (dev)
- **Stack source of truth:** `ARCHITECTURE.md` §3 + `CLAUDE.md`
- **Locked stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4,
  Clerk (auth), Supabase (DB / Storage / Realtime), Drizzle (postgres-js), Zod,
  Inngest, Resend, Vercel.

## Services to integrate now (Phase 1 + 2)

| # | Service | Free tier? | Purpose |
|---|---|---|---|
| 1 | **Clerk** | yes (10k MAU) | Auth (email + password, social, MFA) |
| 2 | **Supabase** | yes | Postgres + Storage + Realtime (NOT auth) |
| 3 | **Resend** | yes (3K/mo) | Transactional email |
| 4 | **Inngest** | yes | Background jobs (welcome series + failsafes) |
| 5 | **Vercel** | yes (hobby) | Hosting + preview deploys |

Future-phase services from §3 are listed at the bottom — **don't set up yet.**

---

## 0) Lead delivery (forms → Postgres → Zapier → Home Platform)

The team's CRM is the Home Platform (Compass's platform at Coldwell Banker
Realty). It has no API, so leads reach it through Zapier. Follow Up Boss is
no longer used.

**The rule: the site never emails a visitor.** No confirmation, no welcome
series, no drip. The only email the site sends goes to the team. Replies to
the visitor go out from Joelyn's and Jessica's own Coldwell Banker mailboxes,
through a Zapier step if the team wants a templated first reply.

### What happens on every form submit (`lib/lead-pipeline.ts`)

1. **Postgres first.** A row in `leads` (the exact payload, consent + timestamp
   + wording version, source/UTM) plus the `contacts`/`events` rows the portal
   reads. Migration `0006_leads_and_deliveries.sql`.
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

## 1) Clerk

### Provision
- Sign up at https://dashboard.clerk.com → **Create application**
- Pick auth methods: **Email + Password** (primary) plus optionally Google /
  Microsoft for social. Disable email-code / magic-link unless you want them
  as a fallback.
- **Restrictions → Sign-up mode**: set to **Restricted** (or Invitation-only)
  so only invited team members can create accounts.
- **API keys**: copy publishable + secret from the API keys page.
- **Add team members**: Users → Create user → use the same email you've
  seeded into the `agents` table. Set a temporary password and share it; user
  changes it on first sign-in.

### Env vars produced
| Var | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys → Secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Hardcode `/auth/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Hardcode `/auth/no-access` (sign-up is invite-only) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Hardcode `/portal` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Hardcode `/auth/no-access` |

### Where these are consumed
- `app/layout.tsx` — `<ClerkProvider>` wraps the entire tree
- `proxy.ts` — `clerkMiddleware()` protects `/portal/*`
- `lib/auth/server.ts` — `auth()` and `currentUser()` for `requireAgent()` /
  `getCurrentAgent()`; agent linking by email match on first portal visit
- `app/auth/login/[[...rest]]/page.tsx` — Clerk's `<SignIn />` component
- `app/portal/layout.tsx` — Clerk's `<UserButton />` for sign-out menu

### Linking Clerk users to agent rows
The first time a Clerk user visits `/portal`, `getCurrentAgent` finds their
`agents` row by lowercased email match and writes Clerk's user ID to
`agents.clerk_user_id`. After that, lookups go straight by that ID.

Workflow: admin creates agent rows in the `agents` table, then invites the
team via Clerk dashboard with the same emails. No additional plumbing needed.

---

## 2) Supabase

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
  actually reads/writes today). Bypasses RLS via the postgres role.
- `drizzle.config.ts` — drizzle-kit migrate target
- `lib/env.ts` — Zod schema validates all of the above

`lib/supabase/server.ts` and `lib/supabase/browser.ts` are kept for future
Storage / Realtime work but are not currently used now that Clerk owns auth.

### Apply schema migrations
Migrations in `lib/db/migrations/` (apply all, in order; `0006` adds the
`leads` and `lead_deliveries` tables the forms write to):
- `0000_init_contacts_events.sql` — `contacts` + `events` tables, RLS enabled (deny-by-default)
- `0001_agents_sequences_routing.sql` — `agents`, `sequences`,
  `sequence_enrollments`, `lead_routing_rules` + FKs from `contacts`/`events` →
  `agents`
- `0002_auth_policies.sql` — `is_active_agent()` SQL helper + SELECT/UPDATE
  policies for authenticated agents
- `0007_questionnaire.sql` — `questionnaire_answers` for the private questionnaire
  links (`docs/SITE.md`), RLS enabled. `IF NOT EXISTS`, because the server also
  creates the table on first use.

Apply via either:
```bash
npm run db:migrate
```
or paste each `.sql` file into Supabase SQL Editor in order.

### Seed at least one agent
Run in Supabase SQL Editor — one row per team member who needs portal access:
```sql
insert into agents (name, email, license_number, brokerage, active)
values
  ('Mom Name', '[email protected]', 'FL-LICENSE-12345', 'Brokerage Name', true),
  ('Girlfriend Name', '[email protected]', 'FL-LICENSE-67890', 'Brokerage Name', true);
```
First magic-link login for each email auto-links `agents.auth_user_id` (see
`lib/auth/server.ts` → `linkAuthUserToAgent`).

### Auth dashboard config
**Authentication → URL Configuration:**
- **Site URL:** `https://your-prod-domain.com` (or `http://localhost:3000` in dev)
- **Redirect URLs (allowlist):**
  - `http://localhost:3000/auth/callback`
  - `https://your-prod-domain.com/auth/callback`
  - `https://*.vercel.app/auth/callback` (preview deploys)

**Authentication → Email Templates → Magic Link:** the default works.
Optionally customize subject/body. The `{{ .ConfirmationURL }}` token must
remain.

**Authentication → Providers:**
- Email: enabled (default)
- Disable email signup confirmation if you want magic links to skip the
  "confirm your email" step

**Authentication → SMTP (optional but recommended):** route via Resend so
deliverability matches your Resend setup. Otherwise Supabase sends from its
default address (3/hour limit).

### No storage buckets needed for Phase 2
Phase 3 adds buckets for listing photos / agent headshots. Leave Storage alone
for now.

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

## 3) Inngest

### Provision
- Sign up at https://www.inngest.com
- Create an app — **app ID must match `real-estate`** (the value in
  `lib/inngest/client.ts:12`)
- Generate keys under Manage → Event Keys + Manage → Signing Key

### Env vars produced
| Var | Source |
|---|---|
| `INNGEST_EVENT_KEY` | Inngest dashboard → Manage → Event Keys |
| `INNGEST_SIGNING_KEY` | Inngest dashboard → Manage → Signing Key |

### Where these are consumed
The `inngest` SDK reads these from `process.env` automatically — no direct
references in the code. The handler is at `app/api/inngest/route.ts`.

### Sync functions to Inngest
After Vercel deploy:
- Inngest dashboard → your app → Sync new app → enter
  `https://your-prod-domain.com/api/inngest`
- Inngest hits `PUT /api/inngest`, discovers the registered functions
  (the portal failsafes; there is no welcome series)
- Re-sync after every deploy that adds/changes functions

### Local dev
```bash
npx inngest-cli@latest dev
```
Auto-discovers `localhost:3000/api/inngest`. UI at `localhost:8288`.

### What runs there
Only the cron failsafes in `lib/inngest/functions.ts` (new lead untouched for
24h, qualified lead untouched for 5d, sphere 90d, birthdays, closing
anniversaries). They create portal tasks; they never email anyone.

---

## 4) Vercel

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
INNGEST_EVENT_KEY                 # from Inngest (mark as Secret)
INNGEST_SIGNING_KEY               # from Inngest (mark as Secret)
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
Settings → Domains → Add. Vercel auto-provisions SSL. Then loop back to
**Supabase Auth → URL Configuration** and update Site URL + redirect allowlist
to the prod domain.

---

## Order of operations

1. Provision Supabase → grab 4 env vars → run 3 migrations → seed `agents`
   row(s)
2. Provision Resend → verify domain → grab API key → pick from-address
3. Provision Inngest → create app `real-estate` → grab 2 keys
4. Connect repo to Vercel → paste all env vars (Production + Preview) → deploy
5. Set custom domain on Vercel → update Supabase Auth Site URL and redirect
   allowlist
6. Inngest dashboard → sync app to `https://your-domain.com/api/inngest`
7. Verify end-to-end:
   - `https://your-domain.com/` renders
   - `/contact` form submits → rows in `leads` and `contacts`, the Zap runs,
     one "New lead" email at `TEAM_NOTIFY_EMAIL`, visitor lands on
     `/thanks/contact`. No email to the visitor.
   - Tide box signup → `leads` row tagged `consent:email`, visitor lands on
     `/thanks/letter`
   - `/portal` redirects to `/auth/login` → magic link arrives → callback links
     auth user to agent → land on `/portal` Today view
   - `/portal/contacts` shows the test submissions
   - Inngest dashboard shows `welcome-series` runs in flight

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
