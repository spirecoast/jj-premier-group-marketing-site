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
  The issue says so near the top: "The county posts sales a few weeks late, so this issue looks
  back at July 2026. That's the newest month that's complete for all three places." The team
  subject names the month: "Tide, July 2026: ready to send".
- **Per market**, from the county sales (`data/sales`, docs/SALES-DATA.md), every figure computed:
  - qualified home sales (codes 01 to 04, anything but the non-residential "other" parcels),
    parcels vacant on the roll included;
  - the median price over the homes only, leaving out parcels vacant on the roll or changed since
    the sale (tile: "Median price"; Lakewood Ranch in July 2026 is $625,000 this way, and
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
- **The story:** the same hand-written words as the web issue (lib/tide/issues.ts, "Writing the
  narrative" below): the opening in place of the plain intro, then "If you're buying" and "If
  you're selling" with the line on what county records can't show, the market figures, and "What
  to watch next month". The loader (`lib/issues/load.ts`) takes the entry pinned to the month the
  email covers, or the unpinned entry for this month's issue. **Until the story is written**, the
  draft opens with a dashed box, "Facts to write from", listing the month's notable figures
  (`writingFacts` in `lib/tide/narrative.ts`: the largest change against a typical month, each
  market's figures against its typical month, the month before, where the median price and the
  price per square foot part ways, the busiest and quietest months on the chart, the busiest
  street), and a dashed box where the story goes. Both are for the writer, never a reader.
- **The signed notes:** "From Joelyn and Jessica", one slot each. A note written in
  `commentary` shows in full, signed with her name; an empty slot is a dashed box ("Joelyn: a few
  sentences here in your own words, if you'd like. Or delete this box and nothing is said for
  you."). Nothing is ever written for them.
- **needsEdit:** true while any dashed box is left (the story or a note), with `placeholder` set
  to "Fill in or delete every dashed box before sending.", so the Zap can refuse to send. With the
  story and both notes written it is false.
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

## The web issue

Each Tide issue is also a page on the site, `/tide/<issue>` (`/tide/2026-10`), listed on `/tide`
and at the top of the archive (`/blog`), in the sitemap, with its own share image. The figures are
rendered from data: `lib/tide/issue.ts` builds an `IssueModel` from the county sales with the same
engine functions as the email (`tideStats`, `topStreets`, `latestCompleteMonth` in
`lib/issues/tide-monthly.ts`), so the page and the email give the same figures. Every number in a
tile, chart or list comes from the model, and every fixed sentence from the templates in
`lib/tide/copy.ts`. The month's story is hand-written in `lib/tide/issues.ts` (see "Writing the
narrative"), and every number in it is checked against the model by `lib/tide/narrative.test.ts`.
`npm run check:copy` (and so every build) runs the templates and the story through the Fair
Housing checker, the issue rules (no superlatives, no license numbers) and the voice rules
(`lib/voice.ts`). The model also runs `checkFairHousing` over every string it carries, street names,
the story and the signed notes included, and the build stops if one is flagged.

Two months: the **issue month** is when it goes out (October 2026); the **data month** is the
latest month complete in all three markets, looking back from the month before the issue (July
2026 on the October 1 data, as in "The month" above).

The sections, always in this order:

1. **Masthead.** "Tide", the issue month, then **the opening**: the month's story in two to four
   sentences (`opening`), or, before it's written, one plain line: "Here's how home sales went in
   July 2026 in Lakewood Ranch, Sarasota and Bradenton, straight from the county's public record."
   Under it, in small type: "The county posts sales a few weeks late, so this issue looks back at
   July 2026. That's the newest month that's complete for all three places." and the source line.
   No fake prose stands in for a story that isn't written.
2. **If you're buying, if you're selling** (only once written): two cards side by side, then the
   line "These are closed sales from county records. They don't show asking prices, how long a
   home was for sale, or how many homes are for sale now."
3. **The three markets**, side by side (stacked on a phone): qualified home sales, the median price
   (homes), the median $/sq ft (homes with a living area) and the share new-build or vacant on the
   roll, each over its **typical month**, the median of that figure over the twelve months before
   the data month, with the sample under it.
4. **Chart: home sales each month**, the last twelve complete months ending with the data
   month, one line per market. The axis starts at zero.
5. **Chart: median price per square foot each month**, same months. The axis starts at a round step under the
   lowest value, and the chart and its note both say where ("Axis starts at $200").
6. **The busiest streets:** the five streets per market with the most sales in the data month (two or
   more each, ties alphabetical). Street and city only, never a house number or a name.
7. **What to watch next month** (only once written): one or two things, from `watch`.
8. **From Joelyn and Jessica:** a short note from each, in her own words, signed with her name
   (`components/tide/team-notes.tsx`). Only a written note shows; with neither written the section
   isn't there. In sample previews (`NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`) an empty slot shows as
   a dashed box marked "Placeholder, not published".
9. **New guides this month:** the posts published in the issue month (market reports left out).
10. **The ask and the source:** the Tide subscribe bar (`components/letter-form.tsx`), then
   "County property appraisers, public record, qualified sales, as of <the manifest's date>." and
   the methods line from the email.

The charts are inline SVG drawn on the server (`components/tide/issue-chart.tsx`, geometry in
`lib/tide/chart.ts`), no chart library. Each market keeps one color and one end-marker shape:
Lakewood Ranch Harbor 800 (circle), Sarasota amber (square), Bradenton Sky 600 (diamond). Each line
has a direct end label and the legend sits above. There are two drawings of the same data: a wide
one from 640px up and a narrow one below it (every third month labelled). Hovering a point shows
its value, and a visually hidden `<table>` under each chart carries every value for screen readers.

### Adding next month's issue

One entry at the top of `TIDE_ISSUES` in `lib/tide/issues.ts`:

```ts
{ issue: "2026-11" },
```

Merge a sales-data refresh first (see "The data refresh" above). Without `data`, the page takes the
latest complete month; once the issue is out, write the month in (`{ issue: "2026-11", data:
"2026-08" }`) so a later refresh doesn't move it on. Then write the narrative (below) and add any
note Joelyn or Jessica sends as `commentary: { joelyn: ["…"], jessica: ["…"] }`, word for word.
Check the page with `npm run build && npm run start`, then `/tide/2026-11`. A month the data no
longer reaches (the window is 24 months) is a 404, not a page of zeros.

### Writing the narrative

Each issue's story is written by hand, once a month, in the entry in `lib/tide/issues.ts`. Prose
computed from numbers reads as templated, so nothing generates it; instead, the numbers in it are
checked against the page.

1. Start from the facts. The cron's draft on the 1st lists them ("Facts to write from"), or run
   `npm run issue:preview -- tide` and read the box at the top of `scratchpad/issues/tide-*.txt`.
   The page itself has the rest: the typical month under each figure, the twelve months on the
   charts, the busiest streets.
2. Pick the one or two things that changed most for a buyer or a seller. A month where the median
   price rose but the price per square foot didn't is a story about which homes sold, not about
   prices; say so plainly.
3. Write four fields, short:
   - `opening`: one paragraph, two to four sentences, that tells the month as something a person
     can picture ("Picture someone house hunting in Bradenton in July. They had lots of
     company.").
   - `buyers` and `sellers`: one paragraph each, two to four sentences, on what to do differently
     because of this month. Name the places. Be honest about what county records can't tell
     (asking prices, how long homes sat, how many are for sale): the page says it under the two
     cards, so don't imply them.
   - `watch`: one or two things to look for next month, a sentence or two each.
   A reader should get the whole issue in about three minutes.
4. Run `npm run test:unit`. `lib/tide/narrative.test.ts` builds the issue from `data/sales` and
   fails on any number in the narrative that the page doesn't compute, within rounding (half a
   point on a percent; 1% on a dollar figure or a count, so "about $400,000" for $399,450 passes).
   The figures it knows are every number on the page plus the differences a writer quotes: against
   the typical month and against the month before, in sales, dollars and percent. Write figures in
   digits ("12%", "1,080"); a figure spelled out ("twelve percent") fails, since the check can't see
   it. It also checks the shape (sentence counts above), a reading level of about sixth grade (the
   Flesch-Kincaid grade of the whole narrative at 6.5 or under) and no sentence over 24 words.
5. A data refresh that changes a published month's figures can fail that test. That's on purpose:
   the words no longer match the record. Rewrite the sentence from the new figures.
6. `npm run check:copy` (and every build) runs the voice rules, Fair Housing and the
   places-not-people rules over every narrative and note.

The October 2026 issue (data month July 2026) is the worked example.

### The voice

Plain, direct and warm. The owner's words: "Very plain language, very direct, very warm. Use
storytelling." And: "zero AI tells".

- Short sentences, contractions, everyday words, about a sixth-grade reading level. Say "the
  median price" and "a square foot", not "$/sqft".
- Tell it as a story a person can picture, then the figure. Second person for advice ("If a home
  you like is priced well above that for its size, ask why.").
- No questions, no exclamation marks, no superlatives, no adjective a number doesn't back.
- Places and homes, never people: no "families", "retirees", "young professionals" or any group
  as a target. No license numbers.
- Every number comes from the page. County records aren't MLS data: never imply days on market,
  list prices, price cuts or inventory.
- The narrative is the site's, unsigned. Never write in Joelyn's or Jessica's voice, never say
  "we" for them, and never claim anything about how they work. Their notes are theirs, word for
  word, and a few sentences at most.
- None of the phrases in `lib/voice.ts`, which `npm run check:copy` flags across the whole site:
  "the read", "the mark", "the takeaway", "the bottom line", "delve", "dive in", "deep dive",
  "landscape" as a figure of speech, "navigate", "tapestry", "testament", "it's worth noting", "in
  today's market", "here's the thing", "let's", "game-changer", "unlock", "robust", "seamless",
  "elevate", "nestled", "vibrant", "bustling", "a whole new", "isn't just" and "not just X, but
  Y", "whether you're X or Y", "at the end of the day", "buckle up", "spoiler", a colon-led reveal
  ("The answer:"), "lands" as a verb, and a short hook question answered straight after
  ("Wondering what your home's worth? Start with…"). The rules use word boundaries and context,
  so "the market", a person named Mark, "elevating or rebuilding" a house in a flood zone and a
  real question ("What is a CDD?") pass; `lib/voice.test.ts` holds the cases both ways.

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
  "text": "TIDE · HOW HOME SALES WENT IN JULY 2026…",
  "period": { "from": "2026-07-01", "to": "2026-07-31", "label": "July 2026" },
  "preheader": "How home sales went in July 2026 in Lakewood Ranch, Sarasota and Bradenton, and what it means if you’re buying or selling.",
  "needsEdit": true,
  "placeholder": "Fill in or delete every dashed box before sending.",
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
3. For Tide, fill in or delete each dashed box (the story, if it isn't written yet, and the two
   notes), and delete the "Facts to write from" box.
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
| `lib/tide/issue.ts` | The web issue's model (pure): data month, figures, typical months, chart data, streets, guides. |
| `lib/tide/issues.ts` | The list of web issues, with each one's hand-written narrative and the signed notes. |
| `lib/tide/notes.ts` | Reads the narrative and decides which signed notes show. |
| `lib/tide/narrative.ts`, `lib/tide/narrative.test.ts` | The figures a narrative may quote, the number check, the facts to write from; the tests check the October 2026 narrative against `data/sales`. |
| `components/tide/team-notes.tsx` | The "From Joelyn and Jessica" slots. |
| `lib/voice.ts`, `lib/voice.test.ts`, `scripts/copy-literals.mjs` | The phrases that read as machine-written, and the source scan that runs them over the whole site in `npm run check:copy`. |
| `lib/tide/copy.ts` | Every fixed string on the web issue, `/tide` and the archive card, and the "facts to write from" lines. |
| `lib/tide/chart.ts`, `components/tide/issue-chart.tsx` | Chart geometry and the server-drawn SVG. |
| `lib/tide/load.ts` | Server: loads the sales, the manifest and the posts for a web issue. |
| `app/(site)/tide/` | `/tide`, `/tide/<issue>` and its share image. |
| `lib/tide/issue.test.ts` | Unit tests on a twelve-month, three-market fixture. |
| `docs/screenshots/tide/` | The web issue at 1440 and 390, the charts, `/tide` and `/blog`. |
