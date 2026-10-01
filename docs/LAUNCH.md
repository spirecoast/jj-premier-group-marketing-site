# Launch runbook — jjpremiergroup.com

An operator's runbook. Josh runs it top to bottom; sections 1, 3 and 7 need things from the agents or
the brokerage, and the table in section 8 says who does what and in which order.

Written 2026-10-01 against `origin/main` at `d14ebb8`. Everything stated as fact below was read from the
repo or checked live that day; anything marked **verify** could not be confirmed from here. Values you
must supply are written `<like-this>`. Nothing in this file is a real secret.

## 0. Where things are

| Thing | Value |
|---|---|
| Launch domain | `jjpremiergroup.com` (bare, no `www.`; `site.domain` in `lib/site.ts`) |
| DNS | Nameservers are Cloudflare (`mario.ns.cloudflare.com`, `shaz.ns.cloudflare.com`). No `A` or `CNAME` records exist for the apex or `www` today, so nothing is live at the domain yet. |
| Vercel project | `jj-premier-group-marketing-site` (team `spirecoasts`), Node 24, framework Next.js. Production alias `https://jj-premier-group-marketing-site.vercel.app`. |
| Repo | `spirecoast/real-estate`, branch `main`. The checkout also has a `marketing` remote (`spirecoast/jj-premier-group-marketing-site`) at the same commit. **Verify** in Vercel → Settings → Git which repository the project builds from before relying on "merge to `main` deploys". |
| Site URL resolution | `lib/site.ts`: `NEXT_PUBLIC_SITE_URL` if it is a valid absolute URL, else `https://` + `VERCEL_PROJECT_PRODUCTION_URL`, else `https://jjpremiergroup.com`. Canonicals, `og:url`, sitemap `<loc>`, `robots.txt` host and ICS UIDs all use it. |
| Index gate | `NEXT_PUBLIC_ROBOTS_NOINDEX=true` → `robots.txt` is `Disallow: /` (`app/robots.ts`) and every page gets `<meta name="robots" content="noindex, nofollow">` (`app/layout.tsx`). Any other value → allow all except `/portal /studio /api/ /auth /unsubscribe`, plus the sitemap line. |
| Redirects | `next.config.ts`: `/lakewood-ranch` → `/neighborhoods?market=lakewood-ranch`, `/lakewood-ranch/:slug` → `/neighborhoods/:slug`, `/relocate` → `/buy`, `/neighborhoods/lake-club` → `/neighborhoods/the-lake-club`. All permanent (308). |
| CRM | The Coldwell Banker Home Platform, reached through a Zapier Catch Hook. Env: `CRM_PROVIDER=webhook`, `CRM_WEBHOOK_URL`. Follow Up Boss code stays in the repo behind the provider switch and is not used. |
| Database | Supabase Postgres through Drizzle (`lib/db`). Leads are mirrored into the `contacts` and `events` tables (there is no table called `leads`). |
| Visitor email | The site never emails a visitor. The reply a visitor gets comes from the agent's own Coldwell Banker mailbox through a Zapier step. The team's internal "New lead" copy and the delivery alert go through Resend when it is configured. |
| Newsletters | Tide is monthly, Encore is weekly on Monday. Sent from the Home Platform's Marketing Center if it has one (section 1), otherwise a send tool is chosen later. The site only collects the address. |
| Brand marks | Coldwell Banker mark 185px in the header (`components/site-header.tsx`), 220px in the footer. No license numbers anywhere on the site: Florida 61J2-10.025 requires the brokerage name adjacent to the contact information, which the footer `<address>` block does. |

Code landing in the same wave that this runbook describes by intent, not by line: the webhook provider
(`CRM_PROVIDER`, `CRM_WEBHOOK_URL`), `NEXT_PUBLIC_BOOKING_URL`, and `scripts/test-lead.mjs`. Where the
exact payload key names matter (section 3) read the merged code or the Catch Hook sample, not this file.

## 1. Owned by the client or the brokerage

Nothing in this section is a code change. Each item says why it blocks or shapes launch and what "done"
looks like. Collect the answers in writing (email is fine) before section 6.

