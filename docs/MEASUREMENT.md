# Measurement — what the site counts, and how it maps to the growth funnel

Plausible is the only analytics on the site (cookieless, no consent banner). It loads only when
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set (production only; never on previews), with the
`outbound-links` and `tagged-events` extensions. Every custom event goes through `track()` in
`lib/analytics.ts`, which is a no-op when the script isn't there; the server sends one more
(`Lead server`) from `lib/plausible-server.ts`. The CRM side of the same funnel is the tag list on
every lead (`lib/crm.ts` `leadTags`).

The funnel below is section 10 of the growth plan (Reach → Traffic → Capture → Engage → Convert,
plus Reputation, Referral and Links). Each row says which goal or report answers it, or that the
answer lives outside the site.

## 1. Every goal the site fires

Grepped from `track(`, `TrackedLink event=` and `sendPlausibleEvent(` on 2026-10-01.

| Goal | Fired from | Props and their values |
| --- | --- | --- |
| `Lead` | `components/thanks-goal.tsx` on `/thanks/<form>`, once per page view, for contact, buy, sell, listing, valuation and referral (`letter` and `calendar` count as `Subscribe`, `review-permission` as `Review permission`) | `form`: contact, buy, sell, listing, valuation, referral · `market`: lakewood-ranch, sarasota, bradenton or none · `source`: youtube, instagram, facebook, nextdoor or none (the `/from/<channel>` page the visit came through) |
| `Subscribe` | `components/letter-form.tsx` inline on success (the Tide band, the blog, the calendar's Encore row, the `/from/*` Tide bar); `/thanks/letter` and `/thanks/calendar` when a bar is set to redirect | `form`: letter (Tide) or calendar (Encore) · `source`: the channel, only when there is one (the thank-you page sends `none` and `market` as well) |
| `Review permission` | `/thanks/review-permission` after the `/reviews` form | `form`: review-permission · `market`: none · `source` |
| `Lead server` | `lib/lead-pipeline.ts` step 5, from the server, for every form | `form` · `channel`: server. A backstop for visitors whose ad blocker stops the script. Never add it to `Lead`: the two count the same submission |
| `Calendar feed` | the ICS links: `/calendar` (the Encore row and the header's Subscribe), the event page, the visit plan, the relocation plan | `kind`: feed, list, event, performance, plan, relocate · `filter`: all, the feed query (`category=music&market=sarasota`), the event slug, or `<n> events` for a saved list |
| `Phone tap` | `tel:` and `sms:` links | `where`: header, footer, action-bar, action-bar-text, contact, contact-text, thanks, thanks-text, from-youtube, from-instagram, from-facebook, from-nextdoor |
| `Share` | `components/share-button.tsx` | `what`: calendar-view, event, explorer-view, match, my-list, place, place-page, visit-plan |
| `Explore` | the tools | `action`: select and filter (Atlas map), match (Atlas match), calendar-day (Encore), visit-plan (Encore plan), relocate-plan, sold-search, home-value, net-proceeds, hub (a click to a market hub; `where`: footer, `hub`: the slug; see the note below), channel-cta and channel-more (the `/from/*` buttons; `channel` and `to` the destination path) |
| `Search` | `components/search/search-goal.tsx` on `/search`, once per query shown | `results`: 0, 1-3, 4-9 or 10+. The query text is never sent: people type names and addresses into search boxes |
| `Outbound Link: Click` | automatic (outbound-links extension) | `url`. Covers the Google review link on `/reviews`, the footer's social links, ticket links, the listings link |
| pageviews | automatic | path, entry page, source, UTM. The `/from/*`, `/refer`, `/reviews` and the market hub pages are plain pageviews |

**The footer's three hub links use the class method, not `track()`.** They stay `next/link` (client
navigation and prefetch) and carry Plausible's tagged-events classes:
`plausible-event-name=Explore plausible-event-action=hub plausible-event-where=footer
plausible-event-hub=<slug>`. The tagged-events extension reads those on click; because Next's
`Link` has already called `preventDefault`, the script only records the goal and leaves the
navigation alone. It also adds a `url` prop with the link's address. Everything else above goes
through `track()` or `TrackedLink`.

## 2. The funnel, step by step

| Layer (section 10) | Metric | Where it comes from |
| --- | --- | --- |
| Reach | YouTube views, watch time, subscribers; GBP impressions | Off the site: YouTube Studio, Google Business Profile insights |
| Traffic | Sessions by source | Plausible → Sources (and UTM Sources). A bio link to `/from/<channel>` shows as its referrer (youtube.com, l.instagram.com, …); add `?utm_source=<channel>&utm_medium=social` to the bio link if you want it under UTM too |
| Traffic | Channel landings | Plausible → Top pages, filtered to `/from/` (pageviews of `/from/youtube`, `/from/instagram`, `/from/facebook`, `/from/nextdoor`) |
| Traffic | Channel landing → next step | `Explore` with `action` = channel-cta (the one primary action) or channel-more (Atlas match, plan a visit), broken down by `channel` |
| Traffic | Entry page; market page views | Plausible → Entry pages; Top pages for `/lakewood-ranch`, `/sarasota`, `/bradenton`. Footer clicks into a hub: `Explore` `action` = hub |
| Capture | Guide leads | Not built: there are no guide pages (the site emails no one, so guides are read on the page, ungated, and capture nothing) |
| Capture | Encore subscribers | `Subscribe` with `form` = calendar |
| Capture | Tide subscribers | `Subscribe` with `form` = letter |
| Capture | ICS subscriptions | `Calendar feed` with `kind` = feed (clicks on the subscribe link; fetches by calendar apps aren't counted and the feed URL carries no token) |
| Capture | Valuation requests | `Lead` with `form` = valuation (and `Explore` `action` = home-value for the lookup before it) |
| Capture | Phone and text taps | `Phone tap`, by `where` |
| Capture | Leads by channel | `Lead` and `Subscribe`, broken down by `source`; in the CRM, the `source:<channel>` tag |
| Engage | Open, click, reply rates | Off the site: the email tool that sends Tide and Encore (the site sends nothing) and the CRM |
| Convert | Conversations, appointments, closings by source | Off the site: CRM reports by the `source:` tag (`source:<channel>`, else `source:<utm_source>`, else `source:direct`) |
| Reputation | Google reviews | Off the site: Business Profile. On the site: `Outbound Link: Click` with `url` = the review link, from `/reviews` |
| Reputation | Testimonials with permission | `Review permission` goal; in the CRM, the `form:review-permission` and `consent:review` tags. Nothing from the form is shown on the site |
| Referral | Referral leads | `Lead` with `form` = referral; in the CRM, `form:referral` |
| Links | Referring domains, embeds | Off the site: Search Console, Bing Webmaster Tools |

## 3. Plausible setup, exactly

Site settings → **Goals** → **Add goal** → *Custom event*, one per name (case and spaces matter):

1. `Lead`
2. `Subscribe`
3. `Review permission`
4. `Calendar feed`
5. `Phone tap`
6. `Share`
7. `Explore`
8. `Lead server`
9. `Outbound Link: Click` (sent by the outbound-links extension; add it with exactly this name)

Site settings → **Custom properties** → add each prop name so it can be broken down:
`form`, `market`, `source`, `channel`, `kind`, `filter`, `where`, `what`, `action`, `to`, `hub`,
`url`. (Check the plan: custom properties and funnels aren't on every Plausible tier.)

Saved views worth making on the dashboard (filter, then bookmark the URL):

- **Channel pages**: Page contains `/from/`; then Goals → `Explore`, property `channel`.
- **Leads by channel**: Goal is `Lead`, property `source`.
- **Subscribers**: Goal is `Subscribe`, property `form`.
- **Referrals**: Goal is `Lead`, property `form` is `referral`.

If the plan includes **Funnels**, two are worth defining:

- *Channel to plan*: visit `/from/youtube` → `Explore` (action channel-cta) → visit `/relocate` →
  `Lead`.
- *Neighbor to number*: visit `/from/nextdoor` → `Explore` (action channel-cta) → `Explore`
  (action sold-search) → `Lead`.

## 4. How a channel visit is attributed

1. A visitor opens `/from/youtube` from a bio link.
2. `components/utm-tracker.tsx` stores `channel = youtube` in `sessionStorage` for the visit. If this
   is their first visit in 90 days, the first-touch record in `localStorage` also gets
   `landing_path = /from/youtube`, `utm_source = youtube` when the link carried no `utm_source`, and
   `utm_medium = social` when it carried neither `utm_source` nor `utm_medium`. Tags on the link
   always win.
3. Every form sends the visit's channel as the hidden `source` field (the `/from/*` Tide bar sends
   it directly). `lib/leads.ts` accepts only the four channel names; anything else is dropped.
4. The lead's tags carry `source:youtube` (the channel wins over `utm_source`), the payload carries
   `source.channel`, and the thank-you page's goal carries `source = youtube`.

A returning visitor keeps their original first touch (that's the point of first touch); the
session channel still credits the post that brought them back.
