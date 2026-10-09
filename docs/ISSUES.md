# Newsletters: Encore every Monday, Tide each month

The site promises two emails on its forms: **Encore**, the arts calendar, every Monday (the
`calendar` form), and **Tide**, one letter on the market, once a month (the `letter` form). This
document covers how each issue is built, how it reaches the team, and how the site sends it to the
people who subscribed.

**The rule:** the site emails a subscriber only after they confirm (double opt-in), only the list
they confirmed, and never an address that has unsubscribed from everything. Each issue goes to the
team first. Tide goes to subscribers two days later, on the 3rd; Encore two hours later, on Monday
morning. Either waits if someone on the team presses "Hold this issue" in the team email, until
someone presses "Send it now". Every email to a subscriber carries the brokerage name, the office
postal address and a one-click unsubscribe. The site sends through Resend from
`mail.jjpremiergroup.com` (`NEWSLETTER_FROM`); with any of the variables in "Environment variables"
missing, nothing goes to subscribers, the logs say so in one line, and the team hand-off works
exactly as before (the agents send it by hand, "Sending by hand" below).

## Who gets what

| Someone… | Gets |
|---|---|
| Subscribes in the Tide box (`letter` form) | One email asking to confirm Tide. Nothing else until they press its button. |
| Subscribes in the Encore box (`calendar` form) | The same, for Encore. |
| Ticks the email box on any other form ("Yes, you can email me about the market and my search") | The confirmation for Tide, worded for that ("When you wrote to us…, you said we could email you"). |
| Presses "Yes, send me Tide" on `/subscribe/confirm` | The opt-in time is recorded (`newsletter_subscriptions.confirmed_at`, and a `newsletter_confirmed` event), then a short welcome: Tide's links the newest `/tide/<issue>` page, Encore's links `/calendar`. |
| Is confirmed | Each issue of that list from then on. |
| Signs up again while pending | Another confirmation, at most one every ten minutes. Already confirmed: nothing. |
| Unsubscribes from one list | Nothing more from that list. The other list, if any, carries on. |
| Unsubscribes from everything, or has `contacts.unsubscribed_email` on any row | Nothing, ever, not even a confirmation. `contacts.unsubscribed_email` is the authoritative "never email this address"; to let the person sign up again, a person clears it (below). |

The confirm link is signed (HMAC-SHA256 with `NEWSLETTER_SECRET`) and good for 7 days. Opening it
shows a button; only pressing it confirms, because mail scanners open every link in an email and
would otherwise confirm addresses nobody checked. The state machine is `lib/newsletter/state.ts`.
Rehearsal leads (`scripts/test-lead.mjs`) never subscribe.

## The flow

