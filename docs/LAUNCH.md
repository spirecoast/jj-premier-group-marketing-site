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
| Index gate | `NEXT_PUBLIC_ROBOTS_NOINDEX=true` → `robots.txt` is `Disallow: /` (`app/robots.ts`) and every page gets `<meta name="robots" content="noindex, nofollow">` (`app/layout.tsx`). Any other value → allow all except `/studio /api/ /unsubscribe /subscribe/ /thanks/ /q/`, plus the sitemap line. |
| Redirects | `next.config.ts`: `/lakewood-ranch/:slug` → `/neighborhoods/:slug` (except the hub's own `opengraph-image` route), `/neighborhoods/lake-club` → `/neighborhoods/the-lake-club`. All permanent (308). `/lakewood-ranch` itself is the market hub (`app/(site)/lakewood-ranch`), alongside `/sarasota` and `/bradenton`; it no longer redirects. `/relocate` is the relocation planner and no longer redirects to `/buy`. |
| CRM | The Coldwell Banker Home Platform. Its Lead Flows pixel (client id `bsw9jbac2nu2`) is on every production page and sends each form from the browser (`lib/home-platform.ts`); the "Pixel" lead flow makes each one a contact in Jessica Garza's account, with name, email and phone only. The message, timing, address and consent reach the agents in the "New lead" email, which also names the leads to add by hand (privacy signals, a blocked script, the person a referral names). A Zapier Catch Hook can add those instead (section 3). Env: `CRM_PROVIDER=none` until there's a Zap, then `CRM_PROVIDER=webhook` and `CRM_WEBHOOK_URL`. Follow Up Boss code stays in the repo behind the provider switch and is not used. |
| Database | Supabase Postgres through Drizzle (`lib/db`). Leads are mirrored into the `contacts` and `events` tables (there is no table called `leads`). |
| Visitor email | The reply a visitor gets comes from the agent's own Coldwell Banker mailbox through a Zapier step. The only email the site itself sends a visitor is the newsletter confirmation (double opt-in) and, once they confirm, the welcome and the newsletters (next row). The team's internal "New lead" copy and the delivery alert go through Resend when it is configured. |
| Newsletters | Tide is monthly (sent the 3rd), Encore is weekly on Monday. The site sends both itself through Resend, from `letters@mail.jjpremiergroup.com`, to the people who subscribed and confirmed (decision 1.4; `docs/ISSUES.md`). |
| Brand marks | Coldwell Banker mark 185px in the header (`components/site-header.tsx`), 220px in the footer. No license numbers anywhere on the site: Florida 61J2-10.025 requires the brokerage name adjacent to the contact information, which the footer `<address>` block does. |

Code landing in the same wave that this runbook describes by intent, not by line: the webhook provider
(`CRM_PROVIDER`, `CRM_WEBHOOK_URL`), `NEXT_PUBLIC_BOOKING_URL`, and `scripts/test-lead.mjs`. Where the
exact payload key names matter (section 3) read the merged code or the Catch Hook sample, not this file.

## 1. Owned by the client or the brokerage

Nothing in this section is a code change. Each item says why it blocks or shapes launch and what "done"
looks like. Collect the answers in writing (email is fine) before section 6.

| # | Item | Why it matters | Verified when |
|---|---|---|---|
| 1.1 | **Office street address and zip** | `officeAddress.street` and `zip` are empty in `lib/content/seed/settings.ts`, so the footer shows "Lakewood Ranch, FL", the RealEstateAgent JSON-LD has no `streetAddress`, and the privacy page's contact block has no address. The Google Business Profile address must match these character for character. The same address drives the pin on the Google Maps embed on `/contact` (`lib/map-embed.ts`); until it is filled in, the map searches for `NEXT_PUBLIC_MAP_QUERY`, or "Coldwell Banker Realty, Lakewood Ranch, FL" when that is empty. | The brokerage sends the registered office address for the team; it is put in `settings.ts` (street, zip, suite line exactly as the brokerage writes it) and deployed; the footer, `/contact`, `/privacy` and the JSON-LD on `/` all show the same string, and the map on `/contact` pins the office. |
| 1.2 | **Brokerage sign-off and the compliance contact** | `docs/handoff/COMPLIANCE.md` says nothing ships without the brokerage compliance contact's review. Specific points to put in front of them: the footer (brokerage name directly below the phone and emails, 61J2-10.025(3)(a)); the team name is not set larger than the brokerage name (61J2-10.026); the CB mark at 185px header / 220px footer and the Equal Housing mark; the decision to show **no license numbers** (lawful under 61J2, but Coldwell Banker Realty's own policy must be confirmed by the broker of record); the "draft for legal review" label on `/privacy` and `/terms` (comes off only when counsel signs); the consent wording (`CONSENT_WORDING` for calls/texts and `CONSENT_EMAIL_WORDING` for email, both in `lib/leads.ts`); both agents titled REALTOR® (requires current NAR membership). | A dated email from the compliance contact naming the preview URL and saying the footer, marks, no-license-number decision, privacy and terms are approved; the name and email of the contact recorded here: `<compliance contact>`. |
| 1.3 | **Home Platform: Zapier connection authorization** | Section 3 depends on the "Compass" app in Zapier accepting a Coldwell Banker Home Platform login. If it only accepts compass.com accounts, the Zap's CRM step must change (for example, to the Lead Flows address in 1.5). Also decide whose account the connection uses: the leads land in that agent's Contacts. | In Zapier → Apps → Connections, a "Compass" connection exists, signed in as `<agent who owns the leads>`, and a test lead created from the Zap editor appears in Home Platform Contacts. |
| 1.4 | **Newsletter sending: decided, the site sends via Resend** | Tide (monthly) and Encore (weekly Monday) are promised on the forms and the privacy page. Decision: the site sends both itself through Resend, from the subdomain `mail.jjpremiergroup.com`, with double opt-in, a hold link for the team and a one-click unsubscribe (`docs/ISSUES.md`). The Marketing Center isn't needed for them. Every send carries the office postal address (1.1), the brokerage name and a working unsubscribe (CAN-SPAM); the site holds every issue until the address is in settings. What's needed: the domain verified in Resend with its records in Cloudflare (steps below), the variables in section 2, and migration `0013_newsletter.sql` applied (section 4.3). | `mail.jjpremiergroup.com` shows "Verified" in Resend → Domains; `GET /api/health` shows `newsletter.subscriberEmail: true`; a test address has signed up, confirmed, got the welcome, got one issue, and unsubscribed with the link and with Gmail's Unsubscribe button. First send dates recorded: `<Tide>` and `<Encore>`. |
| 1.5 | **Home Platform: lead-intake address** | A backup path if the Zapier action fails or is not authorised: the Home Platform's Lead Flows (CRM settings) may issue an email address that parses incoming leads. If it does, the team's "New lead" email can be forwarded there. Checked 2026-10-09: Lead Flows → Add lead flow offers "My Website" (the Pixel, 1.5a) or a lead provider from a fixed list (55 Places to Zumper), with no general forwarding address. The list includes the form builders Gravity Forms, JotForm, Typeform, Wufoo, Instapage and Leadpages; their setup screens haven't been opened yet. | The agents open each form builder's setup in Lead Flows and report whether it gives an address or a link to send leads to: `<address, link or "none">`. |
| 1.5a | **Home Platform: website pixel** | Lead Flows issued the team a pixel for its website (client id `bsw9jbac2nu2`). It is installed on every production page (`lib/home-platform.ts`) and sends each form to Lead Flows from the visitor's browser. Leads it can't send (Global Privacy Control, Do Not Track, a blocked script, the person named on a referral) need the webhook path in section 3. | Done 2026-10-09: Test 1, 2 and 3, sent from /contact, /buy and /sell on the live site, became contacts in Jessica Garza's account (source Pixel, group Leads, status New) with name, email and phone. Home Platform doesn't keep the message, timing, address or the call/text box; those reach the agents in the "New lead" email. Until Home Platform can see the call/text box, no action plan that sends texts goes on the Pixel lead flow. |
| 1.6 | **Home Platform: included website or listing product** | `NEXT_PUBLIC_LISTINGS_URL` is where "See our current listings" points until an MLS feed is licensed; empty hides the link. The Home Platform or Coldwell Banker may give each agent a listings page. There is no evidence of an embeddable IDX widget for external sites; assume none. | The team sends the URL of the page that shows their active listings: `<listing page URL>`. It opens without a login and shows the team's listings. |
| 1.7 | **Mailbox platform** | Decides which Zapier email app sends the reply in section 3. Checked 2026-10-01: `autodiscover.cbrealty.com` → `autodiscover.outlook.com`, so `cbrealty.com` is Microsoft 365 (Exchange Online) behind a Mimecast gateway, and its DMARC policy is `p=reject`. That means the reply must be sent by the **Microsoft Outlook** app in Zapier signed in as the agent; a generic SMTP step "from" a `cbrealty.com` address would be rejected. | The brokerage confirms that Zapier's Outlook app may be connected to agent mailboxes on their tenant (an admin may need to grant consent), and each agent connects her own mailbox in Zapier. |
| 1.8 | **Registrar and DNS access** | The domain's nameservers are Cloudflare. Section 6 adds records there. Someone must be able to log in to the Cloudflare account that holds `jjpremiergroup.com` (and the registrar, in case the nameservers ever need changing). | Josh can open the zone `jjpremiergroup.com` in Cloudflare and sees the DNS tab. Account owner recorded: `<owner>`. Registrar recorded: `<registrar>`. |
| 1.9 | **Current listing page URL** | Same value as 1.6, listed separately because the agents can answer it today without the brokerage. | `NEXT_PUBLIC_LISTINGS_URL` set in Vercel and the link on `/listings` opens it. |
| 1.10 | **Stellar MLS IDX request to the broker** | No MLS data or MLS wording may appear until an IDX licence exists; the licence needs the broker's signature and Stellar's approval and takes weeks. It does not block launch, but the clock starts only when the broker is asked. | The broker of record has the request in writing with a date; vendor or feed choice recorded: `<vendor | custom feed | not yet>`. |
| 1.11 | **Google Business Profile** | The client is creating it. Name, address and phone on the profile must match the footer and the JSON-LD exactly (same punctuation, same suite line). Its URL goes into `socialLinks` in `lib/site.ts` (`{ network: "google", label: "Google", url }`) so it appears in the footer and in `sameAs`. Its review short link (Business Profile → Get more reviews) goes into `NEXT_PUBLIC_GOOGLE_REVIEW_URL`, which turns on the "Write a Google review" button on `/reviews`. | The profile is verified by Google, its website field is `https://jjpremiergroup.com`, and both URLs are recorded: `<GBP URL>`, `<review link>`. |
| 1.12 | **Social URLs** | `socialLinks` in `lib/site.ts` is deliberately empty (the Sanity site settings can add more once Sanity is live); the footer's icon row and `sameAs` in the RealEstateAgent JSON-LD render nothing until it is filled. Each entry is `{ network, label, url }`, `network` one of google, youtube, instagram, facebook, nextdoor, linkedin, zillow, other. The bio links on those profiles point at `/from/youtube`, `/from/instagram`, `/from/facebook` and `/from/nextdoor` (noindex landing pages that tag the lead `source:<channel>`). | A list of live profile URLs the team actually maintains (YouTube, Instagram, Facebook, Nextdoor, LinkedIn, Zillow): `<urls>`. Each opens to the team's profile, not a login page. They are added to `lib/site.ts` and deployed; the footer shows one icon per profile and `/` carries them in `sameAs`. |
| 1.13 | **Trust-section facts** | Every factual claim on the site (years licensed, memberships, designations, markets served, the office) must come from the agents in writing; nothing is hand-typed from memory. The home page carries no figures by design. | For every fact the agents want stated, a one-line source (the DBPR record, the NAR card, the designation certificate) is on file; anything without one stays off the site. |
| 1.14 | **Client quotes** | `TESTIMONIALS` is empty. A quote goes live only through the Sanity `testimonial` document with `permissionOnFile` checked, so until Sanity is online there are none. | Written permission from each client is on file; the quote text, the client's first name and the date are recorded; they are entered when Sanity is live (`docs/SITE.md`, "Content: seed now, Sanity when ready"). |

