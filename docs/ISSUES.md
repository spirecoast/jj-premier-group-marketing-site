# Newsletters: Encore every Monday, Tide on the 1st

The site promises two emails on its forms: **Encore**, the arts calendar, every Monday (the
`calendar` form), and **Tide**, one page on the market, once a month (the `letter` form). This
document covers how each issue is built and handed off.

**The rule:** the site sends no email to visitors or subscribers. It builds each issue and hands
it to the team. Subscribers get it from the agents' Coldwell Banker mailboxes or the Home
Platform's Marketing Center (the choice is open, docs/LAUNCH.md 1.4). The code sends to one
address only, `TEAM_NOTIFY_EMAIL`.

## The flow

```
Vercel Cron ──GET + Bearer CRON_SECRET──▶ /api/issues/encore   (Mondays 10:00 UTC)
                                          /api/issues/tide     (the 1st, 12:00 UTC)
   │
   ├─ lib/issues/load.ts          gathers the inputs: the Encore index, the county sales, the settings
   ├─ lib/issues/encore-weekly.ts builds the issue (pure: HTML, text, subject, warnings)
   │  lib/issues/tide-monthly.ts
   ├─ Fair Housing check          lib/fair-housing.ts over the whole issue; a flag holds the hand-off
   ├─ team email                  Resend → TEAM_NOTIFY_EMAIL, "Encore for Monday <date>: ready to send"
   │                                                        "Tide, <Month YYYY>: ready to send"
   │                              a note and the warnings, the issue itself, and the issue attached
   │                              as <kind>-<period>.html and .txt
   └─ webhook (optional)          POST JSON → ISSUE_WEBHOOK_URL (Zapier Catch Hook), 8s timeout, one retry
                                       │
                                       ▼
                     the agents send it: Outlook (via the Zap) or the Marketing Center
```

The cron times are UTC. 10:00 UTC is 6am in Sarasota during daylight time and 5am in winter;
12:00 UTC on the 1st is 8am or 7am. Vercel Cron sends a `GET`; the routes also accept a `POST`
with the same header for a manual re-run. Vercel can, rarely, deliver a cron run twice; a second run
sends a second team email and a second webhook POST, so a Zap that does more than create a draft
should skip a `kind` + `period.from` it has already seen.

## Endpoints

| Request | Who | What it does |
|---|---|---|
| `GET /api/issues/encore?secret=<ISSUE_PREVIEW_SECRET>` | anyone with the preview secret | The Monday issue for the week on or after today (America/New_York) as HTML. `&format=text` for the plain-text version, `&date=YYYY-MM-DD` for another week. 404 without the secret, or when the secret is unset. |
| `GET /api/issues/tide?secret=<ISSUE_PREVIEW_SECRET>` | same | The issue for the latest month complete in all three markets (see "The month" below). `&month=YYYY-MM` for a named month, `&date=` to move "today", `&format=text`. |
| `GET` or `POST` with `Authorization: Bearer <CRON_SECRET>` | Vercel Cron, or a person re-running a send | Builds the issue and hands it off. Returns JSON: `{ ok, kind, period, subject, fairHousing, held, teamEmail, webhook, warnings }`. 200 when the team email or the webhook took it; 422 when it was held from the webhook (a Fair Housing flag, or a Tide month that isn't complete), with an alert to the team instead; 502 when neither path took it. `POST` without the header is 401. |

The secret is compared in constant time. The preview is `no-store` and `noindex`; `/api/` is
also disallowed in robots.txt.

```bash
# Look at next Monday's issue
open "https://jjpremiergroup.com/api/issues/encore?secret=$ISSUE_PREVIEW_SECRET"
# Tide for July, plain text
curl -s "https://jjpremiergroup.com/api/issues/tide?secret=$ISSUE_PREVIEW_SECRET&month=2026-07&format=text"
# Re-run the Tide hand-off for July (emails the team, posts to the Zap)
curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "https://jjpremiergroup.com/api/issues/tide?month=2026-07"
```

Locally, without a server and without sending anything:

```bash
npm run issue:preview -- encore --date 2026-10-05
npm run issue:preview -- tide --month 2026-07
npm run issue:preview -- both --out scratchpad/issues --site https://jjpremiergroup.com
```

Each writes `<kind>-<period>.html`, `.txt` and `.json` (subject, warnings, and for Tide every
computed figure) under `scratchpad/issues/` (gitignored).

## What is in each issue

Both are table-based HTML in a 600px column with inline styles, system fonts (Georgia for the
display lines, the platform sans for text) and the brand colors written out as hex, plus a
plain-text version. No external CSS, no scripts, no web fonts. Every link and image is an
absolute URL on the site, tagged `utm_source=encore|tide&utm_medium=email&utm_campaign=<period>`
so a visit (and a lead that follows) shows where it came from. Every sentence comes from the
templates in `lib/issues/copy.ts`, which `npm run check:copy` (and so every build) runs through
the Fair Housing checker.

### Encore (`lib/issues/encore-weekly.ts`)

- **The week:** Monday to Sunday. On a Monday (when the cron runs) it is this week; on any other
  day, the next one.
- **The intro:** one line from the template with the number of picks and the number of dated
  performances on the calendar that week.
- **The picks:** 8 to 12 performances, one per production, none sold out. Chosen the way the visit
  planner chooses (`lib/encore/plan.ts`): every candidate is scored, the top one taken and the
  rest re-scored, pushing away hardest from a market already picked, then from the same venue,
  category and day, with a slight lean to evenings. Each shows the day, time, category, market,
  title (linked to `/calendar/<slug>`), venue, the dataset's one-line summary, presenter and
  price note. The first pick's picture sits under the intro: `/api/issues/encore/image/<slug>`, a
  PNG with the same composition as the event's share image (the venue's photo or the Encore key
  art, the title and the date). Email clients don't render SVG, and the share image's own URL
  carries a build hash, so the issue uses this stable, public route instead. It is static
  (rendered on the first open of each slug, then cached for a day), and an unknown slug redirects
  to the site's share image, `/og-image.png`.
