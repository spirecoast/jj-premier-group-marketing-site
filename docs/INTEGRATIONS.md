# Integration handoff

External services this app talks to, what env vars they produce, and where in
the codebase those vars are consumed. Use this when wiring up the platform in
Vercel + Supabase + Resend + Inngest.

- **Repo:** `spirecoast/real-estate`
- **Active dev branch:** `claude/clone-real-estate-repo-D0RgV`
- **Stack source of truth:** `ARCHITECTURE.md` §3 + `CLAUDE.md`
- **Locked stack — do not substitute:** Next.js 16 App Router, TypeScript
  strict, Tailwind v4, Supabase, Drizzle (postgres-js), Zod, Inngest, Resend,
  Vercel.

## Services to integrate now (Phase 1 + 2)

| # | Service | Free tier? | Purpose |
|---|---|---|---|
| 1 | **Supabase** | yes | Postgres + Auth + Storage + Realtime |
| 2 | **Resend** | yes (3K/mo) | Transactional email |
| 3 | **Inngest** | yes | Background jobs (welcome series + future failsafes) |
| 4 | **Vercel** | yes (hobby) | Hosting + preview deploys |

Future-phase services from §3 are listed at the bottom — **don't set up yet.**

---

## 1) Supabase

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

### Where these are consumed (file:line)
- `lib/supabase/server.ts:8-9` — server-side Supabase client
- `lib/supabase/browser.ts:5-6` — browser client
- `proxy.ts:8,18-19` — auth-refresh on every request
- `lib/db/index.ts:10` — Drizzle/postgres-js connection
- `drizzle.config.ts:8` — drizzle-kit migrate target
- `lib/env.ts:4-7` — Zod schema for env validation

### Apply schema migrations
Three migrations in `lib/db/migrations/`:
- `0000_init_contacts_events.sql` — `contacts` + `events` tables, RLS enabled (deny-by-default)
- `0001_agents_sequences_routing.sql` — `agents`, `sequences`,
  `sequence_enrollments`, `lead_routing_rules` + FKs from `contacts`/`events` →
  `agents`
- `0002_auth_policies.sql` — `is_active_agent()` SQL helper + SELECT/UPDATE
  policies for authenticated agents

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
- `lib/email/index.ts:7,36` — Resend client + from-address resolution
- `app/(marketing)/contact/actions.ts:122` — internal team notification
  recipient

### Verify
After deploy, submit the contact form. You should receive:
1. A confirmation email at the submitted address (from `RESEND_FROM_EMAIL`)
2. A "New lead: …" email at `TEAM_NOTIFY_EMAIL`

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
  (currently: `welcome-series`)
- Re-sync after every deploy that adds/changes functions

### Local dev
```bash
npx inngest-cli@latest dev
```
Auto-discovers `localhost:3000/api/inngest`. UI at `localhost:8288`.

### Trigger flow (for context, no action needed)
- `lead.captured` event fires from `app/(marketing)/contact/actions.ts` and
  `lib/actions/newsletter.ts`
- `welcome-series` function picks it up → 5 emails over 14 days, consent
  re-checked on every step

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
```

`UNSUBSCRIBE_SECRET` is the HMAC key used to sign marketing-email unsubscribe
links. **Required in production** — `lib/unsubscribe.ts` throws at boot if it's
missing or shorter than 32 chars when `NODE_ENV=production`.

`NEXT_PUBLIC_SITE_URL` is consumed in:
- `app/layout.tsx:19` (metadata base for OG tags)
- `app/auth/login/actions.ts:33` (magic link `emailRedirectTo`)
- `app/(marketing)/contact/actions.ts:123` (template links)

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
   - `/contact` form submits → row in `contacts`, event in `events`, two emails
     sent (lead confirmation + team notify), `lead.captured` event in Inngest
   - Footer newsletter signup → row in `contacts` with `consent_email=true`,
     confirmation email
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