```
                                   the 1st, 12:00 UTC                 Mondays 10:00 UTC
Vercel Cron ──GET + Bearer CRON_SECRET──▶ /api/issues/tide            /api/issues/encore
   │
   ├─ lib/issues/load.ts          gathers the inputs: the Encore index, the county sales, the settings
   ├─ lib/issues/encore-weekly.ts builds the issue (pure: HTML, text, subject, warnings)
   │  lib/issues/tide-monthly.ts
   ├─ subscriber send on record   lib/newsletter/service.ts prepareIssueSend: one issue_sends row per
   │                              issue (kind + period), status "scheduled", or "held" by the system
   │                              (a Fair Housing flag, a Tide month that isn't complete, no street
   │                              address in settings). A re-run finds the row and leaves it alone.
   ├─ Fair Housing check          lib/fair-housing.ts over the whole issue; a flag holds the hand-off
   ├─ team email                  Resend → TEAM_NOTIFY_EMAIL, "Encore for Monday <date>: ready to send"
   │                                                        "Tide, <Month YYYY>: ready to send"
   │                              a note and the warnings; when it goes to subscribers and to how many;
   │                              the "Send it now" and "Hold this issue" buttons; the issue itself; and
   │                              the issue attached as <kind>-<period>.html and .txt
   └─ webhook (optional)          POST JSON → ISSUE_WEBHOOK_URL (Zapier Catch Hook), 8s timeout, one retry

                                   the 3rd, 13:00 UTC                 Mondays 12:00 UTC
Vercel Cron ──GET + Bearer CRON_SECRET──▶ /api/newsletter/send/tide   /api/newsletter/send/encore
                                          /api/newsletter/send/all    (daily 13:30 UTC: what the cap left over)
   │
   ├─ each due issue_sends row that isn't held, oldest first
   ├─ rebuilds the issue for subscribers  today's code and data, so a Tide story or note written and
   │                                      deployed by the 3rd goes in; no dashed boxes, no facts list
   ├─ checks again                        Fair Housing, no box or placeholder left, a postal address;
   │                                      any failure holds the send and nothing goes
   ├─ the confirmed subscribers           newsletter_subscriptions, status confirmed, leaving out any
   │                                      address with contacts.unsubscribed_email
   ├─ claims each address                 a newsletter_deliveries row per address, unique per issue,
   │                                      written before the batch goes: a re-run or a second run at
   │                                      the same time can't send to it again
   ├─ Resend POST /emails/batch           up to 100 a call, one second apart, each with its own
   │                                      unsubscribe links and List-Unsubscribe headers, and an
   │                                      Idempotency-Key per batch
   └─ the daily cap                       NEWSLETTER_DAILY_CAP (default 100) counts every subscriber email
                                          sent that UTC day (confirmations and welcomes too); what's over
                                          waits for the next day's /send/all run
```

The cron times are UTC. 10:00 UTC is 6am in Sarasota during daylight time and 5am in winter;
12:00 UTC on the 1st is 8am or 7am. The sends: Tide on the 3rd at 13:00 UTC is 9am in daylight time
and 8am in winter; Encore on Monday at 12:00 UTC is 8am or 7am. (On Vercel's Hobby plan a cron can
fire any time within its hour.) Vercel Cron sends a `GET`; the routes also accept a `POST` with the
same header for a manual re-run. Vercel can, rarely, deliver a cron run twice; for the hand-off a
second run sends a second team email and a second webhook POST, so a Zap that does more than create a
draft should skip a `kind` + `period.from` it has already seen. A second send run sends nobody
anything twice.

### Hold and send

The team email's two buttons are signed links (`NEWSLETTER_SECRET`, three weeks) to
`/api/newsletter/issue`. Each opens a page that says what will happen, with one button; nothing
happens until it's pressed.

- **Hold this issue**: the issue doesn't go out at its time. A hold pressed while an issue is going
  out stops the batches still to come.
- **Send it now**: sends at once to every confirmed subscriber, as far as today's cap allows (the rest
  go the next day), whether the issue was held or not yet due. It still refuses an issue the Fair
  Housing checker flags, or one with no postal address in settings.
- A Tide month that isn't complete starts held: it goes only if someone presses "Send it now".
- An issue is never sent twice. A send that hasn't gone out by its end is dropped: Encore at the end
  of its week, Tide fourteen days after its date. If the hand-off was run late (by hand after the
  nominal time), the send is pushed to at least a day later for Tide and an hour later for Encore, so
  there's always time to hold it.
- If the Monday preview didn't run, there's no send on record and Encore doesn't go that week. Re-run
  the preview (`POST /api/issues/encore`) and it's scheduled an hour out.
- If an issue's month was already sent (Tide on a month the county data hasn't moved past), the team
  email says so and nothing is sent again.

## Endpoints