- **On view:** up to six exhibitions open during the week, closing soonest first, with a link to
  the rest.
- **Warnings** (in the team email, never in the issue): fewer than 8 picks, a market with no
  picks, an empty week, a missing postal address.

### Tide (`lib/issues/tide-monthly.ts`)

- **The month:** the latest month the county record has complete in all three markets, looking
  back from the month before today; never a partial month. `?month=YYYY-MM` builds a named one.
  The issue opens with one sentence saying so: "The county property appraisers post a sale only
  after they've qualified it, so this issue covers July 2026, the latest month that's complete for
  all three places." The team subject names the month: "Tide, July 2026: ready to send".
- **Per market**, from the county sales (`data/sales`, docs/SALES-DATA.md), every figure computed:
  - qualified home sales (codes 01 to 04, anything but the non-residential "other" parcels),
    parcels vacant on the roll included;
  - the median price over the homes only, leaving out parcels vacant on the roll or changed since
    the sale (tile: "Median price, homes"; Lakewood Ranch in July 2026 is $625,000 this way, and
    $574,500 with the vacant parcels in);
  - the median price per square foot over the homes with a recorded living area, with the same
    exclusions (as `/sell/sold` does);
  - the share that were new builds or vacant on the roll (vacant, built in or after the sale year,
    or a 03/04 code);
  - the three streets with the most sales (two or more each, ties alphabetical). A street carries
    its postal city only when that city isn't a market's name: "Gulf of Mexico Dr, Longboat Key"
    and "Violet Jasper Dr, Parrish", but "Lilac Sky Ter" rather than "Lilac Sky Ter, Bradenton"
    under Lakewood Ranch (a 34211 address the post office calls Bradenton).

  One paragraph per market from the template, with no adjective a number doesn't back.
- **Markets** are assigned by ZIP from the Atlas dataset (`lib/issues/tide-markets.ts`, which
  explains the rule; a unit test recomputes it from `neighborhood-data/data/neighborhoods.search.json`
  and fails if they drift). A sale the county gives as postal city LAKEWOOD RANCH counts there
  whatever its ZIP. Bradenton includes Palmetto, Parrish, Ellenton and the island cities, as
  Atlas draws it. Sales outside those ZIPs (Venice, Nokomis, Osprey, North Port, Englewood, Myakka
  City and the rest of the two counties) aren't counted, and the issue says so with the numbers
  under its intro: in July 2026, 650 of the 2,270 qualified home sales the two counties recorded.
- **Completeness.** The appraisers publish a sale only after they qualify it, weeks after it
  closes. Manatee runs about two months behind: on 2026-10-01 its file had 1,205 sales for July,
  285 for August and 1 for September, so the run on October 1 covers July. A market's month is
  complete when it has at least 75% of that market's median month over the twelve before; the
  default takes the latest month complete in all three, up to six months before the previous one.
  A month that isn't complete (asked for with `?month=`, or the fallback when no month in that
  window is complete) still builds, with "Qualified sales so far" on its tiles and a sentence in
  its paragraph, but the hand-off holds it from the webhook and sends the team an alert instead.