### 1.4 in detail: sending from mail.jjpremiergroup.com

A subdomain keeps the newsletters' sending reputation apart from anything else that ever sends as
`jjpremiergroup.com`, and Resend recommends one. Nothing here touches the website's records.

1. **Resend → Domains → Add domain**: `mail.jjpremiergroup.com`, region North Virginia
   (`us-east-1`). Use the Resend account that holds `RESEND_API_KEY` (the team email's account), on
   a plan whose daily limit is at least `NEWSLETTER_DAILY_CAP`. The free plan allows 100 a day and
   3,000 a month: past about 100 subscribers on a list a send spreads over more than one day, and
   the monthly limit runs out at around 500 Encore subscribers. Move to a paid plan before then and
   raise `NEWSLETTER_DAILY_CAP` to its daily limit.
2. Resend shows the records it wants. **Copy them from that screen**; at the time of writing they
   are, with Cloudflare's names relative to the zone `jjpremiergroup.com`:

   | Type | Name (Cloudflare) | Content | Priority | What it is |
   |---|---|---|---|---|
   | TXT | `resend._domainkey.mail` | `p=MIGfMA0GCSqGSIb3…` (the public key Resend shows) | | DKIM: signs each email as `mail.jjpremiergroup.com` |
   | MX | `send.mail` | `feedback-smtp.us-east-1.amazonses.com` | 10 | The bounce (return-path) domain |
   | TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | | SPF for that bounce domain |

   In Cloudflare → `jjpremiergroup.com` → DNS → Records → Add record, one per row. TXT and MX
   records aren't proxied, so there's no cloud to set; TTL Auto. Paste the DKIM key whole, no
   quotes or line breaks.
3. **DMARC**, if the zone has none yet: TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:<an inbox someone reads>`.
   It covers `mail.` too. Gmail and Yahoo expect a DMARC record from bulk senders; `p=none` reports
   without blocking. Tighten it later once the reports are clean.
4. Back in Resend, **Verify DNS records**. It turns "Verified" within minutes to an hour. Keep
   open and click tracking **off** for the domain: the issues carry UTM tags for analytics, and the
   privacy page doesn't describe tracking pixels or rewritten links.
5. Set `NEWSLETTER_FROM` = `JJ Premier Group <letters@mail.jjpremiergroup.com>` and the other
   newsletter variables (section 2), redeploy, and run the check in the "Verified when" column. No
   mailbox is needed at `letters@`: replies go to `NEWSLETTER_REPLY_TO`.

Rollback: unset `NEWSLETTER_FROM` and redeploy. Nothing more goes to subscribers; the team email
still arrives and the issue can be sent by hand (`docs/ISSUES.md`, "Sending by hand").

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
`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (no longer read by anything; delete them, see
"Stay unset at launch"), all on both Production and Preview. Not present yet:
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
| `CRM_PROVIDER` | `none` until the Zap exists, then `webhook` | `none`: the Pixel is the path into Home Platform, the "New lead" email names the leads to add by hand, and the "not configured" alert stays quiet. `webhook`: the Zap (section 3) adds those leads. |
| `CRM_WEBHOOK_URL` | `<Zapier Catch Hook URL>` | Where every form submission is POSTed (section 3). Mark as Sensitive. |
| `DATABASE_URL` | `<Supabase transaction-pooler URL, port 6543>` | Mirrors every lead into `leads` + `lead_deliveries`, with the consent record in `contacts` + `events` (section 4). The durable copy. Mark as Sensitive. |
| `TEAM_NOTIFY_EMAIL` | `<Joelyn's address>,<Jessica's address>` | One address or several, comma-separated. The internal "New lead · <form> · <name>" email, ending "· add to Home Platform" when Home Platform doesn't have the lead; reply-to set to the visitor. Needs the two Resend values below. |
| `LEAD_ALERT_EMAIL` | `<Josh's address>` (falls back to `TEAM_NOTIFY_EMAIL`) | Receives the "lead not delivered to the CRM" alert. Point it at the person who will fix the Zap, not the agents. |
| `RESEND_API_KEY` | `<Resend key>` | Sends the two internal emails above. Mark as Sensitive. |
| `RESEND_FROM_EMAIL` | `<address on a domain verified in Resend>` | The From of the internal emails. Verify the domain in Resend first or sends fail. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `jjpremiergroup.com` | Loads the Plausible script and the `Lead` / `Subscribe` events. Production only; leave it off Preview so previews never report into production analytics. |
| `NEXT_PUBLIC_MAPTILER_KEY` | already set | MapTiler tiles for Atlas. Add the launch domain as an allowed origin (section 5.6). |
| `NEXT_PUBLIC_LISTINGS_URL` | `<URL from 1.6>` | The "See our current listings" link on `/listings`. Empty hides the link. |
| `NEXT_PUBLIC_ROBOTS_NOINDEX` | **removed from Production** (or empty); `true` on Preview | The index gate. Section 6.5 flips it. |
| `CRON_SECRET` | already set | Bearer token for `GET /api/cron/archive-events`, which `vercel.json` runs every Monday 09:00 UTC (a no-op until Sanity is live, but the route must stay protected), for the two newsletter hand-offs, `/api/issues/encore` (Mondays 10:00 UTC) and `/api/issues/tide` (the 1st, 12:00 UTC), which email the finished issue to `TEAM_NOTIFY_EMAIL`, and for the sends to subscribers, `/api/newsletter/send/encore` (Mondays 12:00 UTC), `/api/newsletter/send/tide` (the 3rd, 13:00 UTC) and `/api/newsletter/send/all` (daily 13:30 UTC) (`docs/ISSUES.md`). |
| `NEWSLETTER_FROM` | `JJ Premier Group <letters@mail.jjpremiergroup.com>` | The From of every newsletter email. Set it once `mail.jjpremiergroup.com` is verified in Resend (1.4); it's the switch for sending to subscribers. |
| `NEWSLETTER_SECRET` | `openssl rand -base64 48` | Signs the confirm links and the team's hold and send links. Mark as Sensitive. |
| `NEWSLETTER_REPLY_TO` | `<the agent's address that should get replies>` | Where a subscriber's reply ("stop", a question) goes. |
| `NEWSLETTER_DAILY_CAP` | `100` (Resend free), or the plan's daily limit | Newsletter emails a day; what's over waits for the next day. |
| `UNSUBSCRIBE_SECRET` | `openssl rand -base64 48` | Signs the unsubscribe link in every newsletter email. Required for sending; never change it once emails have gone out. Mark as Sensitive. |

### Optional; set if the value exists, otherwise leave empty

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BOOKING_URL` | `<Cal.com or Calendly link>`. Shows a "book a time" link where the site offers one; empty hides it. **Verify** the exact placement in the merged code. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | The public site's lead path reads only `DATABASE_URL`; these three are read only by `lib/supabase/*`, kept for the coming search work and not part of launch (nothing on `main` calls `lib/env.ts` or `lib/supabase/*`). Fill them from the same Supabase project for completeness or leave empty. |
| `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | Harmless while `NEXT_PUBLIC_SANITY_PROJECT_ID` is empty (`production` and `2026-09-01` in `.env.example`). |
| `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS` | Leave empty. `true` would put the sample listings on the live site. |
| `NEXT_PUBLIC_PLAUSIBLE_HOST` | Leave empty (plausible.io). Only for a self-hosted instance. |
| `NEXT_PUBLIC_GOOGLE_REVIEW_URL` | The Google Business Profile review link from 1.11 (`https://g.page/r/…`). Shows "Write a Google review" on `/reviews`; empty shows a "coming soon" line. Must be `https`. Inlined at build time like every `NEXT_PUBLIC_*` value, so setting or changing it needs a redeploy (6.6). |
| `NEXT_PUBLIC_MAP_QUERY` | Optional. What the Google Maps embed on `/contact` searches for while the office street address (1.1) is still empty in `settings.ts`; once the address is filled in it drives the pin and this is ignored. Empty = "Coldwell Banker Realty, Lakewood Ranch, FL". Inlined at build time (6.6). |
| `ISSUE_PREVIEW_SECRET` | `openssl rand -hex 24`. The `?secret=` for the newsletter previews at `/api/issues/encore` and `/api/issues/tide`; unset, both answer 404. Mark as Sensitive. (`docs/ISSUES.md`) |
| `ISSUE_WEBHOOK_URL` | A Zapier Catch Hook that receives each finished issue (Encore on Mondays, Tide on the 1st) for an Outlook draft or the Marketing Center. Unset, the issue goes only to `TEAM_NOTIFY_EMAIL`. Mark as Sensitive. (`docs/ISSUES.md`) |

### Stay unset at launch

| Group | Variables | Why |
|---|---|---|
| Follow Up Boss | `FUB_API_KEY`, `FUB_SYSTEM`, `FUB_SYSTEM_KEY`, `FUB_LEAD_SOURCE` | The CRM is the Home Platform. With `CRM_PROVIDER=webhook` these are ignored. The pixel is gone from the site; `NEXT_PUBLIC_FUB_PIXEL_ID` can be deleted. |
| Sanity | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_WRITE_TOKEN`, `SANITY_VIEWER_TOKEN`, `SANITY_REVALIDATE_SECRET` | Empty project id = the site renders the seed content in `lib/content/seed`. Bringing Sanity online is its own task in `docs/SITE.md`. |
| Stale | `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Exist in the Vercel project; no code reads them (the site uses Plausible, and the background-job service is gone with the old agent dashboard). Delete the rows. |

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
| form | hidden `form` input | One of `contact`, `buy`, `sell`, `listing`, `valuation`, `letter`, `calendar`, `referral` (`/refer`), `review-permission` (`/reviews`). |
| firstName, lastName | name fields | "Jane Doe" typed in the first box is split. `letter` and `calendar` have no name (empty strings). |
| email | required on every form | Lower-cased. |
| phone | optional | As typed; not normalised. `null` when empty. |
| message, timing, sellFirst, market, propertyAddress | optional | `market` is one of `lakewood-ranch`, `sarasota`, `bradenton`; `sellFirst` is the buy form's "Is there a house to sell first?" answer; `propertyAddress` the valuation/sell address. |
| property (slug, title, street, city, state, zip, price, mls, url) | `listing` form only | `null` otherwise. |
| referral (firstName) | `referral` form only | The first name of the person who's moving; nothing else about them is asked. `null` otherwise. Write back to the referrer (`firstName`, `email`) first: the page promises we reach out only after they've told the person. |
| consent (email, sms, timestamp, wordingVersion, review, reviewAt, reviewWordingVersion) | the two unchecked-by-default boxes; the review box on `/reviews` | `timestamp` and `wordingVersion` are about email and calls/texts only. `letter`/`calendar` imply `email: true` with `wordingVersion` `implied:subscribe`; `review-permission` shows neither box, so `email` and `sms` are `false`, `timestamp` is `null` and `wordingVersion` is `none:not-shown`; everything else carries `CONSENT_WORDING_VERSION` from `lib/leads.ts`. `review` is `true` only on `review-permission` (the box is required there), with its own `reviewAt` and `reviewWordingVersion` (`REVIEW_CONSENT_VERSION`). |
| source (channel, page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, landingPath, firstTouchReferrer, firstTouchAt) | the page URL, the Referer header and the 90-day first touch from `components/utm-tracker.tsx` | Absent values are `null`, never missing. `channel` is youtube, instagram, facebook or nextdoor when the visit came through `/from/<channel>`. |
| submittedAt | the server clock | ISO timestamp. |
| tags | built by the pipeline | `form:<form>`; `market:<market>` when set; `consent:email` and `consent:sms` when given; `consent:review` on a review permission; `source:<channel, else utm_source, else direct>`; `site:jjpremiergroup`; `test` on rehearsal leads. |
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

Two later form kinds need the same thought. `referral` is an enquiry from the referrer, so the
enquiry reply suits it, but nobody should contact the person named in `referral.firstName` until the
referrer has told them. `review-permission` is not an enquiry: leave it out of the Outlook step
(`form` **Does not exactly match** `review-permission`) and have an agent thank the client by hand;
the words are in `message` and the permission in `consent.review`.

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
applies `lib/db/migrations/0000` through `0008` in order. `0001`–`0005` built the old agent dashboard
and `0008_remove_portal` drops all of it again, so the end state is only what the public site uses
(`docs/INTEGRATIONS.md`, section 1). Migrations are immutable; a schema change is a new file.

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

The lead mirror writes to `leads` and `lead_deliveries`, with the person and their consent in
`contacts` and `events`. In SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by 1;
-- expect: contacts, events, lead_deliveries, leads, questionnaire_answers

select count(*) from contacts;   -- 0 before the first test lead
```

Row-level security is on and deny-by-default on every table, with no policies; the site writes through the `postgres`
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

The team works leads in the Home Platform; there is no dashboard on the site.

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
for p in /lakewood-ranch/the-lake-club /neighborhoods/lake-club; do
  curl -sS -o /dev/null -w "$p -> %{http_code} %{redirect_url}\n" $P$p
done
# 2026-10-01: 308 to /neighborhoods/the-lake-club, /neighborhoods/the-lake-club
curl -sS -o /dev/null -w '%{http_code}\n' $P/relocate
# 200: the relocation planner is a page now (the old /relocate -> /buy redirect was removed)

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

The newsletter's records for `mail.jjpremiergroup.com` (DKIM, the `send.mail` MX and SPF, and
DMARC; 1.4) are separate from these and don't depend on the cutover: add them any time before the
first send. Rolling the website back (6.12) leaves them alone.

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
# User-Agent: *  Allow: /  Disallow: /studio /api/ /unsubscribe /subscribe/ /thanks/ /q/
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

for p in /lakewood-ranch/the-lake-club /neighborhoods/lake-club; do
  curl -sS -o /dev/null -w "$p -> %{http_code} %{redirect_url}\n" $D$p
done
# 308 to the destinations in section 5.3, on the new host; /relocate is a 200

curl -sS -o /dev/null -w '%{http_code}\n' $D/this-does-not-exist
# 404

curl -sS $D/api/calendar.ics | head -4
# BEGIN:VCALENDAR / VERSION:2.0 / PRODID / ...

curl -sSI $D/ | grep -i 'strict-transport-security'
# max-age=63072000; includeSubDomains; preload

curl -sS $D/ | grep -o 'data-domain="[^"]*"'
# data-domain="jjpremiergroup.com"

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
add the custom events and properties listed in `docs/MEASUREMENT.md` §3 (Lead, Subscribe, Review
permission, Calendar feed, Phone tap, Share, Explore, Lead server, Outbound Link: Click). The test
lead in 6.9 appears as one `Lead` goal with `form = contact`.

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

### 7.6 The first Encore and Tide

The site builds both newsletters, emails each finished issue to `TEAM_NOTIFY_EMAIL`, and then sends
it to the confirmed subscribers itself (`docs/ISSUES.md` has the whole flow).

1. Set `ISSUE_PREVIEW_SECRET` (and `ISSUE_WEBHOOK_URL` if the Zap exists) and the newsletter
   variables (1.4, section 2) in Production, apply `0013_newsletter.sql`, redeploy, and check
   `GET /api/health` shows `issues.previewSecret`, `teamEmail`, `resend`, `cronSecret` and
   `newsletter.subscriberEmail` as `true` (`newsletter.missing` names anything left).
2. Sign up yourself on the Tide box and the Encore box with a Gmail address. Confirm both, check the
   welcomes arrive (not in spam), and look at "Show original": SPF, DKIM and DMARC all `PASS`.
3. Open `https://jjpremiergroup.com/api/issues/encore?secret=<ISSUE_PREVIEW_SECRET>` and the same for
   `/api/issues/tide` with the agents. **Fill in the office street address and ZIP first (1.1):** the
   site holds every issue from subscribers until they're in settings, and the team email says so.
4. The first Monday after cutover, 10:00 UTC: "Encore for Monday <date>: ready to send" arrives in the
   team inbox, saying how many subscribers get it at 8am, with "Send it now" and "Hold this issue".
   At 12:00 UTC it goes out unless someone held it. Check your own copy arrived, and press Gmail's
   Unsubscribe button on it once to see the one-click unsubscribe work (then sign up again).
5. The 1st, 12:00 UTC: "Tide, <Month YYYY>: ready to send". The county appraisers post a sale only after
   they've qualified it (Manatee runs about two months behind), so Tide covers the latest month that's
   complete for all three places, never a partial one: on October 1, that's July. The story and the
   two notes are written in `lib/tide/issues.ts` and deployed before the 3rd, or the issue goes out
   with the computed lines and without the notes (subscribers never see a dashed box); hold it if
   it should wait. On the 3rd at 13:00 UTC it goes to subscribers. The county-data refresh PR
   ("Sales data: refresh county records") opens every Sunday at 09:00 UTC
   (`.github/workflows/sales-refresh.yml`); **merge one in the last week of each month**, or the run on
   the 1st repeats the prior month (the team email warns when it does, and a month already sent isn't
   sent again). `docs/SALES-DATA.md` says what to check in its diff.
6. Vercel → Project → Cron Jobs: all five newsletter jobs listed, last run 200. For the hand-offs a 422
   means the issue was held from the webhook (a Fair Housing flag, or a month that isn't complete) and
   the team got an alert; a 502 means neither the team email nor the webhook took it. For the sends,
   the JSON lists each send's `decision` and counts; `deferred` above zero means the daily cap was
   reached and the rest go at the next daily run.

## 8. Who does what, in order

| Order | Who | What | Runbook section |
|---|---|---|---|
| 1 | Agents | Send the social URLs, the listing page URL, the facts and sources for anything stated on the site, any client quotes with permission | 1.6, 1.9, 1.12, 1.13, 1.14 |
| 2 | Brokerage | Confirm the office address, the mailbox platform and Zapier/Outlook permission, the no-license-number policy; name the compliance contact; receive the Stellar IDX request | 1.1, 1.2, 1.7, 1.10 |
| 3 | Agents | In Home Platform: authorise the Compass app in Zapier, check Lead Flows; connect each Outlook mailbox in Zapier; finish the reply template | 1.3, 1.5, 3.5 |
| 4 | Josh | Create the Supabase project, run migrations, confirm tables | 4 |
| 5 | Josh | Build the Zap with the agents' account, run the test script, keep the Zap off | 3 |
| 6 | Josh | Set the Preview variables, run every pre-cutover check, including the seven forms end to end | 2, 5 |
| 7 | Compliance contact | Written sign-off on the preview (footer, marks, privacy, terms, reply template, no license numbers) | 1.2 |
| 8 | Josh | Cutover: tag, domains, DNS, certificate, variables, redeploy, verification, smoke, uptime, rollback plan on hand | 6.1 to 6.12 |
| 9 | Josh, then one agent | The real test lead and the human reply from inside Home Platform | 6.9 |
| 10 | Josh | Search Console, Bing, sitemap submissions | 7.1 |
| 11 | Agents | Google Business Profile website field and NAP; send the GBP URL | 7.2, 1.11 |
| 12 | Josh | Daily lead check and 404 review for the first week; hand the daily check to the agents at the end of it | 7.3, 7.4, 7.5 |
| 13 | Josh | Verify `mail.jjpremiergroup.com` in Resend and add its DKIM, SPF (and DMARC) records in Cloudflare; set the newsletter variables; apply `0013_newsletter.sql` | 1.4, 2, 4.3 |
| 14 | Josh, then the agents | A test sign-up end to end; then the first Encore (Monday) and Tide (the 3rd) go out from the site, with the agents reading the team email and holding an issue if it should wait | 7.6 |