| Request | Who | What it does |
|---|---|---|
| `GET /api/issues/encore?secret=<ISSUE_PREVIEW_SECRET>` | anyone with the preview secret | The Monday issue for the week on or after today (America/New_York) as HTML. `&format=text` for the plain-text version, `&date=YYYY-MM-DD` for another week. 404 without the secret, or when the secret is unset. |
| `GET /api/issues/tide?secret=<ISSUE_PREVIEW_SECRET>` | same | The issue for the latest month complete in all three markets (see "The month" below). `&month=YYYY-MM` for a named month, `&date=` to move "today", `&format=text`. |
| `GET` or `POST` `/api/issues/{encore,tide}` with `Authorization: Bearer <CRON_SECRET>` | Vercel Cron, or a person re-running a hand-off | Builds the issue, puts the subscriber send on record (when subscriber email is on) and hands it off. Returns JSON: `{ ok, kind, period, subject, fairHousing, held, teamEmail, webhook, warnings, subscriberSend }`. 200 when the team email or the webhook took it; 422 when it was held from the webhook (a Fair Housing flag, or a Tide month that isn't complete), with an alert to the team instead; 502 when neither path took it. `POST` without the header is 401. |
| `GET` or `POST` `/api/newsletter/send/{tide,encore,all}` with `Authorization: Bearer <CRON_SECRET>` | Vercel Cron, or a person | Sends every due, unheld issue of that kind (`all`: any kind) to its confirmed subscribers under the daily cap. JSON: `{ ok, enabled, runs: [{ kind, period, decision, status, sentThisRun, failedThisRun, unknownThisRun, deferred, error? }] }`. With subscriber email off: `{ ok: true, enabled: false, missing: [...] }` and nothing sent. 401 without the header. |
| `GET` / `POST` `/api/newsletter/issue?t=<token>` | the team, from the team email | The "Send it now" and "Hold this issue" links. GET shows a page with one button; the POST from it acts. |
| `GET` / `POST` `/subscribe/confirm?t=<token>` | the subscriber | The confirm link. GET shows a button; pressing it confirms and sends the welcome. |
| `/unsubscribe?s=<subscription>&sig=<HMAC>&list=tide\|encore\|all` | the subscriber | The footer links. A page with "Stop Tide" (or Encore) and "Stop all email from us"; the POST from a button does it. The older `?id=<contact>&sig=` links still work and stop everything. |
| `POST /api/newsletter/unsubscribe?s=&sig=&list=` | the subscriber's mail app | One-click unsubscribe (RFC 8058), from the `List-Unsubscribe` header: unsubscribes from that list at once. A GET redirects to `/unsubscribe`. |

The secret is compared in constant time. The preview is `no-store` and `noindex`; `/api/` is
also disallowed in robots.txt.

```bash
# Look at next Monday's issue
open "https://jjpremiergroup.com/api/issues/encore?secret=$ISSUE_PREVIEW_SECRET"
# Tide for July, plain text
curl -s "https://jjpremiergroup.com/api/issues/tide?secret=$ISSUE_PREVIEW_SECRET&month=2026-07&format=text"
# Re-run the Tide hand-off for July (emails the team, posts to the Zap; the send on record is left as it is)
curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "https://jjpremiergroup.com/api/issues/tide?month=2026-07"
# Carry on any send the daily cap cut short, now rather than at 13:30 UTC
curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "https://jjpremiergroup.com/api/newsletter/send/all"
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
  narrative" below). The headline, once written, is the title under the wordmark and the dek is the
  preheader and the first lines; then the story (`opening`) in place of the plain intro; "If you're
  buying" and "If you're selling" as three numbered moves each (the move, why, and its link, tagged
  like every other link), or the first format's single paragraph, with the line on what county
  records can't show; each market's written paragraphs in place of its computed one, and its one
  move under them, set off with an amber rule; and "What to watch next month". A field that isn't
  written falls back to the computed line or is left out. The loader (`lib/issues/load.ts`) takes
  the entry pinned to the month the email covers, or the unpinned entry for this month's issue.
  **Until the story (`opening`) is written**, the draft opens with a dashed box, "Facts to write
  from", listing the month's notable figures (`writingFacts` in `lib/tide/narrative.ts`: the
  largest change against a typical month; the three markets together against their typical month
  and the same month a year before; each market's figures against its typical month, the month
  before and the same month a year before; its sales by kind of home and by price band; where the
  median price and the price per square foot part ways; the busiest and quietest months on the
  chart; the busiest street), and a dashed box where the story goes. Both are for the writer, never
  a reader.
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
phone; why the reader has it; how to stop; Equal Housing Opportunity. No license numbers.

How to stop depends on who sends it. In what the site sends a subscriber: "To unsubscribe: Stop
Tide or stop all email from us. You can also reply ‘stop’.", the two links signed for that
subscriber, plus the `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
headers (RFC 8058) that put an Unsubscribe button in Gmail, Apple Mail and Outlook. In the team's
copy and the webhook payload: "To unsubscribe: Reply 'stop' or use the link in the email you
received.", for a send tool that adds its own link. The subscriber copy is built with placeholders
for the two links and each recipient's are put in at send time (`lib/newsletter/emails.ts`
`personalize`), so the issue is built once per send.