- **The data refresh.** The sales data in the deployment changes only when a refresh PR is
  merged. `.github/workflows/sales-refresh.yml` opens one every Sunday at 09:00 UTC
  (docs/SALES-DATA.md). **Merge one in the last week of each month**, or the run on the 1st covers
  the same month as the run before. The team email warns when that is likely (the month is three
  or more behind the previous one, or the data is more than a month old); skip a month that
  already went out.
- **What it means:** a dashed box reading "Joelyn and Jessica add two paragraphs here before
  sending." It is never generated. The issue carries `needsEdit: true` and the placeholder text,
  so the Zap can refuse to send until it has been replaced.
- **Links:** `/sell/sold`, `/relocate`, and the three hubs.
- **Source line:** "County property appraisers, public record, qualified sales, as of <the
  manifest's generated date>", then the methods line. When a county file ends before the month
  does, a line says so.

### The footer (both)

Links to the calendar and the ICS feed (`/api/calendar.ics`); "Sent by Joelyn Nauman and Jessica
Garza, JJ Premier Group, Coldwell Banker Realty."; the office postal address from settings; the
phone; why the reader has it; "To unsubscribe: Reply 'stop' or use the link in the email you
received."; Equal Housing Opportunity. No license numbers. While `officeAddress.street` and `zip`
are empty in `lib/content/seed/settings.ts` (docs/LAUNCH.md 1.1) the footer shows only
"Lakewood Ranch, FL" and every hand-off carries a warning: **CAN-SPAM needs a valid postal
address in every send.** Fill it in before the first issue goes out.

## Environment variables

| Variable | New | What it does |
|---|---|---|
| `ISSUE_PREVIEW_SECRET` | yes | The `?secret=` for the browser previews. Unset = no preview (404). `openssl rand -hex 24`. Sensitive. |
| `ISSUE_WEBHOOK_URL` | yes | A Zapier Catch Hook that receives each issue. Unset = team email only. Sensitive. |
| `TEAM_NOTIFY_EMAIL` | existing | Where the finished issue goes, the only recipient this code has. Unset = no team email. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | existing | Send the team email. Without them the email is skipped (logged), not faked. |
| `CRON_SECRET` | existing | The Bearer token Vercel Cron sends. Unset = the hand-off can't run. |

`GET /api/health` reports `issues: { previewSecret, webhook, teamEmail, resend, cronSecret }` as
booleans.

## The webhook payload

```json
{
  "kind": "tide",
  "subject": "Tide · July 2026",
  "html": "<!doctype html>…",
  "text": "TIDE · JULY 2026, FROM THE COUNTY RECORDS…",
  "period": { "from": "2026-07-01", "to": "2026-07-31", "label": "July 2026" },
  "preheader": "What sold in Lakewood Ranch, Sarasota and Bradenton in July 2026, from the county records.",
  "needsEdit": true,
  "placeholder": "Joelyn and Jessica add two paragraphs here before sending.",
  "warnings": ["…"],
  "generatedAt": "2026-08-01T12:00:03.000Z"
}
```

Encore has `needsEdit: false` and `placeholder: null`. Nothing about a subscriber is in it.

## Handing it to subscribers

Pick one per newsletter; both start from the team email or the webhook.

### Option A: the Marketing Center (Home Platform)

The better fit for a list, if the agents have it (docs/LAUNCH.md 1.4 is the open question).

1. Export the subscribers (below) as CSV and import them as a list. Re-export before each send, or
   at least monthly, so new sign-ups and unsubscribes carry over.
2. Upload or paste the attached `.html` file into a custom-HTML template, if the Marketing Center
   takes one (**verify**); otherwise rebuild the two templates once in its editor and paste the
   text from the `.txt` each time.
3. For Tide, replace the dashed box with the two paragraphs.
4. The Marketing Center adds its own unsubscribe link and keeps its own suppression list. Copy its
   unsubscribes back to Supabase (below) so the next export leaves them out.

### Option B: Zapier → Outlook (the agent's mailbox)

`cbrealty.com` is Microsoft 365 with DMARC `p=reject` (docs/LAUNCH.md 1.7), so mail must go out
through the agent's own mailbox via Zapier's Microsoft Outlook app.