| # | Item | Why it matters | Verified when |
|---|---|---|---|
| 1.1 | **Office street address and zip** | `officeAddress.street` and `zip` are empty in `lib/content/seed/settings.ts`, so the footer shows "Lakewood Ranch, FL", the RealEstateAgent JSON-LD has no `streetAddress`, and the privacy page's contact block has no address. The Google Business Profile address must match these character for character. | The brokerage sends the registered office address for the team; it is put in `settings.ts` (street, zip, suite line exactly as the brokerage writes it) and deployed; the footer, `/contact`, `/privacy` and the JSON-LD on `/` all show the same string. |
| 1.2 | **Brokerage sign-off and the compliance contact** | `docs/handoff/COMPLIANCE.md` says nothing ships without the brokerage compliance contact's review. Specific points to put in front of them: the footer (brokerage name directly below the phone and emails, 61J2-10.025(3)(a)); the team name is not set larger than the brokerage name (61J2-10.026); the CB mark at 185px header / 220px footer and the Equal Housing mark; the decision to show **no license numbers** (lawful under 61J2, but Coldwell Banker Realty's own policy must be confirmed by the broker of record); the "draft for legal review" label on `/privacy` and `/terms` (comes off only when counsel signs); the consent wording (`CONSENT_WORDING` for calls/texts and `CONSENT_EMAIL_WORDING` for email, both in `lib/leads.ts`); both agents titled REALTOR® (requires current NAR membership). | A dated email from the compliance contact naming the preview URL and saying the footer, marks, no-license-number decision, privacy and terms are approved; the name and email of the contact recorded here: `<compliance contact>`. |
| 1.3 | **Home Platform: Zapier connection authorization** | Section 3 depends on the "Compass" app in Zapier accepting a Coldwell Banker Home Platform login. If it only accepts compass.com accounts, the Zap's CRM step must change (for example, to the Lead Flows address in 1.5). Also decide whose account the connection uses: the leads land in that agent's Contacts. | In Zapier → Apps → Connections, a "Compass" connection exists, signed in as `<agent who owns the leads>`, and a test lead created from the Zap editor appears in Home Platform Contacts. |
| 1.4 | **Home Platform: Marketing Center email** | Tide (monthly) and Encore (weekly Monday) are promised on the forms and the privacy page. If the Marketing Center can send to a list, subscribers are exported from Supabase `contacts` (`consent_email = true`) and imported there; if not, a send tool is chosen before the first promised issue. Either way the sends carry the office postal address, the brokerage name and a working unsubscribe (CAN-SPAM). | The agents confirm in the Home Platform whether Marketing Center exists for them, whether it sends to an imported list, and who will build the two templates. Decision recorded: `<Marketing Center | other tool>`; first send dates: `<Tide>` and `<Encore>`. |
| 1.5 | **Home Platform: lead-intake address** | A backup path if the Zapier action fails or is not authorised: the Home Platform's Lead Flows (CRM settings) may issue an email address that parses incoming leads. If it does, the team's "New lead" email can be forwarded there. | The agents open CRM settings → Lead Flows and report whether a forwarding address exists: `<address or "none">`. |
| 1.6 | **Home Platform: included website or listing product** | `NEXT_PUBLIC_LISTINGS_URL` is where "See our current listings" points until an MLS feed is licensed; empty hides the link. The Home Platform or Coldwell Banker may give each agent a listings page. There is no evidence of an embeddable IDX widget for external sites; assume none. | The team sends the URL of the page that shows their active listings: `<listing page URL>`. It opens without a login and shows the team's listings. |
| 1.7 | **Mailbox platform** | Decides which Zapier email app sends the reply in section 3. Checked 2026-10-01: `autodiscover.cbrealty.com` → `autodiscover.outlook.com`, so `cbrealty.com` is Microsoft 365 (Exchange Online) behind a Mimecast gateway, and its DMARC policy is `p=reject`. That means the reply must be sent by the **Microsoft Outlook** app in Zapier signed in as the agent; a generic SMTP step "from" a `cbrealty.com` address would be rejected. | The brokerage confirms that Zapier's Outlook app may be connected to agent mailboxes on their tenant (an admin may need to grant consent), and each agent connects her own mailbox in Zapier. |
| 1.8 | **Registrar and DNS access** | The domain's nameservers are Cloudflare. Section 6 adds records there. Someone must be able to log in to the Cloudflare account that holds `jjpremiergroup.com` (and the registrar, in case the nameservers ever need changing). | Josh can open the zone `jjpremiergroup.com` in Cloudflare and sees the DNS tab. Account owner recorded: `<owner>`. Registrar recorded: `<registrar>`. |
| 1.9 | **Current listing page URL** | Same value as 1.6, listed separately because the agents can answer it today without the brokerage. | `NEXT_PUBLIC_LISTINGS_URL` set in Vercel and the link on `/listings` opens it. |
| 1.10 | **Stellar MLS IDX request to the broker** | No MLS data or MLS wording may appear until an IDX licence exists; the licence needs the broker's signature and Stellar's approval and takes weeks. It does not block launch, but the clock starts only when the broker is asked. | The broker of record has the request in writing with a date; vendor or feed choice recorded: `<vendor | custom feed | not yet>`. |
| 1.11 | **Google Business Profile** | The client is creating it. Name, address and phone on the profile must match the footer and the JSON-LD exactly (same punctuation, same suite line). Its URL goes into `socialLinks` in `settings.ts` so it appears in `sameAs`. | The profile is verified by Google, its website field is `https://jjpremiergroup.com`, and its URL is recorded: `<GBP URL>`. |
| 1.12 | **Social URLs** | `socialLinks` is empty in `settings.ts`; the footer and `sameAs` show nothing until it is filled. | A list of live profile URLs the team actually maintains (Instagram, Facebook, LinkedIn, Zillow, RealSatisfied): `<urls>`. Each opens to the team's profile, not a login page. |
| 1.13 | **Trust-section facts** | Every factual claim on the site (years licensed, memberships, designations, markets served, the office) must come from the agents in writing; nothing is hand-typed from memory. The home page carries no figures by design. | For every fact the agents want stated, a one-line source (the DBPR record, the NAR card, the designation certificate) is on file; anything without one stays off the site. |
| 1.14 | **Client quotes** | `TESTIMONIALS` is empty. A quote goes live only through the Sanity `testimonial` document with `permissionOnFile` checked, so until Sanity is online there are none. | Written permission from each client is on file; the quote text, the client's first name and the date are recorded; they are entered when Sanity is live (`docs/SITE.md`, "Content: seed now, Sanity when ready"). |

## 2. Vercel production environment variables

Vercel → Project → Settings → Environment Variables. Names are exactly as in `.env.example`, plus the
three the same wave introduces. `NEXT_PUBLIC_*` values are inlined at build time: changing one needs a
redeploy (section 6.6). Set each variable's **Environment** to Production unless the table says otherwise.

What the project has today (names only, read through the Vercel API on 2026-10-01; values are hidden):
`NEXT_PUBLIC_MAPTILER_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`,
`UNSUBSCRIBE_SECRET`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_WRITE_TOKEN`, `SANITY_VIEWER_TOKEN`, `SANITY_REVALIDATE_SECRET`,
`FUB_API_KEY`, `FUB_SYSTEM`, `FUB_SYSTEM_KEY`, `FUB_LEAD_SOURCE`,
`LEAD_ALERT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ROBOTS_NOINDEX`, `CRON_SECRET`,
`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, all on both Production and Preview. Not present yet:
`TEAM_NOTIFY_EMAIL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_LISTINGS_URL`, `CRM_PROVIDER`,
`CRM_WEBHOOK_URL`, `NEXT_PUBLIC_BOOKING_URL`. Many of the existing ones are present with an empty value;
treat "present" as "has a row", not "is set".