While `officeAddress.street` and `zip` are empty in `lib/content/seed/settings.ts`
(docs/LAUNCH.md 1.1) the footer shows only "Lakewood Ranch, FL" and every hand-off carries a
warning: **CAN-SPAM needs a valid postal address in every send.** The site won't send an issue to
subscribers until it's filled in: the send is held, and the team email says why.

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

The page is a long monthly letter: the story first, then each place as a chapter, then what to do.
Every hand-written field is optional, and each section shows what's written and falls back to
computed lines (or leaves its slot out) for the rest, so the page reads as finished at every stage.
The sections, always in this order:

1. **Cover.** The month's photograph full-bleed under the harbor wash (`components/tide/cover.tsx`,
   with the guide covers' `.guide-cover-*` classes); the header sits over it. "Tide · October 2026",
   then the `headline` in the display face (until it's written: "Home sales in July 2026"), the
   `dek` (until then: "Here's how Lakewood Ranch, Sarasota and Bradenton did, with every number from
   the county's public record."), and the mono line "Figures for July 2026 from the county record ·
   8 min read". The reading time is computed from the words on the page (200 a minute, plus a minute
   for every three figures). From 1024px up the issue's contents run along the foot as anchor links.
   The cover rotates through three photos by issue month (`lib/tide/cover.ts`).
2. **The story.** `opening`, three to five paragraphs at about 66 characters a line, the first with
   a drop cap, then the line on why this month ("The county posts sales a few weeks late…"). Before
   the story is written the section is "About this issue" and carries that line alone.
3. **One big figure.** The three markets' home sales together, very large on the dark harbor band,
   with one computed line under it ("home sales across the three markets in July, 7% more than a
   typical month"), the typical month and the same month a year before, and each market's share as
   a thin bar.
4. **Three market chapters** (`components/tide/market-chapter.tsx`), one per market: the name set
   big; a quiet strip with the month's sales (against a typical month and the same month a year
   before), the median price, the median per square foot and the new-build share, each with its
   typical month and its year-before figure; the market's `markets[slug]` paragraphs, or the
   computed paragraph the email uses until they're written; the twelve-month sales sparkline with
   the typical month dashed; the busiest streets as one line; the price bands as a stacked bar
   (`components/tide/price-bands.tsx`); the kinds of home (`components/tide/home-mix.tsx`); the
   `marketMoves[slug]` line, set apart with an amber rule (only once written); and links to the hub
   and to Atlas filtered to that market (`/neighborhoods?market=<slug>`).
5. **If you're buying, if you're selling** (only once written): three numbered moves each (the move
   in the display face, why in body text, one quiet link), or the first format's paragraph, then the
   line "These are closed sales from county records. They don't show asking prices, how long a home
   was for sale, or how many homes are for sale now."
6. **Twelve months on the record:** the two charts. Home sales each month, the last twelve complete
   months ending with the data month, one line per market, the axis from zero; and the median price
   per square foot each month, the axis from a round step under the lowest value, labelled ("Axis
   starts at $200").
7. **What to watch next month** (only once written): one or two things, from `watch`.
8. **From Joelyn and Jessica:** a short note from each, in her own words, signed with her name
   (`components/tide/team-notes.tsx`). Only a written note shows; with neither written the section
   isn't there. In sample previews (`NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`) an empty slot shows as
   a dashed box marked "Placeholder, not published".
9. **Out this month:** up to three Encore events in the issue month from the live calendar
   (`loadEncoreIndex()`, picked in `lib/tide/encore.ts`: one per market where it can, none sold out,
   leaning to events with their own picture, spread over different days), as event cards. The page
   revalidates hourly so these stay current; a month with nothing left on the calendar drops the
   section.
10. **Read next:** the posts published in the issue month (market reports left out), linked to
   `/guides/<slug>` for the rebuilt guides.
11. **The ask, then method and sources:** the Tide subscribe bar (`components/letter-form.tsx`),
   then, small, the source line with the county files' as-of date, the methods line from the email
   and the Fair Housing line with the Equal Housing mark.

The new figures, all computed in `lib/tide/issue.ts` from the same rows as the rest:

- **The same month a year before** (`lastYear` per market, `combined.lastYear`): its sales, median
  price and median per square foot, and the data month's change against each. Null when the record
  doesn't reach that month (the county files start in October 2024; a county file that starts after
  the month began doesn't count as reaching it).
- **Kinds of home** (`mix`): single-family; condos, villas and townhomes together; and lots the
  county lists as empty (vacant on the roll). Count, whole-percent share of the month's home sales
  (the three add up to 100) and the median price, taken the way the market's median is (land and
  parcels changed since the sale left out).
- **Price bands** (`bands`): under $400K, $400K to $750K, $750K to $1.5M, $1.5M and up, as the share
  of the homes in the median price.
- **All three markets together** (`combined`): the month's home sales, against the median of the
  three markets' combined monthly sales over the twelve months before, and each market's share.

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
3. Write the fields. Each is optional, and the page shows what's there. Think of each section as
   three things: a picture a reader can feel (the elephant), one clear thing to do (the rider), and
   an easy next step (the path).
   - `headline`: one sentence, the month's story, 18 words at most. It's set big on the cover and
     is the email's title.
   - `dek`: one or two sentences under it.
   - `opening`: the story, three to five paragraphs of one to five sentences each, told as
     something a person can picture ("Picture someone house hunting in Bradenton in July. They had
     lots of company."). An issue without a headline (the first format) opens with one paragraph of
     two to four sentences.
   - `markets`: per market (`"lakewood-ranch"`, `sarasota`, `bradenton`), two or three paragraphs,
     the story of that place this month.
   - `marketMoves`: per market, one sentence: the one thing to do if you're buying or selling there.
   - `buying` and `selling`: three moves each, `{ move, why, link? }`. `move` is one short
     imperative sentence (14 words at most); `why` is one to three sentences that make it real;
     `link` is `{ href, label }` to a page on the site: `/sell`, `/sell/home-value`,
     `/sell/net-proceeds`, `/sell/sold`, `/buy`, `/neighborhoods` (with `?market=<slug>` for one
     place), `/neighborhoods/match`, `/relocate`, `/calendar`, `/contact`, a hub, or
     `/guides/<slug>` for a rebuilt guide. The test fails any other.
   - `buyers` and `sellers`: the first format, one paragraph each, read only when `buying` or
     `selling` isn't written.
   - `watch`: one or two things to look for next month, a sentence or two each.
   Be honest about what county records can't tell (asking prices, how long homes sat, how many are
   for sale): the page says it under the moves, so don't imply them. Say "stand-alone houses"
   rather than "single-family" in the words: the places-not-people check reads "family" as a
   familial-status reference (the computed labels on the page aren't run through that rule).
4. Run `npm run test:unit`. `lib/tide/narrative.test.ts` builds the issue from `data/sales` and
   fails on any number in the narrative that the page doesn't compute, within rounding (half a
   point on a percent; 1% on a dollar figure or a count, so "about $400,000" for $399,450 passes).
   The figures it knows are every number on the page plus the differences a writer quotes: against
   the typical month, the month before and the same month a year before, in sales, dollars and
   percent; the kinds of home, the price bands (and the shares under and over each band's edge, so
   "$400K", "$1.5M" and "64% sold under $750K" pass) and the three markets together. Write figures in
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

Subscriber email is on only when all five in the first group are set; with any missing, nothing is
sent to subscribers and one log line names what's missing (`[newsletter] …: subscriber email is off
(missing …)`). `NEWSLETTER_FROM` is new and the switch: set it last, once the domain is verified in
Resend (docs/LAUNCH.md 1.4).

| Variable | New | Example | What it does |
|---|---|---|---|
| `RESEND_API_KEY` | existing | `re_…` | Resend's key, for the team email and for subscribers. Sensitive. |
| `NEWSLETTER_FROM` | yes | `JJ Premier Group <letters@mail.jjpremiergroup.com>` | The From of every email to a subscriber, on the domain verified in Resend. Unset = subscriber email off. |
| `NEWSLETTER_SECRET` | yes | `openssl rand -base64 48` | Signs the confirm links and the team's hold and send links (HMAC-SHA256). 32 characters or more. Changing it voids every link already sent. Sensitive. |
| `UNSUBSCRIBE_SECRET` | existing | `openssl rand -base64 48` | Signs the unsubscribe links (`lib/unsubscribe.ts`). 32 characters or more. Never change it once emails have gone out: every unsubscribe link in them would stop working. Sensitive. |
| `DATABASE_URL` | existing | Supabase pooler URL | The subscriptions and the send records. Migration `0013_newsletter.sql` must be applied. |
| `NEWSLETTER_REPLY_TO` | yes, optional | `joelyn.nauman@cbrealty.com` | Where a subscriber's reply goes, and the `mailto:` in `List-Unsubscribe`. Unset = replies go to the From address, which nobody reads; set it. |
| `NEWSLETTER_DAILY_CAP` | yes, optional | `100` | Subscriber emails a UTC day, all kinds together. Default 100, Resend's free daily limit. On a paid plan, its daily limit. The team email isn't counted, so on the free plan leave a little room (the team gets a few a week). |
| `CRON_SECRET` | existing | | The Bearer token Vercel Cron sends. Unset = neither the hand-off nor the sends can run. |
| `TEAM_NOTIFY_EMAIL` | existing | | Where the finished issue goes, with the hold and send links: one address or several, comma-separated. Unset = no team email, so no way to hold an issue: set it. |
| `RESEND_FROM_EMAIL` | existing | | The From of the team email (the Resend SDK in `lib/email`). |
| `ISSUE_PREVIEW_SECRET` | | `openssl rand -hex 24` | The `?secret=` for the browser previews. Unset = no preview (404). Sensitive. |
| `ISSUE_WEBHOOK_URL` | | | A Zapier Catch Hook that receives each issue. Unset = team email only. Sensitive. |

`GET /api/health` reports `issues: { previewSecret, webhook, teamEmail, resend, cronSecret }` as
booleans and `newsletter: { subscriberEmail, missing, replyTo, dailyCap }` (the names of missing
variables, never values).

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

## Subscribers and sends in the database

Three tables (migration `0013_newsletter.sql`), RLS on with no policies; the site uses
`DATABASE_URL`:

- `newsletter_subscriptions`: one row per address per list (`email` lowercased, unique with
  `list`), `contact_id` (the latest form submission that asked), `status` (`pending`, `confirmed`,
  `unsubscribed`), `source` (the form), and `requested_at`, `confirmation_sent_at`, `confirmed_at`,
  `welcome_sent_at`, `unsubscribed_at`, `unsubscribe_method`.
- `issue_sends`: one row per issue sent to subscribers, unique on `kind` + `period` (Tide's data
  month `YYYY-MM`, Encore's Monday), with `status` (`scheduled`, `held`, `sending`, `sent`,
  `expired`), `scheduled_for`, `expires_at`, `held_by` (`team` or `system`) and `hold_reason`,
  and the counts from the latest run: `recipients`, `sent_count`, `failed_count`, `unknown_count`,
  `deferred_count`.
- `newsletter_deliveries`: every email sent to a subscriber (`kind` confirmation, welcome or issue),
  with Resend's id. For an issue, unique on `issue_send_id` + `email`. `status`: `sent`;
  `failed` (Resend answered no: tried again on the next run, three attempts at most); `unknown` (no
  answer, or a 5xx after a retry with the same Idempotency-Key) and `claimed` (a run that stopped
  between claiming and sending). Neither of the last two is ever sent again automatically, since
  either may have gone out. Look at Resend's log for that address before releasing one by hand:
  `update newsletter_deliveries set status = 'failed' where id = '<id>';`.

```sql
-- Who gets Tide (for Encore, 'encore')
select s.email, s.confirmed_at
from newsletter_subscriptions s
where s.list = 'tide' and s.status = 'confirmed'
  and not exists (select 1 from contacts c where lower(c.email) = s.email and c.unsubscribed_email)
order by s.confirmed_at;

-- How each send went
select kind, period, status, scheduled_for, held_by, hold_reason, recipients, sent_count, failed_count, unknown_count, deferred_count, last_error
from issue_sends order by scheduled_for desc limit 10;

-- Today's count against NEWSLETTER_DAILY_CAP
select count(*) from newsletter_deliveries
where status in ('sent', 'claimed', 'unknown') and coalesce(sent_at, created_at) >= date_trunc('day', now() at time zone 'utc');
```

## Unsubscribes

- **The links.** Every email to a subscriber has two links in its footer, to `/unsubscribe`: stop
  this list, or stop everything. The page has a button; the POST from it does it (a GET never does,
  since mail scanners open every link). The links are HMAC-signed over the subscription id with
  `UNSUBSCRIBE_SECRET` and never expire.
- **One click.** The `List-Unsubscribe` header points at `/api/newsletter/unsubscribe`, and
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` lets the mail app POST there: that list stops
  at once. Gmail and Yahoo expect this from anyone sending to many of their users.
- **Everything** sets `unsubscribed_email = true, consent_email = false` on every `contacts` row for
  the address, sets each of its subscriptions to `unsubscribed`, and logs an `unsubscribed_email`
  event. One list logs `unsubscribed_newsletter`. Both are kept by the retention job (0009).
- **A reply that says stop**, or anything like it, is an unsubscribe from everything. Honor it
  within 10 business days (CAN-SPAM); in practice the same day:

```sql
update contacts set unsubscribed_email = true, consent_email = false where lower(email) = lower('<address>');
update newsletter_subscriptions set status = 'unsubscribed', unsubscribed_at = now(), unsubscribe_method = 'manual'
where email = lower('<address>') and status <> 'unsubscribed';
```

- **Letting someone back in.** An address with `unsubscribed_email` gets nothing, not even a
  confirmation, however many times it signs up. If the person asks in writing to get the
  newsletters again, clear the flag and have them sign up on the site, which sends a new
  confirmation:

```sql
update contacts set unsubscribed_email = false where lower(email) = lower('<address>');
```

The older links signed over a contacts row (`/unsubscribe?id=<contact id>&sig=`) still work and stop
everything.

## Sending by hand (subscriber email off)

Until the variables above are set, or if the site's sending is ever switched off (unset
`NEWSLETTER_FROM`), the hand-off works as before and the team sends each issue itself, from the team
email or the webhook:

- **The Marketing Center** (Home Platform), if the agents have it: export the confirmed subscribers
  (the first query above) as CSV, import them as a list, and paste the attached `.html` into a
  custom-HTML template. For Tide, fill in or delete each dashed box and delete the "Facts to write
  from" box first. The Marketing Center adds its own unsubscribe link; copy its unsubscribes back to
  Supabase (the SQL above).
- **Zapier → Outlook** (`cbrealty.com` is Microsoft 365 with DMARC `p=reject`, docs/LAUNCH.md 1.7):
  Catch Hook (`ISSUE_WEBHOOK_URL`) → Filter → Microsoft Outlook "Create Draft Email". Never wire an
  automatic send for Tide (stop on `needsEdit` = true). Each message needs its own unsubscribe
  link; past a few dozen subscribers this is the wrong tool.

Don't do both: with subscriber email on, an issue sent by hand as well reaches people twice.

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
| `lib/newsletter/config.ts` | The switch: whether the site sends to subscribers, and with what (pure). |
| `lib/newsletter/lists.ts` | The two lists and which form asks for which (pure). |
| `lib/newsletter/state.ts` | The subscription state machine (pure). |
| `lib/newsletter/token.ts` | Signed, expiring links: confirm, hold, send (pure). |
| `lib/newsletter/schedule.ts` | When each issue goes out, and the hold or send decision (pure). |
| `lib/newsletter/batch.ts` | Who gets the next batch, the daily cap, the idempotency key (pure). |
| `lib/newsletter/headers.ts` | The unsubscribe links and the List-Unsubscribe headers (pure). |
| `lib/newsletter/emails.ts` | The confirmation and welcome emails, and the per-recipient links (pure). |
| `lib/newsletter/copy.ts` | Every sentence in the subscriber emails and their pages; checked by `npm run check:copy`. |
| `lib/newsletter/resend.ts` | Resend's REST API through `fetch`: one email or a batch of 100. |
| `lib/newsletter/service.ts` | Server: subscribing, confirming, unsubscribing, putting a send on record, sending. |
| `lib/newsletter/*.test.ts` | Unit tests: tokens, the state machine, batching and the cap, idempotency, hold or send, the headers, the emails, the Resend calls. |
| `app/api/newsletter/send/[kind]/route.ts` | The send crons. |
| `app/api/newsletter/issue/route.ts` | The team's "Send it now" and "Hold this issue" page. |
| `app/api/newsletter/unsubscribe/route.ts` | One-click unsubscribe (RFC 8058). |
| `app/(site)/subscribe/confirm/` | The confirm page. |
| `app/unsubscribe/` | The unsubscribe page: one list or everything. |
| `lib/db/migrations/0013_newsletter.sql` | The three tables. |
| `app/api/issues/encore/image/[slug]/route.ts` | The lead pick's PNG for the Monday issue. |
| `scripts/issue-preview.mjs` | Local render to files. |
| `docs/screenshots/issues/` | The two previews at 600px. |
| `lib/tide/issue.ts` | The web issue's model (pure): data month, figures, typical months, chart data, streets, guides. |
| `lib/tide/issues.ts` | The list of web issues, with each one's hand-written narrative and the signed notes. |
| `lib/tide/notes.ts` | Reads the narrative and decides which signed notes show. |
| `lib/tide/narrative.ts`, `lib/tide/narrative.test.ts` | The figures a narrative may quote, the number check, the facts to write from; the tests check the October 2026 narrative against `data/sales`. |
| `components/tide/team-notes.tsx` | The "From Joelyn and Jessica" slots. |
| `components/tide/cover.tsx`, `market-chapter.tsx`, `moves.tsx`, `sparkline.tsx`, `price-bands.tsx`, `home-mix.tsx` | The web issue's cover, market chapters, buying and selling moves, and the small drawings in each chapter. |
| `lib/tide/cover.ts` | The three cover photos and which issue month takes which. |
| `lib/tide/encore.ts`, `lib/tide/encore.test.ts` | "Out this month": the Encore picks for the issue month. |
| `lib/voice.ts`, `lib/voice.test.ts`, `scripts/copy-literals.mjs` | The phrases that read as machine-written, and the source scan that runs them over the whole site in `npm run check:copy`. |
| `lib/tide/copy.ts` | Every fixed string on the web issue, `/tide` and the archive card, and the "facts to write from" lines. |
| `lib/tide/chart.ts`, `components/tide/issue-chart.tsx` | Chart geometry and the server-drawn SVG. |
| `lib/tide/load.ts` | Server: loads the sales, the manifest and the posts for a web issue. |
| `app/(site)/tide/` | `/tide`, `/tide/<issue>` and its share image. |
| `lib/tide/issue.test.ts` | Unit tests on a twelve-month, three-market fixture. |
| `docs/screenshots/tide/` | The web issue at 1440 and 390, the charts, `/tide` and `/blog` (from before the letter layout). |