1. Zap: **Webhooks by Zapier → Catch Hook** (its URL is `ISSUE_WEBHOOK_URL`) → **Filter**
   (`kind` is `encore` or `tide`) → **Microsoft Outlook → Create Draft Email** (**verify** the
   action name in Zapier), To: the agent herself, Subject: `subject`, Body (HTML): `html`.
2. Tide: never wire an automatic send. Add a filter that stops on `needsEdit` = true, or always
   stop at the draft; the agent replaces the dashed box first.
3. Sending to the list from a mailbox means one message per subscriber (never a visible To or Cc
   list; BCC to many is a deliverability and privacy problem). That needs a loop over the export,
   respects Exchange Online's sending limits (**verify** the tenant's per-minute and per-day
   recipient limits), and each message must carry its own unsubscribe link (below). Past a few
   dozen subscribers, Option A or a dedicated send tool is the safer choice.

## The subscriber export

Every form submission is its own `contacts` row (the mirror doesn't merge), so an address can
appear more than once. An unsubscribe sets `unsubscribed_email = true` on one row; the queries
leave out any address with such a row. Supabase → SQL Editor → run → Download CSV.

```sql
-- Tide subscribers (the letter form). For Encore use 'calendar_form'.
select lower(c.email) as email, min(c.created_at) as subscribed_at
from contacts c
where c.consent_email
  and c.source_detail = 'letter_form'
  and c.email is not null
  and not exists (
    select 1 from contacts u
    where lower(u.email) = lower(c.email) and u.unsubscribed_email
  )
group by lower(c.email)
order by subscribed_at;
```

Leave out rehearsal leads by joining `events` (`payload->>'test' = 'true'`) if any were sent
with `scripts/test-lead.mjs`.

For Option B, each subscriber needs their own link to the site's unsubscribe page
(`/unsubscribe?id=<contact id>&sig=<HMAC>`, `lib/unsubscribe.ts`). Postgres can sign it with
pgcrypto using the same `UNSUBSCRIBE_SECRET` the site uses; paste the secret only into the SQL
Editor, never into a saved query or the Zap:

```sql
select lower(c.email) as email,
       'https://jjpremiergroup.com/unsubscribe?id=' || c.id || '&sig=' ||
       rtrim(translate(encode(extensions.hmac(c.id::text, '<UNSUBSCRIBE_SECRET>', 'sha256'), 'base64'), '+/', '-_'), '=')
         as unsubscribe_url
from (
  select distinct on (lower(email)) id, email
  from contacts
  where consent_email and source_detail = 'letter_form' and email is not null
  order by lower(email), created_at desc
) c
where not exists (select 1 from contacts u where lower(u.email) = lower(c.email) and u.unsubscribed_email);
```

**Verify** one link opens the confirm page and the confirm sets the flag before using the list.

## Unsubscribes are the sender's job

The issue's footer says "Reply 'stop' or use the link in the email you received." because the
link belongs to whichever tool sends:

- The Marketing Center (Option A) adds its link and suppresses on its own. Copy its unsubscribes
  to Supabase.
- Outlook (Option B) adds nothing: the per-subscriber `unsubscribe_url` above must go into each
  message.
- A reply that says stop, or anything like it, is an unsubscribe. Honor it within 10 business
  days (CAN-SPAM); in practice the same day:

```sql
update contacts set unsubscribed_email = true, consent_email = false
where lower(email) = lower('<address>');
```

Before the first send: the postal address is in settings, the subject line says what the email
is, the sender is the agents, and an unsubscribe has been tried end to end.

## Files

| File | What |
|---|---|
| `lib/issues/copy.ts` | Every template string; checked by `npm run check:copy` and the tests. |
| `lib/issues/render.ts` | Email HTML pieces, the footer, the plain-text wrap, date labels. |
| `lib/issues/encore-weekly.ts` | The Monday issue (pure). |
| `lib/issues/tide-monthly.ts` | The monthly issue (pure). |
| `lib/issues/tide-markets.ts` | ZIP → market, from the Atlas dataset. |
| `lib/issues/load.ts` | Server: loads the index, the sales and the settings. |
| `lib/issues/handoff.ts` | Server: auth, Fair Housing, the team email, the webhook. |
| `lib/issues/*.test.ts`, `lib/issues/fixtures.ts` | Unit tests and their fixtures. |
| `app/api/issues/{encore,tide}/route.ts` | The preview and the cron hand-off. |
| `app/api/issues/encore/image/[slug]/route.ts` | The lead pick's PNG for the Monday issue. |
| `scripts/issue-preview.mjs` | Local render to files. |
| `docs/screenshots/issues/` | The two previews at 600px. |