**The one rule that cannot be broken:** in production `actions/submit-lead.ts` tells the visitor "We could
not send that just now" unless at least one of three sinks succeeded: the CRM accepted the lead,
`DATABASE_URL` mirrored it, or the team email was sent. Never launch with all three empty.

### Required for launch

| Variable | Value | What it does |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://jjpremiergroup.com` | Canonical origin for every absolute URL. With `https://`, no trailing slash, no `www`. |
| `CRM_PROVIDER` | `webhook` | Selects the Zapier webhook path for leads instead of Follow Up Boss. |
| `CRM_WEBHOOK_URL` | `<Zapier Catch Hook URL>` | Where every form submission is POSTed (section 3). Mark as Sensitive. |
| `DATABASE_URL` | `<Supabase transaction-pooler URL, port 6543>` | Mirrors every lead into `contacts` + `events` (section 4). The durable copy. Mark as Sensitive. |
| `TEAM_NOTIFY_EMAIL` | `<team inbox>` | The internal "New lead · <form> · <name>" email, reply-to set to the visitor. Needs the two Resend values below. |
| `LEAD_ALERT_EMAIL` | `<Josh's address>` (falls back to `TEAM_NOTIFY_EMAIL`) | Receives the "lead not delivered to the CRM" alert. Point it at the person who will fix the Zap, not the agents. |
| `RESEND_API_KEY` | `<Resend key>` | Sends the two internal emails above. Mark as Sensitive. |
| `RESEND_FROM_EMAIL` | `<address on a domain verified in Resend>` | The From of the internal emails. Verify the domain in Resend first or sends fail. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `jjpremiergroup.com` | Loads the Plausible script and the `Lead` / `Subscribe` events. Production only; leave it off Preview so previews never report into production analytics. |
| `NEXT_PUBLIC_MAPTILER_KEY` | already set | MapTiler tiles for Atlas. Add the launch domain as an allowed origin (section 5.6). |
| `NEXT_PUBLIC_LISTINGS_URL` | `<URL from 1.6>` | The "See our current listings" link on `/listings`. Empty hides the link. |
| `NEXT_PUBLIC_ROBOTS_NOINDEX` | **removed from Production** (or empty); `true` on Preview | The index gate. Section 6.5 flips it. |
| `CRON_SECRET` | already set | Bearer token for `GET /api/cron/archive-events`, which `vercel.json` runs every Monday 09:00 UTC. The job is a no-op until Sanity is live, but the route must stay protected. |

### Optional; set if the value exists, otherwise leave empty

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BOOKING_URL` | `<Cal.com or Calendly link>`. Shows a "book a time" link where the site offers one; empty hides it. **Verify** the exact placement in the merged code. |
| `UNSUBSCRIBE_SECRET` | `openssl rand -base64 48`. Read only by the public `/unsubscribe` page (`app/unsubscribe/page.tsx`), which signs and checks the links in marketing emails that nothing sends yet. Without it a stray hit renders the "invalid link" state rather than crashing (`verifyUnsubscribe` catches the throw). Set it anyway so the page works the day a send tool uses it. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | The public site's lead path reads only `DATABASE_URL`; these three are read by `lib/supabase/*` for the agent portal's Storage and Realtime work, which is not part of launch (nothing on `main` calls `lib/env.ts`). Fill them from the same Supabase project for completeness or leave empty. |
| `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | Harmless while `NEXT_PUBLIC_SANITY_PROJECT_ID` is empty (`production` and `2026-09-01` in `.env.example`). |
| `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS` | Leave empty. `true` would put the sample listings on the live site. |
| `NEXT_PUBLIC_PLAUSIBLE_HOST` | Leave empty (plausible.io). Only for a self-hosted instance. |

### Stay unset at launch

| Group | Variables | Why |
|---|---|---|
| Follow Up Boss | `FUB_API_KEY`, `FUB_SYSTEM`, `FUB_SYSTEM_KEY`, `FUB_LEAD_SOURCE` | The CRM is the Home Platform. With `CRM_PROVIDER=webhook` these are ignored. The pixel is gone from the site; `NEXT_PUBLIC_FUB_PIXEL_ID` can be deleted. |
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | The agent portal is not launching. `app/layout.tsx` wraps the tree in `ClerkProvider` only when the publishable key is set; keep it unset so the public site has no Clerk dependency. `/portal` answers 307 to `/auth/no-access`. |
| Sanity | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_WRITE_TOKEN`, `SANITY_VIEWER_TOKEN`, `SANITY_REVALIDATE_SECRET` | Empty project id = the site renders the seed content in `lib/content/seed`. Bringing Sanity online is its own task in `docs/SITE.md`. |
| Inngest | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Nothing on the public site sends Inngest events. `lib/inngest/functions.ts` still holds a latent visitor-facing welcome series that would send through Resend; nothing enqueues it and with the keys unset it can never fire, which keeps the "the site never emails visitors" promise true. |
| Stale | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Exists in the Vercel project; no code reads it and the site uses Plausible. Delete the row. |

## 3. Zapier

One Zap: **Catch Hook → Filter → Compass "Create a New Lead" → Microsoft Outlook "Send Email"**. Build it
in the agents' Zapier account (or a team workspace they own), not Josh's personal one, so it survives the
handoff. Expect to need a paid Zapier plan: Webhooks by Zapier is a premium app and a Zap with a filter
and two actions is a multi-step Zap, neither of which the free tier allows (**verify** against Zapier's
current plan page before buying; the lowest paid tier's monthly task limit is far more than a two-agent
team's web leads). Each submission uses one task per step that runs.

### 3.1 Trigger: Webhooks by Zapier → Catch Hook

1. New Zap → Trigger: **Webhooks by Zapier** → event **Catch Hook**. Leave "Pick off a child key" empty.
2. Copy the hook URL. Put it in Vercel as `CRM_WEBHOOK_URL` (Preview first, Production at cutover).
3. Send a sample so the editor learns the field names. Use `scripts/test-lead.mjs` (section 3.6), or
   submit the contact form on the preview once `CRM_PROVIDER=webhook` and `CRM_WEBHOOK_URL` are set there.
4. In the trigger's "Test" step pick the sample. Every later step maps from it.

### 3.2 What the payload contains

The site sends one JSON object per submission, built in `lib/lead-pipeline.ts` and sent by
`lib/crm.ts`; the full sample and the Zapier field map are in `docs/INTEGRATIONS.md` ("Lead delivery").
The Filter step in 3.3 keys on the top-level `form`. Expect:

| Field | Source | Notes |
|---|---|---|
| form | hidden `form` input | One of `contact`, `buy`, `sell`, `listing`, `valuation`, `letter`, `calendar`. |
| firstName, lastName | name fields | "Jane Doe" typed in the first box is split. `letter` and `calendar` have no name (empty strings). |
| email | required on every form | Lower-cased. |
| phone | optional | As typed; not normalised. `null` when empty. |
| message, timing, sellFirst, market, propertyAddress | optional | `market` is one of `lakewood-ranch`, `sarasota`, `bradenton`; `sellFirst` is the buy form's "Is there a house to sell first?" answer; `propertyAddress` the valuation/sell address. |
| property (slug, title, street, city, state, zip, price, mls, url) | `listing` form only | `null` otherwise. |
| consent (email, sms, timestamp, wordingVersion) | the two unchecked-by-default boxes | `letter`/`calendar` imply `email: true` with `wordingVersion` `implied:subscribe`; otherwise `wordingVersion` is `CONSENT_WORDING_VERSION` in `lib/leads.ts`. |
| source (page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, landingPath, firstTouchReferrer, firstTouchAt) | the page URL, the Referer header and the 90-day first touch from `components/utm-tracker.tsx` | Absent values are `null`, never missing. |
| submittedAt | the server clock | ISO timestamp. |
| tags | built by the pipeline | `form:<form>`; `market:<market>` when set; `consent:email` and `consent:sms` when given; `source:<utm_source or direct>`; `site:jjpremiergroup`; `test` on rehearsal leads. |
| site, test | constants | `jjpremiergroup.com`; `test` is `true` only from `scripts/test-lead.mjs`. |

### 3.3 Filter by form kind

Add **Filter by Zapier** after the trigger. Two sensible rules; pick one and write it down:

- Everything becomes a CRM contact (recommended: the newsletter and calendar addresses are leads too).
  Then the filter protects only the email step: add it **before the Outlook step** with
  `form` **(Text) Does not exactly match** `letter` AND `form` **(Text) Does not exactly match** `calendar`,
  so subscribers do not get a "thanks for your enquiry" reply. If subscribers should get a short
  confirmation of their own, use **Paths by Zapier** instead: Path A (`form` is `letter` or `calendar`)
  → subscriber template; Path B (everything else) → enquiry template.
- Only enquiries reach the CRM: put the same filter directly after the trigger and route `letter`
  and `calendar` to a Google Sheet or to the Supabase mirror only. Subscribers are then in Supabase
  only (section 4.5), which is also where the Marketing Center import comes from.

A honeypot submission never reaches the webhook (the action returns a fake success before sending), so
no bot filter is needed here. Add a Filter on `test` **(Boolean) Is false** before the CRM step if
rehearsal leads from `scripts/test-lead.mjs` should stay out of the Home Platform.

### 3.4 Action: Compass → Create a New Lead

The Compass app in Zapier lists one action, **Create a New Lead**, with the fields First Name, Last Name,
Email, Phone and Tags (per the app listing; **verify** in the editor once the connection from 1.3 exists).
Map:

| Compass field | From the hook |
|---|---|
| First Name | `firstName` (for `letter`/`calendar` leave empty or use the text `Subscriber`; decide once) |
| Last Name | `lastName` |
| Email | `email` |
| Phone | `phone` |
| Tags | `tags` (the array; if the field wants a comma-separated string, use the Formatter → Utilities → Line-item to text step on `tags` with `,` as the separator) |

Nothing else in the payload fits the Compass action. The message, timing, address to value, property,
consent timestamp and UTM reach the agents through the team email (`TEAM_NOTIFY_EMAIL`) and the Supabase
row. If the agents want them in the CRM, they paste from the email into the contact's notes.

Test the step from the editor: the sample lead appears in Home Platform → Contacts with the tags.
Delete it afterwards or tag it `test` so it never enters a drip.

### 3.5 Action: Microsoft Outlook → Send Email (from the agent's mailbox)

Because `cbrealty.com` is Microsoft 365 with DMARC `p=reject` (1.7), use the **Microsoft Outlook** app
signed in as the agent whose name goes on the reply, never an SMTP "send as". (If the brokerage turns
out to use Google Workspace for some mailboxes, the equivalent is the **Gmail** app's Send Email,
signed in the same way.)

| Field | Value |
|---|---|
| To | `email` from the hook |
| Subject | `Thanks for reaching out, {{firstName}}` (fall back to a fixed subject when `firstName` is empty) |
| Body type | Plain text or simple HTML; no images, no tracking links |
| Body | the template below |
| Reply To | the same agent mailbox (default) |

Reply template, to be finished by the agents and read by the compliance contact (1.2) before the Zap is
turned on. It is a transactional reply to a person who just wrote in, so it needs no unsubscribe, but the
brokerage name must appear next to the contact details:

```
Hi <first name>,

Thanks for getting in touch through jjpremiergroup.com. <One sentence that acknowledges what
they sent: the home they asked about, the valuation address, or their question.>

<Which agent will call or write back, and when. Keep it to a working day.>

<Agent name>, REALTOR®
JJ Premier Group · Coldwell Banker Realty
<office address from 1.1>
<direct line> · <agent email>
```

Use **Formatter → Text → Default value** on `firstName` so an empty name reads "there" rather than a
blank. Test the step: the email arrives in a test inbox from the agent's address, passes DMARC (view
the message headers: `dmarc=pass`), and reads correctly on a phone.

### 3.6 Test with `scripts/test-lead.mjs`

The script posts one fully populated sample lead (every field in 3.2, `form` selectable, tags included,
`test: true`, a test address at `jjpremiergroup.com`, a "TEST LEAD" message). Two modes:

```bash
# Straight to the Catch Hook, so the Zap editor has a complete sample and the whole Zap can be
# exercised without touching a live form:
CRM_WEBHOOK_URL="<Zapier Catch Hook URL>" node scripts/test-lead.mjs --hook --form buy

# Through the site itself (POST /api/leads → the same pipeline as the forms), which also prints
# which sinks accepted the lead (Postgres, CRM, team email, Plausible):
node scripts/test-lead.mjs --port 3000 --form buy                                     # local dev
LEAD_TEST_SECRET=… node scripts/test-lead.mjs --live https://<preview or prod host> --form buy
```

Then: Zap History shows the run with every step green; Home Platform shows the contact with the tags;
the test inbox has the reply from the agent's mailbox. Repeat once with `--form letter` to confirm the
filter in 3.3 skips the email step. Delete the test contacts from the CRM.

Turn the Zap **on** only when 1.3 and 1.7 are done and the preview's end-to-end check (5.4) has passed.

## 4. Supabase

### 4.1 Create the project

Supabase dashboard → New project. Region `us-east-1` (nearest to Florida). Save the database password in
the team's password manager; it cannot be shown again, only reset.

### 4.2 Collect the connection string

Settings → Database → Connection string → **Transaction pooler** (port `6543`). URL-encode the password if
it contains `@`, `:`, `/` or `%`. This is `DATABASE_URL`. `lib/db/index.ts` opens it with `prepare: false`,
which the transaction pooler requires, so do not swap in the session pooler.

The three dashboard values for the optional variables in section 2: Settings → API → Project URL
(`NEXT_PUBLIC_SUPABASE_URL`), `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), `service_role` key
(`SUPABASE_SERVICE_ROLE_KEY`).

### 4.3 Run the migrations

From a checkout of `main` with dependencies installed. `drizzle.config.ts` reads `DATABASE_URL` and
applies `lib/db/migrations/0000` through `0005` in order (contacts and events, agents and routing,
auth policies, tasks and scoring, personal context, Clerk auth). Migrations are immutable; a schema
change is a new file.

```bash
cd <checkout of spirecoast/real-estate>
npm ci
DATABASE_URL="<transaction pooler URL>" npm run db:migrate
```

If the shell cannot reach port 6543 (some office networks block it), paste each `.sql` file into
Supabase → SQL Editor in filename order instead. That fallback skips drizzle's own migrations table
(`drizzle.__drizzle_migrations`), so a later `npm run db:migrate` would try to run `0000` again and fail
on the existing tables; if the SQL Editor path is used, every future migration must be applied the same
way, or the journal rows must be inserted by hand first. Prefer `db:migrate` from a network that can reach
the pooler.

### 4.4 Confirm the tables

The lead mirror writes to `contacts` and `events`; there is no `leads` table. In SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by 1;
-- expect: agents, contacts, events, lead_routing_rules, sequence_enrollments, sequences, tasks, ...

select count(*) from contacts;   -- 0 before the first test lead
```

Row-level security is on and deny-by-default (`0000`, `0002`); the site writes through the `postgres`
role in `DATABASE_URL`, which bypasses RLS, so no policy work is needed for the mirror.

### 4.5 Where to see leads

- Supabase → Table Editor → `contacts`, sorted by `created_at` descending. Each lead is one row with
  `source` (`website` or the UTM source), `source_detail` (`<form>_form`), `consent_sms`,
  `consent_sms_at`, `consent_email` (true for `letter` and `calendar`), and the UTM JSON.
- The matching `events` row (`event_type = 'form_submit'`) holds the message, the property, the
  consent timestamp and the page URL in `payload`.
- Daily check query (section 7.4):

```sql
select created_at, source_detail, full_name, email, phone, consent_sms, consent_email
from contacts
where created_at > now() - interval '7 days'
order by created_at desc;
```

- Subscriber export for the Marketing Center (1.4): `select email, created_at from contacts where
  consent_email and not coalesce(unsubscribed_email, false)` → Download CSV.

`/portal/contacts` shows the same rows but needs Clerk, which stays unset at launch.

## 5. Pre-cutover checks on the preview

Run against `P=https://jj-premier-group-marketing-site.vercel.app` after the wave's code is merged and
the Preview environment has `CRM_PROVIDER`, `CRM_WEBHOOK_URL` (a test Zap or the real one, off) and
`DATABASE_URL` set. Results recorded on 2026-10-01 are given so a change stands out.

```bash
P=https://jj-premier-group-marketing-site.vercel.app
```

### 5.1 robots and meta robots (pre-launch state)

```bash
curl -sS $P/robots.txt
# 2026-10-01:  User-Agent: *   /   Disallow: /          (NEXT_PUBLIC_ROBOTS_NOINDEX=true on the preview)

curl -sS $P/ | grep -o '<meta name="robots"[^>]*>'
# 2026-10-01:  <meta name="robots" content="noindex, nofollow"/>
```

Both must still say "no" until section 6.5. If the preview ever answers `allow`, stop and find out who
changed the variable.

### 5.2 Canonicals and share image

```bash
curl -sS $P/ | grep -o '<link rel="canonical"[^>]*>\|<meta property="og:url"[^>]*>\|<meta property="og:image"[^>]*>'
# 2026-10-01: all three resolve to https://jj-premier-group-marketing-site.vercel.app (NEXT_PUBLIC_SITE_URL is empty on the preview)
```

That is correct for the preview and wrong for production; 6.5 sets `NEXT_PUBLIC_SITE_URL`. Open the
`og:image` URL in a browser: it must be the home-page card with the team photograph and the lockup, 1200×630.
Check one neighborhood page and one calendar page too (`/neighborhoods/the-lake-club`, `/calendar`): each
has its own generated card. Paste the preview URL into a share debugger (LinkedIn Post Inspector or
opengraph.xyz) and confirm the card renders; the preview's `noindex` does not stop that.

### 5.3 Redirects and 404

```bash
for p in /lakewood-ranch /relocate /neighborhoods/lake-club; do
  curl -sS -o /dev/null -w "$p -> %{http_code} %{redirect_url}\n" $P$p
done
# 2026-10-01: 308 to /neighborhoods?market=lakewood-ranch, /buy, /neighborhoods/the-lake-club

curl -sS -o /dev/null -w '%{http_code}\n' $P/this-does-not-exist
# 2026-10-01: 404 (the branded not-found page)
```

`/lakewood-ranch/<slug>` forwards to `/neighborhoods/<slug>`; try the two or three slugs that were linked
from the old placeholder site and make sure each one exists in the dataset, otherwise it lands on 404.

### 5.4 Forms end to end

With the Zap on (pointing at the test connection) and a test inbox: submit each of the seven forms on
the preview with a distinctive name (`Test <form> <date>`) and the test email. Forms and where they
live: `contact` (`/contact`), `buy` (`/buy`), `sell` (`/sell`), `valuation` (`/valuation`, address required),
`listing` (a listing page, only visible with `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`, so skip unless a real
listing exists), `letter` (the Tide box), `calendar` (the Encore box). For each:

1. The browser lands on `/thanks/<form>` (no "We could not send that just now"); the page shows both
   direct numbers and, when `NEXT_PUBLIC_BOOKING_URL` is set, the "Book 15 minutes" link.
2. Zap History has one run, every step green (or the email step skipped by the filter for `letter`/`calendar`).
3. Home Platform Contacts has the test contact with tags `form:<form>`, `source:direct` and `site:jjpremiergroup`
   (plus `market:<market>` when the form carried one).
4. Supabase `leads` has the row with `delivery_status = delivered` and a `lead_deliveries` row per sink;
   `contacts` has the row, `events` has the `form_submit` row.
5. `TEAM_NOTIFY_EMAIL` received "New lead · <form> · Test …" with reply-to set to the test address.
6. The test inbox received the agent's reply (not for `letter`/`calendar`).

Submit `contact` once more with both consent boxes **checked**: tags `consent:email` and `consent:sms`,
`leads.consent_at` and `contacts.consent_sms_at` set.
Submit once with the honeypot filled (in the browser console set `document.querySelector('input[name=website]').value='x'`
before submitting): the page thanks you, nothing arrives anywhere.

Then delete the test contacts from Home Platform and Supabase (`delete from contacts where email = '<test address>'`;
`events` rows cascade).

### 5.5 Headers

```bash
curl -sSI $P/ | grep -i 'strict-transport\|x-vercel-cache\|content-type'
# 2026-10-01: strict-transport-security: max-age=63072000; includeSubDomains; preload · x-vercel-cache: HIT
```

### 5.6 Map tiles with the new domain allowed

MapTiler Cloud → API keys → the key in `NEXT_PUBLIC_MAPTILER_KEY` → **Allowed HTTP origins**. Add
`https://jjpremiergroup.com` and `https://www.jjpremiergroup.com`, and keep
`https://jj-premier-group-marketing-site.vercel.app` plus `https://*.vercel.app` if previews should keep
their tiles. Save. Nothing to check until the domain resolves (6.7); until then the preview's `/neighborhoods`
must still draw tiles (open it; linen land, harbor water, no grey squares, no 403 in the Network tab).

## 6. Cutover

Do it on a weekday morning Eastern time with an hour clear afterwards. Steps in this order.

### 6.1 Tag the commit and confirm the production deployment

```bash
git -C <checkout> fetch origin
git -C <checkout> log --oneline -1 origin/main
git -C <checkout> tag -a launch-<yyyy-mm-dd> -m "jjpremiergroup.com cutover" origin/main
git -C <checkout> push origin launch-<yyyy-mm-dd>
```

Vercel → Deployments: the current Production deployment is READY and was built from that commit.

### 6.2 Add the domains in Vercel

Vercel → Project → Settings → Domains → **Add**:

1. `jjpremiergroup.com` → assign to Production.
2. `www.jjpremiergroup.com` → choose **Redirect to `jjpremiergroup.com`** (308). The bare domain is the
   canonical form everywhere in the code.

Vercel shows the DNS records it wants for each. Copy them from that screen; the documented defaults at the
time of writing are an `A` record on the apex to `76.76.21.21` and a `CNAME` on `www` to
`cname.vercel-dns.com`, but the dashboard wins if it shows something else.

### 6.3 DNS records in Cloudflare

Cloudflare → `jjpremiergroup.com` → DNS → Records. There are no web records today, so nothing to remove;
note that fact (it is also the rollback: delete these two and the domain is back to nothing).

| Type | Name | Content | Proxy status | TTL |
|---|---|---|---|---|
| A | `@` | `<IP from the Vercel Domains screen>` | **DNS only** (grey cloud) | Auto |
| CNAME | `www` | `<target from the Vercel Domains screen>` | **DNS only** (grey cloud) | Auto |

DNS only matters: Vercel issues and renews the certificate itself and the proxied (orange) mode would put
Cloudflare's certificate and redirect rules in front of it. Cloudflare's Auto TTL is 300 seconds, which is
already short enough for a quick change; no need to lower it in advance. If any `AAAA` or a Cloudflare
"Always Use HTTPS" page rule exists, remove it.

Remove any conflicting `CAA` record, or add one that allows `letsencrypt.org` if the zone restricts
issuers; Vercel's domain screen reports "CAA" problems explicitly.

### 6.4 Wait for the domain to verify and the certificate to issue

Back in Vercel → Domains, both rows turn to "Valid Configuration" within minutes of the records
propagating. Check from the shell:

```bash
node -e 'require("dns").promises.resolve4("jjpremiergroup.com").then(console.log)'
curl -sSI https://jjpremiergroup.com/ | head -1
# HTTP/2 200
openssl s_client -connect jjpremiergroup.com:443 -servername jjpremiergroup.com </dev/null 2>/dev/null \
  | openssl x509 -noout -issuer -dates
# issuer=C = US, O = Let's Encrypt, ...   notAfter about 90 days out
```

Until the certificate exists, `curl` reports a TLS error; wait, do not touch the records.

### 6.5 Set the production variables

From the moment 6.4 completes until the redeploy in 6.6 is READY, the live domain serves the current
production build: canonicals and `og:url` still point at the vercel.app host and there is no CRM webhook.
That is acceptable only because `noindex` is still on; keep the gap short by having 6.5 typed up and
ready before 6.3, and do 6.5 and 6.6 in one sitting.

Settings → Environment Variables, Production only:

1. `NEXT_PUBLIC_SITE_URL` = `https://jjpremiergroup.com`.
2. `NEXT_PUBLIC_ROBOTS_NOINDEX`: **edit the row** so Production is unchecked (or set the Production value
   to empty). Keep `true` on Preview.
3. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = `jjpremiergroup.com`.
4. `CRM_PROVIDER` = `webhook`, `CRM_WEBHOOK_URL` = the live Zap's hook (the Zap is on).
5. Everything else in section 2 "Required" is already set from the preview work; re-read the list once.

### 6.6 Redeploy

`NEXT_PUBLIC_*` values are baked at build time, so: Deployments → the current Production deployment →
**Redeploy** → untick "Use existing Build Cache" → Redeploy. Wait for READY (about the length of a normal
build; the neighborhood index and the static pages are generated here).

### 6.7 Verification

```bash
D=https://jjpremiergroup.com

curl -sS $D/robots.txt
# User-Agent: *  Allow: /  Disallow: /portal /studio /api/ /auth /unsubscribe
# Sitemap: https://jjpremiergroup.com/sitemap.xml   Host: https://jjpremiergroup.com

curl -sS $D/ | grep -o '<meta name="robots"[^>]*>\|<link rel="canonical"[^>]*>\|<meta property="og:url"[^>]*>\|<meta property="og:image"[^>]*>'
# robots: index, follow · canonical, og:url and og:image all start with https://jjpremiergroup.com

curl -sS $D/sitemap.xml | grep -c 'vercel.app'
# 0
curl -sS $D/sitemap.xml | grep -c '<loc>https://jjpremiergroup.com/'
# about 1,500 (the preview answered 1,503 on 2026-10-01: static pages + neighborhoods + events + venues + posts)

curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://jjpremiergroup.com/
# 308 https://jjpremiergroup.com/
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.jjpremiergroup.com/
# 308 https://jjpremiergroup.com/

for p in /lakewood-ranch /relocate /neighborhoods/lake-club; do
  curl -sS -o /dev/null -w "$p -> %{http_code} %{redirect_url}\n" $D$p
done
# 308 to the destinations in section 5.3, on the new host

curl -sS -o /dev/null -w '%{http_code}\n' $D/this-does-not-exist
# 404

curl -sS $D/api/calendar.ics | head -4
# BEGIN:VCALENDAR / VERSION:2.0 / PRODID / ...

curl -sSI $D/ | grep -i 'strict-transport-security'
# max-age=63072000; includeSubDomains; preload

curl -sS $D/ | grep -o 'data-domain="[^"]*"'
# data-domain="jjpremiergroup.com"

curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' $D/portal
# 307 https://jjpremiergroup.com/auth/no-access
```

Any line that differs: do not continue; fix the variable or the record and redeploy.

### 6.8 Smoke list (in a browser, phone and desktop)

- `/` loads with the hero photograph and the cameo; no mixed-content warning; the padlock shows a Vercel-issued certificate.
- Header: Coldwell Banker mark visible at desktop width; the phone menu opens and closes.
- `/neighborhoods`: tiles draw (the MapTiler origin from 5.6 is working; no 403 in the Network tab), search finds "Lake Club", a detail page opens.
- `/calendar`: today's view, Week and Month render; "+ Cal" on one event downloads an `.ics`.
- `/blog`, `/about`, `/buy`, `/sell`, `/valuation`, `/contact`, `/privacy`, `/terms`: 200, one `h1`, footer shows the brokerage name under the phone and emails, the office address from 1.1, the Equal Housing and CB marks.
- Footer "Editor" link: `/studio` says Sanity is not configured; acceptable, it is disallowed in robots.
- Share the home URL in a chat app: the card shows the team photograph.

### 6.9 One real test lead

Submit `/contact` as yourself with a real phone number and the consent box unchecked. Within a few
minutes: the Zap run is green, the contact is in Home Platform, the Supabase row exists, the team inbox
has the copy, your inbox has the reply from the agent's mailbox and it passed DMARC. Then have one agent
reply to you from inside Home Platform, so the whole loop has been exercised by a person. Delete or tag
the test contact.

### 6.10 Plausible live check

Plausible → the `jjpremiergroup.com` site → Realtime. Your own visits from 6.8 show up. Goals →
add **Lead** and **Subscribe** as custom events if not already there (property `form`). The test lead in 6.9
appears as one `Lead` goal with `form = contact`.

### 6.11 Uptime monitor

In UptimeRobot, Better Stack or the monitor the team already pays for: two HTTPS monitors, interval
5 minutes, alerts to Josh by email and to one agent by SMS.

| Monitor | URL | Check |
|---|---|---|
| Home | `https://jjpremiergroup.com/` | status 200 and the keyword `JJ Premier Group` in the body |
| Sitemap | `https://jjpremiergroup.com/sitemap.xml` | status 200 and the keyword `<urlset` |

### 6.12 Rollback plan

Three layers, fastest first:

1. **Bad deployment** (something broke in the build): Vercel → Deployments → the previous READY
   production deployment → **Promote to Production**. Instant; no DNS change.
2. **Indexing must stop** (compliance pulls approval, content is wrong): set
   `NEXT_PUBLIC_ROBOTS_NOINDEX=true` on Production and redeploy (6.6). The site stays up, every page
   says `noindex` again and `robots.txt` disallows all. Search engines drop it within days.
3. **Domain must go dark**: delete the `A` and `CNAME` records in Cloudflare (6.3). Within the 300-second
   TTL the domain resolves to nothing, as it did before launch. Leave the Vercel domain rows in place
   so re-adding the records brings it straight back.

The Zap can be turned off independently; leads then still land in Supabase and the team inbox. The
provider treats any non-2xx from the Catch Hook as a failure (one retry, then an alert to
`LEAD_ALERT_EMAIL` per lead and `delivery_status = failed` on the row); whether a paused Zap's hook answers
2xx or not is Zapier's choice (**verify** by turning the Zap off and submitting one test lead on the
preview); until that is known, check Zap History by hand each morning.

## 7. First week

### 7.1 Search Console and Bing

1. Google Search Console → Add property → **Domain** property `jjpremiergroup.com` → verify with the
   TXT record Google shows, added in Cloudflare (DNS only is irrelevant for TXT). This one property
   covers http, https and www.
2. Sitemaps → submit `https://jjpremiergroup.com/sitemap.xml`. Status "Success" within a day.
3. URL inspection → `https://jjpremiergroup.com/` → Request indexing. Do the same for `/neighborhoods`
   and `/calendar`.
4. Bing Webmaster Tools → Add site → **Import from Google Search Console**. Submit the same sitemap.
5. Day 5 or so: Search Console → Pages: pages with `noindex` should be only `/neighborhoods/<county-registry slugs>`
   (by design) and nothing on the sitemap.

### 7.2 Google Business Profile

- Website field: `https://jjpremiergroup.com/?utm_source=google&utm_medium=gbp` so GBP clicks show up as
  a source in Plausible and ride into the CRM as `campaign` fields.
- Name, address, phone exactly as the footer (1.1, 1.11). Primary category: Real estate agent.
- Once verified, add its URL to `socialLinks` in `lib/content/seed/settings.ts` (a small PR and a deploy)
  so it appears in `sameAs`.

### 7.3 404 review

- Vercel → Project → Logs (or Observability), filter status `404`, production, last 7 days. Ignore
  bot noise (`/wp-admin`, `/.env`, `/xmlrpc.php`); list anything that looks like a real page from the
  old site or a mistyped link in an email or on GBP.
- Search Console → Pages → "Not found (404)" after a few days.
- For each real one: add a redirect to `next.config.ts` (same pattern as the four that exist) in a PR.

### 7.4 Daily lead check (five minutes, every morning)

1. Zapier → Zap History, last 24 hours: every run green. A run with an error or a "held" state is a lead
   that did not reach the CRM; replay it from Zap History once the cause is fixed.
2. Supabase → SQL Editor → the seven-day query in 4.5. The row count for the last day equals the number of
   green Zap runs equals the number of "New lead" emails in the team inbox. Any difference is a missing
   lead; the Supabase row has everything needed to enter it by hand.
3. `LEAD_ALERT_EMAIL` inbox: empty is the goal. Every alert names the lead and the reason.
4. Ask the agents: did every lead get a reply within the window promised in the template (3.5)?

### 7.5 Spam watch

The forms have a honeypot and nothing else. Signs of trouble: rows in `contacts` with gibberish names,
URLs in the message, the same email several times a day, or Zap runs climbing without matching real
enquiries. If that starts: add a Zapier filter on the obvious patterns (message contains `http`) as a
stopgap the same day, and open an issue to add Cloudflare Turnstile to `components/lead-form.tsx`
(a code change). Do not switch on Vercel's Attack Challenge Mode for this; it challenges every visitor.

## 8. Who does what, in order

| Order | Who | What | Runbook section |
|---|---|---|---|
| 1 | Agents | Send the social URLs, the listing page URL, the facts and sources for anything stated on the site, any client quotes with permission | 1.6, 1.9, 1.12, 1.13, 1.14 |
| 2 | Brokerage | Confirm the office address, the mailbox platform and Zapier/Outlook permission, the no-license-number policy; name the compliance contact; receive the Stellar IDX request | 1.1, 1.2, 1.7, 1.10 |
| 3 | Agents | In Home Platform: authorise the Compass app in Zapier, check Lead Flows, check Marketing Center; connect each Outlook mailbox in Zapier; finish the reply template | 1.3, 1.4, 1.5, 3.5 |
| 4 | Josh | Create the Supabase project, run migrations, confirm tables | 4 |
| 5 | Josh | Build the Zap with the agents' account, run the test script, keep the Zap off | 3 |
| 6 | Josh | Set the Preview variables, run every pre-cutover check, including the seven forms end to end | 2, 5 |
| 7 | Compliance contact | Written sign-off on the preview (footer, marks, privacy, terms, reply template, no license numbers) | 1.2 |
| 8 | Josh | Cutover: tag, domains, DNS, certificate, variables, redeploy, verification, smoke, uptime, rollback plan on hand | 6.1 to 6.12 |
| 9 | Josh, then one agent | The real test lead and the human reply from inside Home Platform | 6.9 |
| 10 | Josh | Search Console, Bing, sitemap submissions | 7.1 |
| 11 | Agents | Google Business Profile website field and NAP; send the GBP URL | 7.2, 1.11 |
| 12 | Josh | Daily lead check and 404 review for the first week; hand the daily check to the agents at the end of it | 7.3, 7.4, 7.5 |
| 13 | Agents | First Tide (monthly) and Encore (weekly Monday) sends from the chosen tool, with the subscriber export from Supabase | 1.4, 4.5 |
