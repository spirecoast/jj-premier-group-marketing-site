# JJ Premier Group — website build notes

The public site lives in `app/(site)`. It is built from the handoff in `docs/handoff/` and
modelled on the approved homepage composition in
`design/brand-system/JJ Premier Group Website.dc.html` (also deployed at
jj-premier-brand-system.vercel.app).

## Map

| Area | Where |
|---|---|
| Brand tokens (the single definition) | `app/globals.css` `@theme`, `styles/tokens.css`, `docs/handoff/design/BRAND-TOKENS.md` |
| Fonts | `app/layout.tsx` (Newsreader, Cormorant Garamond, Jost, IBM Plex Mono via `next/font`). Only what the first screen draws is preloaded: Newsreader roman (with its optical-size axis, which the display sizes need), Jost and Cormorant, about 180 KB. Newsreader italic is a separate family without the axis, not preloaded, reached through `--font-display-italic` (`.font-display.italic`, `t-quote`, the guide quotes and PDF leads); Plex Mono loads with the page |
| Stylesheets | `app/globals.css` holds the tokens, the base layer, the type and shared components and every utility, and loads on every page. A product's own CSS sits beside it and loads only on the routes that render it: `components/encore/encore.css`, `components/explorer/explorer.css`, `components/guides/guides.css` and `guide-card.css`, `components/sales/street.css`, `components/net-proceeds/net-proceeds.css`, and `app/(print)/print.css` for the guide PDFs. New feature CSS goes in its feature's file, imported by the components that use it |
| Tool state | `lib/url-state.ts` (the rules below, "The tools and the address bar"), `components/url-pending.tsx`, `lib/use-json-resource.ts`, `lib/scroll.ts` |
| Site chrome | `components/site-header.tsx`, `site-footer.tsx`, `mobile-action-bar.tsx`, `app/(site)/layout.tsx` |
| Home page sections | `components/home/*`, in page order: 01 `hero`, 02 `meet`, 03 `doors`, 04 `what-we-do`, 05 `three`, 06 `places`, 07 `find-home`, 08 `questions`, 09 `calendar-preview` (Encore), 10 `letter-band` (Tide); composed in `app/(site)/page.tsx`. The design treatments for 03, 04 and 05 live in `components/home/variants/` and are chosen by the `variant` default in `doors.tsx`, `what-we-do.tsx` and `three.tsx`; the gallery is `docs/screenshots/home-design/index.html` |
| Component library | `components/*` (cards, bands, forms, headings, wordmark, CB mark, Equal Housing mark) |
| Data portraits | `lib/art/*` (pure geometry: Tide ridgeline, Atlas star chart, Encore season clock, with tests) and `components/art/*` (the server components that load the data and draw the SVG); on the home page's 05 and as Tide's masthead via `lib/content/mastheads.ts` |
| Content types and data API | `lib/content/` — pages call `getListings()`, `getUpcomingEvents()`, … and never touch a source |
| Sample content | `lib/content/seed/` (used until Sanity is configured; also the seed for `scripts/seed-sanity.ts`) |
| Sanity | `sanity/` (schemas, clients, queries, fetch helper), `sanity.config.ts`, Studio at `/studio` |
| Lead capture | `actions/submit-lead.ts` (the one server action), `lib/lead-pipeline.ts` (Postgres, then after the response the CRM → team email → Plausible), `lib/lead-outbox.ts` (retries), `lib/lead-guard.ts` (resends, rate limit, honeypot), `lib/crm.ts` (provider switch: Zapier webhook, Follow Up Boss, none), `lib/leads/` (`constants.ts` and `rules.ts` for the browser, `schema.ts` with zod for the server, `pixel.ts`), `lib/phone.ts`, `lib/lead-alert.ts`, `lib/lead-sinks.ts`, `app/(site)/thanks/[form]`, `app/api/leads`, `app/api/health`, `app/api/cron/lead-redeliver`, `scripts/test-lead.mjs` |
| Platform routes | `app/api/revalidate` (Sanity webhook), `app/api/draft-mode/*`, `app/api/calendar.ics`, `app/api/cron/archive-events`, `app/api/cron/lead-redeliver`, `app/api/cron/ops-check`, `app/api/search/reindex`, `app/sitemap.xml` (index) and `app/sitemaps/sitemap.ts` (`lib/sitemap.ts`), `app/robots.ts`, `app/llms.txt`, `app/llms-full.txt` |
| Site search | `lib/search/*` (chunks, indexer, scored hybrid query, fallback, `eval/`), `app/(site)/search`, `app/api/search`, `components/search/*`, `supabase/functions/embed`, `scripts/search-eval.ts`, migrations `0010_search.sql` and `0011_search_score_fusion.sql`; see "Site search" below |
| SEO | `lib/seo.ts` (metadata + JSON-LD helpers), `components/json-ld.tsx` |
| Analytics | `components/analytics.tsx` (Plausible, env-gated), `lib/analytics.ts` (custom events), `lib/plausible-server.ts` (server-side Lead/Subscribe) |
| Encore dataset | `lib/content/encore/encore-calendar.json` (the source), `lib/content/encore.ts` (the converter) |
| Neighborhood explorer | `components/explorer/*` (map, panel, card), `components/place-map.tsx`, `lib/neighborhoods/*` (data access, search, URL state, brand map style) |
| Neighborhood dataset | `neighborhood-data/` (the catalog, its schema, scripts and docs; see its `CLAUDE-CODE-HANDOFF.md`) |

The team's CRM is Coldwell Banker's Home Platform. The site has no agent dashboard, sign-in, tasks,
drips or lead routing; leads reach the Home Platform through the Zapier webhook (`lib/crm.ts`).
Supabase (through Drizzle) holds the lead mirror, the consent records, the questionnaire and the
search index; Resend sends only team-facing email.

## Names, places and what is deliberately not on the page

- Markets: Lakewood Ranch, Sarasota and Bradenton. Tampa was removed in September 2026 at the
  client's direction; `MarketSlug` has three values.
- Photographs: sources stay JPEG under `public/images` (2560px max on the long side); `next.config.ts`
  asks the image optimizer for AVIF first and WebP second, so browsers never receive the source
  file. Every photo goes through `components/photo.tsx`, which gives every box the same treatment:
  square corners, a crop to the box's shape (cards 3:2, the event hero 21:9), and, given the box's
  `frame`, a picture whose shape is far from it shown whole on a blurred copy of itself (Encore tiles
  learn the shape on load, since the index carries no dimensions). Type over a card photograph sits
  on the one `.scrim`; heroes keep `.hero-shade`. Credits are `.image-credit` under a picture and
  `.image-credit-on` as the chip in a card's corner. Provenance, as of October 2026:
  six library files are Adobe Stock photos the client supplied on September 22, 2026
  (`venice-pier-sunrise`, `gulf-beach-aerial`, `modern-home-pool-dusk`, `kitchen-navy-island`,
  `kitchen-white-palms`, `lakes-aerial-sunset`); two came from the team in Slack
  (`culture-opera-house-red-seats`, `lwr-fairways-bay-aerial`; the second looks like the same
  Gasparilla Island golf course as Adobe Stock 1149024203, not Lakewood Ranch, so its alt text no
  longer names a place and Waterside doesn't use it); fifteen are free Adobe Stock
  photos licensed through the Adobe connector on October 2, 2026 (plus `interior-living-kitchen-palm`,
  338902584, a real photograph, not generative, licensed October 11 for the home page's Work with
  Joelyn and Jessica band, and `living-oceanfront-white`, 1233189479, also not generative, licensed
  October 11 for the home page's Seller tile; and more licensed October 11 for the buyer's and
  seller's guides, none generative: `screened-pool-lanai` (239082656), the two page heroes
  `hero-waterfront-palms-dock` (212982756, Fort Lauderdale) and `hero-mediterranean-pool-twilight`
  (129999183), and `backyard-pool-sunset` (470929863)), kept under their old file
  names with the alt text rewritten to describe the new photo: `place-skyway-bridge` (432458105),
  `sarasota-bayfront-blue-hour` (577886062), `place-sea-oats-wind` (1438764162, Anna Maria
  Island), `place-barrier-island` (402902579, Siesta Key Beach), `place-storm-gulf` (194827807),
  `place-sea-oats-dusk` (1868759290), `place-mangrove-tunnel` (214498460), `moment-key-handoff`
  (409726562), `moment-contract` (484663402), `moment-crossing-room` (383514597),
  `listing-kitchen-4pm-island` (181666488), `listing-twilight-exterior-pool` (482062652),
  `listing-living-room-terrazzo` (1246229897), `listing-exterior-canal-golden` (695619400) and
  `listing-primary-bath-terrazzo` (760469784). A second batch, the same day, under new names:
  `bradenton-courthouse` (1196178507, the Manatee County Courthouse in downtown Bradenton),
  `bradenton-robinson-preserve` (821476786), `golf-course-lakes-aerial` (1149024203),
  `lakefront-houses-palms` (550545686), `palm-lined-street` (569850021) and `tampa-bay-sunset`
  (478498102). None is flagged as AI-generated by Adobe, and none shows people.
  Eight more for the guides' sections, licensed free through the Adobe connector on October 12,
  2026, none generative and none showing people: `storm-aftermath-aerial` (536353807, homes after
  Hurricane Ian, 2022), `storm-shutters-closed` (1707972609), `roofs-blue-tarps-aerial` (698845897),
  `roof-missing-shingles` (543633243), `flood-street-sidewalk` (311981623), `community-gate`
  (933144089, not Florida, so its alt text names no place), `condo-towers-beach` (326491028) and
  `gutter-tile-roof` (341364766).
  Two more came from the team on October 11, 2026: `bradenton-riverwalk-palms`, the Bradenton
  Riverwalk by "Sanibel sun" on Wikimedia Commons
  (https://commons.wikimedia.org/wiki/File:Bradenton_Riverwalk.jpg), CC BY-SA 4.0, resized only and
  credited on the home page's Bradenton card; and `buyer-lakefront-house`, Jessica's pick for the
  Buyer tile, which looks generated (no watermark, no metadata) and whose source and licence aren't
  known. The portraits `duo-whitenavy-square`, `duo-whitenavy-wide`, `duo-whitenavy-cameo`, `jessica-navy-threeqtr` and
  `joelyn-blue-threeqtr` are crops of the team's own session (Dropbox, `jj-premier-group-portraits/06-social`),
  cut from the full-size files and only scaled down.
  A photo of a named place is used only where that place is named. The rest of
  `public/images/library` are generated frames from the original brand handoff, 1200px or 1376px
  wide. Nothing a visitor sees uses them now: they're left only in the sample listings, which are
  hidden unless `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`. Where free stock had no photo of the named
  place (The Lake Club, Country Club East, West of the Trail), the neighborhood page uses a nearby
  kind of scene with alt text that describes the photo, not the place; Waterside uses the client's lake
  aerial (`lakes-aerial-sunset`). The team photos in `public/images/photos` are
  the team's own. `lib/content/image-dims.ts` groups the files the same way.
- The three products are a family, named once in `lib/site.ts` (`products`, `primaryNav`):
  **Atlas** (the neighborhood explorer, `/neighborhoods`), **Encore** (the arts calendar,
  `/calendar`) and **Tide** (the newsletter and its archive, `/blog`). The desktop nav is two
  groups on one line: the plain pages as caps labels (Buy, Sell, Joelyn & Jessica), a hairline,
  then the products as the name in the display serif with its descriptor beside it on the
  baseline in small mono caps (Atlas NEIGHBORHOODS, Encore ARTS CALENDAR, Tide NEWSLETTER).
  To the right sit the search button (a 44px target that takes 16px of the row) and the Coldwell
  Banker mark, which stays at 185px. Below 1360px (1440px on the home page, where from 1280px the
  header is inset 56px each side to follow the hero; between 1024 and 1279 the home inset is
  16px with a 24px gap so the mark stays inside the frame) the descriptors drop and the names
  stand alone, so the nav never wraps into the search button or the mark. The tightest fits,
  measured in Chromium: 11px spare at 1440 on home, 43px at 1360 elsewhere, 27px at 1024 (11px
  on home). Re-measure at 1440, 1360, 1320, 1024 and 390 after any change to the nav. Each product link's `aria-label` is "name,
  descriptor" and the visible descriptor is `aria-hidden`, so it is read once. The phone menu
  keeps every item at display size with its descriptor on the baseline. "Buy" goes to `/buy`
  until there are live listings to search. The home page carries the three products as section
  05 with a live fact from each, and page eyebrows use the long form ("Tide · The Coast real
  estate newsletter"). To rename one, change it there; the pages read the value.
- The header's ground is decided by the stylesheet (`app/globals.css`, ".site-header"), never by a
  class the script picks: see-through over a page that marks its photographic hero with
  `data-header-overlay` until the page has moved 24px, frosted glass everywhere else, solid navy while
  the phone menu is open; the tint, the blur and the dimming ease together over the panel duration.
  The ground is the header's `::before`, a layer of its own, so a backdrop filter never makes the
  header the containing block for the phone menu's fixed panel. On the home page the glass follows
  the hero's paper frame while the hero is under it (`data-cover`), so the bar and the photograph
  share one edge. `SiteHeader` only measures (`data-scrolled`, `data-open`, `data-home`, `data-cover`).
- "Joelyn & Jessica" in the desktop header is a small menu in the product menus' style (`teamMenu` in
  `lib/site.ts`): About, the timing form, referrals, reviews, and the two numbers in its foot, so the
  team is one click away on every page. The menus open on hover intent (120 ms), switch at once once
  one is open, close 200 ms after the pointer leaves the row, and close when focus leaves them; ArrowDown
  opens one and the arrow keys walk its panel (`components/product-menu.tsx`).
- The phone menu keeps `hidden` for assistive technology and opens with a discrete display transition
  and a starting style, the rows 40 ms apart; Call, Text and "Tell us the timing" are pinned to its foot.
  The phone action bar's middle cell is each page's own next step (`nextSteps` in `lib/site.ts`); on a
  scroll down the bar steps aside into a Call · Text chip in the corner, and it hides while a text field
  has focus and on very short screens.
- Nothing hand-typed reaches the page: no market figures, no ticker, no stat band, no sample
  listings. The sample listings stay in the seed for previews and return with
  `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS=true`, never on the production deployment
  (`showSampleContent` in `lib/content/seed-source.ts`). `/listings` is "Find your home": the team's
  own listings when Sanity has any (`getListings`, a `ListingCard` grid held to the `?market=&max=`
  the home page's search sent and narrowed with the same two controls, `components/listing-results.tsx`),
  then the lead form prefilled from that search, then "Sold by us" (`components/sold-by-us.tsx`, also on
  `/sell`) when there are sold listings, plus a link to the team's live listings on the brokerage's site
  when `NEXT_PUBLIC_LISTINGS_URL` is set. Until an agent enters listings in Studio the page is the form
  alone and the home page's button says "Send my search"; with listings it says "See the homes" and
  three featured listings sit under the form. No MLS feed is faked.
- Voice: written to the reader, guide not hero. A mother and daughter team. No slogans, no numbers
  without a source.
- Testimonials are empty in the seed. Reviews go live only through the Sanity `testimonial`
  document, with `permissionOnFile` checked.

## Motion

One vocabulary, defined once in `styles/tokens.css` and driven into Tailwind from
`app/globals.css` `@theme` (`--default-transition-duration` and `--default-transition-timing-function`),
so a bare `transition-colors` utility already runs at the state duration in the brand curve. Every
transition on the site is one duration and one curve from this table; nothing lifts, nothing bounces.

| Token | Value | Used for |
|---|---|---|
| `--dur-micro` | 120 ms | colour, border and control opacity (buttons, links, inputs, chips' colour) |
| `--dur-state` | 200 ms | chips, rows, labels; the default for `transition-*` utilities |
| `--dur-panel` | 320 ms | menus, sheets, steps, body swaps, the header's tint, the phone menu |
| `--dur-card` | 600 ms | card rules and tints, the FAQ's height, scroll reveals' settle |
| `--dur-img` | 1100 ms | a photograph easing on hover |
| `--ease-brand` | cubic-bezier(0.2, 0.7, 0.2, 1) | state changes |
| `--ease-reveal` | cubic-bezier(0.2, 0.75, 0.15, 1) | entrances and panels |

In a component write `duration-(--dur-panel)` and `ease-reveal`, never a number. Keyframe entrances
(`rise`, `draw`, `wipe`, `reveal`) keep their own lengths in `@theme`. Everything is off for anyone
who asked for reduced motion (`@media (prefers-reduced-motion: reduce)` in the base layer zeroes
every duration and delay).

**Rows that open something** share one interaction (`.row-link` and `.row-arrow` in
`app/globals.css`; `.encore-agenda-link` in `components/encore/encore.css` for the calendar's and
the Planner's rows): on hover and keyboard focus the row slides, the category rule thickens and the
arrow fades in from 8px to the left over `--dur-panel`; on a touch screen the arrow rests at half
strength; with reduced motion the arrow shows and nothing slides. The Move plan's answer chips keep
their pencil, which steps forward and turns sky on hover and focus.

## Movement between pages

The site moves on the View Transitions API, through React's `ViewTransition` and Next's
`experimental.viewTransition` flag (`next.config.ts`). The pieces, all in the brand easing and all
off for anyone who asked for reduced motion (`lib/use-reduced-motion.ts`):

- **The page body.** `components/page-transition.tsx` wraps the page in one boundary keyed by the
  pathname, so a route change is the old page leaving and the new one arriving: a 240 ms cross-fade
  (`app/globals.css`, "View transitions"). State changes inside a page (Encore's filters, the map)
  are updates to the same boundary and run no transition. Browser back and forward run outside a
  React transition and stay instant.
- **The nav rule.** The Sky rule under the current page carries one name (`nav-underline`) and
  slides between items (320 ms). A hover rule draws in under the others at half strength.
- **Card to hero.** `components/shared-link.tsx` and `components/shared-frame.tsx`: a card's
  picture grows into the hero of the page it opens (Encore tiles and event cards to the event hero,
  venue cards to the venue hero, the home page's place cards to the hub heroes). Only the clicked
  card is named, through a small store the link writes on click (`lib/shared-element.ts`), since a
  calendar can show one event twice and two boxes with one name cancel the browser's transition.
  The link prefetches on hover, focus and touch so the page is ready when the change happens; a
  loading state has no hero to pair with.
- **Prefetching.** The primary nav prefetches when it comes into view. The footer, the product
  menus, the product bar and the phone menu's secondary links prefetch on intent instead
  (`components/intent-link.tsx`: pointer over, focus or a finger down), so a page doesn't fetch
  fifty routes on load.
- **The header.** On phones (below `lg`) it tucks away on a scroll down past the first 160 px and
  returns on the first scroll up, a route change, keyboard focus, or while the phone menu is open
  (`components/site-header.tsx` sets `html[data-scroll]`; the stylesheet moves the header and the
  action bar). On a desktop it stays. On a very short screen (a phone sideways, the page at a high
  zoom) the header drops to 48 px and the action bar is hidden.
- **Waiting.** The route loading bar (`app/(site)/loading.tsx`) and the veil a clicked link shows
  (`components/link-pending.tsx`, Next's `useLinkStatus`) both wait 150 ms, so a prefetched route
  never flashes them.
- During a route change React waits up to 500 ms (its own cap) for the new page's in-view images
  and fonts, so a page never fades in with holes. Initial loads are untouched.

## On the home screen

`app/manifest.ts` is the web app manifest (`/manifest.webmanifest`, linked from every page): name
JJ Premier Group, short name "JJ Premier", standalone, navy ground, the brand seal as the icon (the
`favicon-192`/`favicon-512` seal, and `icon-maskable-192`/`-512`, the same seal on a full navy square
inside Android's safe zone). It opens on Encore (`/calendar?source=pwa`, so Plausible shows the
home screen as a source), with Encore, Atlas, Tide and "Call or text us" (the contact page) as
long-press shortcuts. No service worker: nothing claims to work offline. `appleWebApp` in
`app/layout.tsx` names it for iOS. Once someone has saved two shows, Encore's My list shows a quiet
"Keep Encore on your phone" row (`components/encore/keep-on-phone.tsx`): the browser's own install
prompt on Android and desktop Chromium, one line about Share → Add to Home Screen on an iPhone or
iPad; never inside the installed app, and not again once dismissed on that device
(`encore:keep-on-phone`).

The viewport is `viewport-fit=cover`, so the page runs under a notch and the home indicator and the
`env(safe-area-inset-*)` terms are real: `--gutter` (`styles/tokens.css`) is never narrower than
the side insets, so every container, the header and the phone menu clear a notch on a phone held
sideways; the phone action bar, its chip, the bottom sheets and the explorer's sheet pad the bottom
inset, and the explorer's sheet and map controls the side insets. Check a change to any fixed or
full-bleed element in landscape on a notched phone.

## Keeping a result: print, PDF, email

Every tool's result can be kept (`components/keep/*`, `lib/keep/*`): Atlas Move's plan, Atlas
Match's list, the Encore Planner's plan, Tide Street's sales, the home value record, the Sale
Calculator's sheet and a Tide issue. The result sits in `KeepSheet`, which on screen is nothing and
in print is the whole page (`components/keep/keep.css` hides everything that neither holds the sheet
nor sits inside it): headed with the product's lockup, the day it was made and the site, footed with
the tool's own source line (`KEEP_TOOLS` in `lib/keep/tools.ts`, sentences the tools already say),
the two of us by name and number, and a QR code of the link that opens the same result. A fold
marked `data-keep-open` (Tide Street's table) prints open. "Save as PDF" is the browser's print
dialog, so the PDF is exactly the screen's result, on US Letter. Each tool keeps its own buttons and
gains Print where it had none (`KeepPrintButton`, `KeepRow`) and "Email me this" (`KeepEmail`),
which shows only when `/api/keep/status` says the email path is on (docs/INTEGRATIONS.md, "Email
me this").

Why not separate `/print/<tool>` routes taking the query string: the tools compute in the browser,
and two of them (Tide Street, the home value record) deliberately keep the typed street and
address out of the address bar, so a server route couldn't rebuild them without putting the address
in a URL the CRM pixel reads; and a second renderer per tool would drift from the screen. A
server-side PDF would need a headless browser on Vercel. The guides' PDFs stay as they are
(`app/(print)`).

## The buyer's and seller's guides as a checklist

`/buy` and `/sell` keep their long editorial form (`components/guide.tsx`); the steps' words are
the owners' and nothing here changes them. Under each step's words sit two things:

- **The tool for that step**, where one does its work (`tools` on `GuideSteps`, by product id from
  `lib/site.ts`, named with the product's own label and short line). Buy: 1 Atlas Match, 2 the
  Sale Calculator, 7 Tide Street, 10 Atlas Move. Sell: 2 Tide Street, 8 the Sale Calculator.
- **The reader's checklist** (`components/guide-checklist.tsx`, pure logic in
  `lib/guide-checklist.ts` with its tests): "Mark this step done" records the day it was marked,
  "Add a date" sets the day they mean to have it done by. Kept in this browser only
  (`guide:buy`, `guide:sell`), keyed by step number so a rewrite of a step's words keeps everyone's
  place. Once anything is marked, "Your checklist" after the steps says how many are done and
  which is next, offers "Add the dates to my calendar" (an ICS of the dated steps not yet done,
  built in the browser with `lib/ics.ts`'s rules, one all-day event per step linking back to it)
  and "Clear my checklist". Nothing is collapsed or hidden; nothing leaves the device.

## The tools and the address bar

The tool pages (`/neighborhoods`, `/neighborhoods/match`, `/calendar`, `/calendar/plan`,
`/relocate`, `/sell/net-proceeds`, and the forms on `/contact` and `/listings`) are static: the server renders each in
its default state, fast from the CDN and complete for crawlers, and the browser applies what the
address asks for once, right after hydration (`lib/url-state.ts`, `useUrlInitial`). When a link
carries a tool's keys (or a returning visitor has answers in progress),
`components/url-pending.tsx` hides that tool until then, so nobody sees the default view swap
for the one they were sent; it lets go after four seconds whatever happens. One set of rules for
every tool, in `lib/url-state.ts`:

- **Steps push.** Atlas Move, Atlas Match and the Encore Planner's questions are one history entry
  each, so the browser's Back (and a phone's swipe back) returns to the question before, with the
  answers kept. The finished plan replaces the last entry with its canonical link.
- **Choices replace.** A filter, a view, a day or a selected place replaces the URL once, when
  it's made. Nothing is written on arrival, so a campaign's `utm_*` tags stay as they came.
- **Typing stays out.** Search words, the map's position and the street or address in the sales
  lookups never go into the address bar. The Home Platform pixel records a page view on every
  history write and reads the address (`lib/home-platform.ts`), so nothing writes per keystroke
  or per pan, and nothing typed reaches the CRM that way. Words and the map are kept for the tab
  (sessionStorage), and go into a link only when someone presses Share.
- **Answers in progress are kept.** Move, Match and the Planner save their answers in
  localStorage on every change (`relocate:answers`, `atlas:match`, `encore:plan-draft`), so a
  reload or an accidental exit comes back to the same question.
- **The Sale Calculator is a link.** Every input on `/sell/net-proceeds` is in the query
  (`lib/net-proceeds-url.ts`: `price`, `county`, `close`, `title`, `mortgage`, `second`, `list`,
  `buyer`, `tax`, `paid`, `hoa`, `dues`, `per`, `estoppel`, `settle`, `rec`, `repairs`, `staging`,
  `other`, `firpta`), written when a field loses focus or a tile, select or box changes, never per
  keystroke, and mirrored to localStorage (`net-proceeds`) so a return visit resumes. It writes
  with the native `replaceState` rather than Next's patched one: the router's dispatch runs in a
  transition that starts a view transition, which swallowed the digits typed right after a tile
  tap and moved focus back; nothing on the page reads the router's search params. Nothing is
  chosen until the seller taps a county; a county that arrived from a link, the saved sheet or a
  Tide Street or Home Value hand-off (`?price=&county=`) is flagged on the sheet until a tile is
  tapped. On a phone the net sits in a bar pinned to the bottom edge in place of Call · Text
  (`lib/site.ts`, `ownPhoneBars`), and tapping it opens the same sheet as a three-stop bottom
  sheet; the in-flow sheet at the foot of the page is what prints. One live region reads
  "Estimated net, $X" once typing has settled.
- **Today is a calendar day, never the UTC day** (`lib/time.ts`). Atlas Move counts from the
  visitor's own day (`dayHere`, from the browser's clock; the static page's server render uses the
  site's day, `dayIn(SITE_TIMEZONE)`, until the browser replaces it), Encore from the site's day,
  and both keep it current with `useToday` (`lib/use-today.ts`), which ticks over at midnight and when a sleeping tab
  wakes. Move's plan says plainly when a move-in is too soon for the standard timeline (the first
  step would already have passed), names the earliest move-in the chain allows from today, and
  offers it as one tap; the date picker reaches three years ahead. "Send us your plan" appears once
  there is a plan; before that one line points at the contact page. The count of questions is
  `MOVE_STEPS`, and `lib/relocate/steps.test.ts` holds every sentence that says it to that number.
- **Shared data.** The neighborhood index and the Encore season are fetched once per visit
  (`lib/use-json-resource.ts`); whichever tool opens first fetches, and a failed fetch offers Try
  again.
- **Moving between questions.** The new question takes focus and, if it had scrolled up under
  the header, comes back into view below it (`components/ui/stepper.tsx`). Every scroll from
  code goes through `lib/scroll.ts`, which is instant for anyone who asked for reduced motion.

## The neighborhood explorer

`/neighborhoods` is a map product built on the neighborhood dataset in `neighborhood-data/`
(2,088 areas, communities and enclaves, every fact from a county, district, association or
builder source with its checked date).

- **Map stack.** MapLibre GL JS renders a style written in the brand (`lib/neighborhoods/map-style.ts`:
  linen land, harbor water, hairline roads). Tiles come from MapTiler when `NEXT_PUBLIC_MAPTILER_KEY`
  is set (100k map loads a month free, then paid, with an SLA; register the domain as an allowed
  origin in MapTiler) and from OpenFreeMap otherwise (free, no key). Both serve the OpenMapTiles
  schema, so the style is the same. MapLibre's worker is copied to `public/vendor/` by
  `scripts/copy-maplibre-worker.mjs` before every dev and build (the copy is git-ignored).
- **Data to the browser.** Only the trimmed search index (`/api/neighborhoods/index`, about 90KB
  gzipped, built at deploy time and cached hard) reaches the client. The full 8MB dataset is read
  server-side by `lib/neighborhoods/data.ts` for the detail pages, the sitemap and the share images.
- **URL state.** Every view is a link: `q`, `market`, `level`, `type`, `status`, `gated=1`, `all=1`
  (include county-registry names), `list=a,b,c` (the view held to exactly those places: a Match
  list, a shared My places; the panel is titled "Your Match list" when it came from Match, with
  "Save them all"; "Show everything" lets it go), `place=<slug>` and `map=zoom/lat/lng`. The
  address bar carries the filters, the list and the selected place; the search words and the map
  position stay in the tab (Back to the explorer brings them back) and go into the link only
  through the Share button, which uses the phone's share sheet or copies the link. See "The
  tools and the address bar".
- **The place card** (`components/explorer/place-card.tsx`) always shows the four facts the index
  carries beyond the search fields (evacuation zone, HOA on record, CDD on record, water access),
  each "Not known yet" when the record has no checked source, and a Save in its header.
- **My places.** Save (the bookmark on a place card, a Match result, a place page and the compare
  page) keeps slugs in `localStorage` (`atlas:places`, `lib/neighborhoods/my-places.ts`), the
  Encore pattern: one store every button reads (`components/atlas/use-my-places.ts`, built with
  `lib/slug-list-store.ts`, which Encore's My list now uses too). On the explorer the list shows as
  a rail at the top right on a desktop and a navy bar docked to the top of the sheet on a phone
  (`components/explorer/my-places.tsx`), with Compare, Share (the explorer with `?list=`) and
  "Walk me through these" (the contact form with the list's link in the message). Nothing leaves
  the browser unless the visitor shares or sends it.
- **Compare.** `/neighborhoods/compare?places=a,b,c` holds two to four places side by side
  (`lib/neighborhoods/compare.ts` reads the rows from the full records on the server): one row per
  fact the schema holds, the value as the source stated it with the source's host and checked date
  beneath, "Not known yet" where the record is empty, then "Sales · 24 months" (the county's
  qualified sales for each place: count, median resale and price per square foot, read from the
  place's own subdivisions or, failing that, its ZIP area, and labelled which, with the through-date
  and a link into Tide Street) and Encore's month in each place's market. The label column is sticky on a phone and the
  place columns scroll under it. The page is `noindex` (a view of one visitor's list) and the ask
  under the table is the buy form with the page's link in the message.
- **Atlas Match** (`lib/neighborhoods/match.ts`, `components/match/*`). Each question reads one
  field of the index; a place is in or out per question, and a fact we don't hold is "not known
  yet", kept in unless the reader unticks it. The questions run in order of coverage (market,
  county, evacuation zone, HOA, home types, builder status, CDD, gated, water, distance), each
  says its coverage before the choices ("We hold this for 545 of 678 places", counted over the
  places the match considers, so it moves with the registry toggle), and a question whose coverage
  is under a quarter (water, in October 2026) waits behind "More questions" on the list. The list
  shows one bar per answered question (confirmed on that answer, not known yet), never a single
  "confirmed on every answer" figure; "See them on the map" opens the explorer on exactly the list
  (`?list=`); "Save them all" and a Save on every card feed My places. Coverage is a research
  backlog, not a site change: gated and home types for the Lakewood Ranch communities first, from
  the builders' and associations' sites in `neighborhood-data/docs/REFRESH-RUNBOOK.md`.
- **Layout.** `components/explorer/explorer.css` owns the explorer's two layouts by media query: a 400 px
  column from 1024 px, and below that a bottom sheet moved on `translateY` with three stops (peek, half,
  full) that follows the finger and works from the keyboard (the handle: Enter, the arrows, Escape). The
  server HTML is the final layout, so nothing jumps after hydration. The map opens on bounds the server
  computed (`lib/neighborhoods/bounds.ts`), follows a search once typing settles, and jumps instead of
  flying for visitors who asked for reduced motion.
- **What sold here.** Under the particulars on a place page, `components/sales/place-sales.tsx`
  shows the county's qualified sales for the place over the sales window: the ones the county files
  under the place's subdivisions (`lib/sales/places.ts` joins the subdivision and appraiser
  neighborhood names on each sales row to Atlas names and aliases: the longest whole-word match,
  guarded by the place's ZIPs, enclaves rolled up into their parent, postal-city names left out),
  or, when the county files none under that name, every sale in the place's ZIPs, titled "What sold
  nearby" and labelled as the ZIP area. Count, median resale, median price per square foot, the
  newest five, the ZIP area for scale, the source line with each county's through-date, "Every sale
  on Tide Street" (`/sell/sold?place=<slug>`) and "Watch this place" (Street Watch, docs/ISSUES.md).
  These are county public-record figures, not the Atlas dataset's (the display rule below still
  holds for the dataset). The brokerage's compliance contact should confirm county sales figures on
  community pages; until then they're shown as the public record they are, labelled and sourced.
- **Detail pages.** Every record has `/neighborhoods/[slug]`, statically generated. The eight
  editorial neighborhoods keep their hero, overview, highlights and FAQs and gain the dataset
  facts underneath, joined by slug (`lake-club` became `the-lake-club`; the old path redirects).
  County-registry names (`research: "registry-only"`) render with `noindex` and stay out of the
  sitemap until they are researched.
- **The map on /contact** is the same stack in a small frame (`components/office-map-island.tsx`,
  `office-map.tsx`): one navy marker with the brokerage's name, zoom 12, plus and minus only, no wheel
  zoom, loaded when the frame nears the viewport over a still poster, the map-unavailable note when it
  can't draw. The marker is the office point in the site settings (`officeGeo`) or, until that is set,
  the middle of Lakewood Ranch from `hubAtlas` (the mean of the catalog's areas there). The "Open in
  Google Maps" link under it is `lib/map-embed.ts`. No Google embed, no key.
- **The detail-page map** is an island: the page carries a still SVG of the place's points
  (`components/place-poster.tsx`) and `components/place-map-island.tsx` asks for MapLibre's chunk only
  when the frame comes within 200 px of the viewport. One finger scrolls the page over it; two move the map.
- **Sources panel.** `lib/neighborhoods/sources.ts` turns a source's field keys into labels and its host
  into a publisher's name. A `web.archive.org` link in the data is shown as an archived copy with its
  snapshot date; `npm run nbhd:check-sources` finds links that have gone (see the refresh runbook).
- **Share images.** `opengraph-image.tsx` beside the explorer and the detail pages draws every
  point in the catalog as a constellation on linen with the chosen place in amber. No tiles, no key.
- **Display rules (brokerage fair-housing compliance, non-negotiable).** Places, never people: no
  demographic, income, crime or safety layers; no rankings or scores; school names exactly as
  stored with the district locator link and the zoning note, never on `area` records; nothing
  age-related; no prices or statistics from the dataset (county sales figures, labelled and sourced,
  are the exception above); `notes` is never rendered. Run
  `checkFairHousing` over new copy. The dataset's own rules are in `neighborhood-data/docs/RESEARCH-RULES.md`.
- **Keeping it current.** `npm run nbhd:validate` (must exit 0) and `npm run nbhd:index` after any
  edit; the monthly and quarterly refresh scripts are in `neighborhood-data/docs/REFRESH-RUNBOOK.md`.
  Boundaries are not drawn: the dataset has points only. If polygons are wanted, source them from the
  county layers listed in `neighborhood-data/docs/DATA-SOURCES.md` rather than drawing them.

## Atlas Check (/check)

The fourth Atlas piece: one address in Manatee or Sarasota County, and what the public maps say about
it, each fact with the layer it came from, a page to check it on and the day it was read. The page
is static (`app/(site)/check`); the island (`components/check/address-check.tsx`) asks
`GET /api/check?address=&zip=`. The address never goes into the address bar; a link that carries
one (from an address search, `checkHref` in `lib/search/intent.ts`) runs it once on arrival. The
place pages' evacuation card links here ("Check an exact address") beside the county's lookup.

**How an address is found** (`lib/check/check.ts`, `locate`). The house number, street and ZIP are
parsed (`lib/check/parse.ts`, `parseAddress`; the street's parts by `streetParts` in
`lib/sales/street.ts`), then looked up on the county's own parcel layer, in the county the ZIP belongs
to (both for a ZIP on the line): Manatee `GIS_PARCELS`, Sarasota `Hosted/Parcels`, by number, street
name and ZIP, the exact name first and the name as a prefix second. A typed suffix or directional
picks among streets that share a name, a typed unit picks the unit; a building's units without a
unit typed share the location and the roll's facts are held back. When neither roll has the address
(a house too new for the roll, a typo), the Census geocoder (`geographies/onelineaddress`, free, no
key) places it along its street and the page says the point can be a few lots off. A Census match
outside FIPS 12081 and 12115 is "outside the two counties".

**What is read at the parcel.** Each layer is asked with the parcel's polygon (POST), so a lot that
touches two zones names both; only then is the parcel's middle asked too, to say which comes first.
A geocoded point is asked as a point.

| Fact | Layer | Field |
| --- | --- | --- |
| Evacuation level (Manatee) | `services1.arcgis.com/t03WDvnSR7gSDOB2/.../Evacuation Levels Feature Service/FeatureServer/0` | `EVAC_ZONE` (A–E, `N/A` = outside) |
| Evacuation zone (Sarasota) | `services3.arcgis.com/icrWMv7eBkctFu1f/.../StormEvacuationZoneWM/FeatureServer/0` | `EvacuationZone` (no feature = outside) |
| FEMA flood zone | `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | `FLD_ZONE`, `ZONE_SUBTY`, `SFHA_TF`, `STATIC_BFE` (−9999 = none), `V_DATUM` |
| FIRM panel | `.../NFHL/MapServer/3` | `FIRM_PAN`, `EFF_DATE`; the panel from the county's own map (`DFIRM_ID` 12081C or 12115C) wins at a county line |
| Year built, living area, lot, use | the parcel layer above | Manatee `YRBLT_RES`/`YRBLT_COM`, `SFLA`, `ACRES`, `LUC_DESCRIPTION`; Sarasota `yrbl`, `living`, `lsqft`, `stcd` |
| Last qualified sale | `data/sales` (`findParcelSales`, matched on the parcel number) | the county sales file's 24-month window |

The same layers the dataset's evacuation zones come from (`neighborhood-data/docs/DATA-SOURCES.md`).
Owner and mailing columns exist in both parcel layers and are never requested (`PARCEL_FIELDS`;
`lib/check/check.test.ts` holds that). The guides speak beside the result from their own data:
the flood guide's zone card for VE, AE or X (its figure note for A, AH, AO and shaded X) and the
hurricane guide's "An evacuation zone is not a flood zone" lead (`lib/check/guide.ts`). Then a plain
"Check before you count on it", and the next steps: Home Value with the address, Tide Street for the
street, Street Watch, and the contact page.

**Cost, caching and limits** (`lib/check/server.ts`). Every source is public and free. Each layer's
answer is kept 30 days in Next's data cache (`unstable_cache`, shared across instances, tag
`atlas-check`) with the day it was read, and the page shows the oldest such day; a failed read is
never cached. A whole result is kept an hour in memory, the response an hour at the edge. Ten checks
a minute per visitor and 3,000 a day per instance, then 429. A source that fails leaves its own fact
out with a link to look it up by hand; the others still show. Measured uncached: five to six calls and
0.6 to 1.2 s per address. The `Explore` goal fires with `action` = address-check; Street Watch from
here carries `source` = atlas-check.

## The Encore Arts Calendar

`/calendar` is a calendar product built on the events dataset the client supplied
(`lib/content/encore/`), the way `/neighborhoods` is built on the neighborhood dataset.

- **The page.** `components/encore/encore.tsx` holds one state (view, day, filters, search, a
  shortcut) that the URL, the day strip and the body reflect. Views: Days (agenda with sticky
  day headers), Week (seven columns on desktop), Month (grid plus the chosen day's agenda) and
  On view (exhibitions, closing soonest first, then opening later). On today, the Days view opens
  with Tonight and This weekend rails (from lg the rail's right edge fades while there is more and
  Prev/Next step one card); "All N" on a rail opens that list as its own view (`?when=tonight`,
  `?when=weekend`), which the home page's Encore band links to as well. Categories are the
  dataset's eight (music, theater, galleries, talks, film, festivals, family, markets), each with
  a muted accent from `lib/encore/categories.ts`.
- **Controls, exactly three.** `.btn` (52px) for a primary action, `.chip` (44px) for the view
  switcher (a tablist with arrow keys; the body is its tabpanel), the filter chip and the
  categories, and `.btn-quiet` (36px; a 44px square with a glyph) for Today, Prev/Next, Clear,
  Close, Save (a bookmark, filled amber when saved) and the Planner's Nearby (a pin). The glyphs
  are `components/encore/glyphs.tsx`. The filter chip ("Everywhere · Any venue") opens the sheet
  "Where and what" (`components/encore/filter-sheet.tsx`, a native dialog: market chips, the
  venue select grouped by town, category chips with the window's counts; a bottom sheet on a
  phone, a panel under the chip from lg). An active category sits beside the chip as its own
  chip; tapping it clears it.
- **The band.** The view chips and the day strip sit in one band that sticks under the header
  (`.encore-band`; it rises to the top edge while the phone header is tucked away) so the first
  show on a phone is inside the first screen: the masthead is short there (`Masthead compact`),
  and the search row scrolls with the page. The day heads stick under the band, whose height the
  component measures into `--band-h`. The strip is one tab stop (roving tabindex): ← → a day,
  PageUp/PageDown a week, Home today, End the last day loaded; the chosen day is one amber bar
  that slides between cells; it opens with three weeks of cells and grows four at a time as it is
  scrolled.
- **Search.** A query is a list over the season (`SearchResults` in `views.tsx`): every date,
  grouped by day, then the matching runs; the strip scrubs it. No match says "Nothing by that
  name this season" and offers the venue select. A filtered week with nothing on names the next
  day with a match (`nextMatchDay` in `select.ts`, over the season) instead of a generic "next
  week"; a date in the past on a pasted link is dropped (`parseEncoreState(params, today)`).
- **Times.** A listing with no published time is "All day" only when it is that kind of thing (an
  exhibition, a festival, a market, an art walk: `lib/encore/when.ts`); a play or a concert
  without one says "Time not listed" and its page points at the venue's listing for the time
  ("Time on the venue's site ↗"). The Planner never picks an untimed listing.
- **Data to the browser.** The server renders the first view from a slice of the index
  (`sliceIndex` in `lib/encore/data.ts`: the first `FIRST_PAINT_DAYS` (21) days and the current
  runs, without the one-line summaries) so the page is complete for crawlers and without
  JavaScript. The client fetches `/api/encore/index` (about 90KB gzipped, regenerated hourly, one
  fetch per visit shared with the Planner through `lib/use-json-resource.ts`) the moment a move
  needs it (a search, a day past the slice, the month view, a list) and otherwise in idle time
  after the first touch, inside a transition, so the first tap never waits on it. Local days and
  times are precomputed in the site timezone, so the client does no timezone math
  (`lib/encore/select.ts`). Tiles and rows are keyed by event and rise in on arrival
  (`.encore-rise`, staggered, capped at 12); nothing remounts the whole body on a filter change.
- **URL state.** `view`, `date` (YYYY-MM-DD; a past date is dropped), `category`, `market`,
  `venue`, `q`, `when` (tonight or weekend) and `list` (comma-separated slugs of a shared list).
  `lib/encore/url.ts` parses and prints it. The address bar follows the view, the day, the
  filters and the shortcut; the search words reach a link only through "Share this view".
- **Static.** The page is prerendered hourly with today and the next three weeks; the view a link
  asks for (a search, another window, a shared list) is applied in the browser, with the views'
  loading rows until the season arrives, and a Try again if it doesn't.
- **My list.** Save keeps slugs in `localStorage` (`encore:list`); "Share my list" turns it into a
  `?list=` link, and a visitor who opens one can save it all to their own list. Every Save
  button and count reads one store (`components/encore/use-my-list.ts`), and a save in another
  tab shows up in this one.
- **Feeds.** `/api/calendar.ics` with no parameters is a rolling **90-day** window (every dated
  performance in the next 90 days, plus the exhibitions on view now or opening inside the window),
  because calendar apps refetch it every few hours and the six-month file was over a megabyte.
  `?all=1` is the full feed (six months of performances plus every current and upcoming run).
  `category`, `market` and `venue` give a six-month subscription of just that filter,
  `event=<slug>` one production, and `event=<slug>&at=<iso>` a single performance (the "+ Cal"
  links on event pages). The "Subscribe" links on `/calendar` point at the 90-day feed; a
  subscriber's calendar rolls forward on every refresh, so nothing has to change on their side.
- **Plan a visit.** `/calendar/plan` is for someone coming to look at homes: arrival and
  departure (up to 14 days, the coming weekend by default), the markets to see, optional
  category preferences and an evenings-only toggle, all in the URL once the plan is built
  (`from`, `to`, `market`, `cat`, `evenings`, `who`) so a plan is shareable. Each question is a
  history entry, so Back returns to the one before. `lib/encore/plan.ts` builds it: each day gets a
  market or two by rotating through the chosen ones and a "Showings with us (10 to 4)" block,
  then up to three timed performances from five o'clock (and one weekend matinee), scored to
  prefer the chosen categories and the day's market and to spread categories and venues across
  the stay; no production is picked twice. The server paints the first plan from a slice of
  the index and the client refetches the full index for new dates. "Add this plan to my
  calendar" is `/api/calendar/plan.ics` (showing blocks ten to four plus the picks, passed as
  `pick=slug:start` so the file matches the screen); the ICS pieces shared with the feed live in
  `lib/ics.ts`. The ask at the end is the buy form with the dates and places in the message. A plan of five days or more gets a day jumper: once the stage's
  strip has scrolled away, a compact row of the days slides down under the header (on a phone, to
  the top while the header is tucked away), marks the day being read, and jumps to any day; it is
  one tab stop (← → Home End). The day heads stick under it.

`lib/content/encore.ts` turns the dataset's productions and venues into the site's `Event` and
`Venue` shapes:

- A production with dated performances becomes one event whose `performances[]` carries every
  date and time (wall-clock America/New_York converted to UTC). `startsAt` is the next
  performance. The list and month views expand these to one row per date with `getOccurrences()`.
- A run with no published times (an exhibition) is an all-day event from its first day through
  `runsThrough`; the list view shows these in the "On view now" strip via `getOnView()`.
- Items marked `announced` are left off.
- **Venues without a page** (`lib/encore/venue-rules.ts`). A placeholder (Venue TBD, Various
  venues, online, the dataset's `venue-tbd`) and someone's home (a name that reads as a residence,
  "Home of", a private address: the house concerts) get no venue page, no place in the venue
  filter, the sitemap or search, and no coordinates for Nearby. Their events still show, named
  "Venue to be announced" or "A private home" with the town only and, for a home, "Address given
  with tickets"; the JSON-LD names the town. An old address of such a venue page redirects to its
  town's calendar. The collector's review note flags a new venue that reads as a home.
- **Slugs** (`lib/encore/slug.ts`). A production's slug is its title cut at a word boundary (64
  characters, no dangling "and" or "of the"), then the month of its first date (`-2026-11`), then
  `-2` for a second one that month. The first collector clipped 60 slugs mid-word without the
  month; they stay as stored (the collector, the queue and the image rows know them) and the site
  serves each under a clean slug computed at load, the old address answering a permanent redirect.
- **After the last date.** An event whose dates are all past keeps its page for about five weeks
  (the window pages read, below): the title, "This one has closed" with its last date, the venue's
  next shows (or the town's), Back to the calendar, noindex. An event address shaped like a past
  month that the calendar no longer has (pruned) redirects to `/calendar`. Lists of event cards on
  neighborhood, venue and event pages drop, in the browser, any card whose date has ended
  (`components/encore/fresh-events.tsx`), so a cached copy never shows last night. Every collect
  and daily check rebuilds the Encore pages (`ENCORE_PATHS` in `lib/encore/ops.ts`), and the
  sitemap leaves out events that end within a day.
  Sold-out productions show "Sold out" and their offers carry `SoldOut` in the Event JSON-LD.
- **Guide covers.** Each guide's cover is a free Adobe Stock photo licensed through the Adobe
  connector on October 3, 2026, 2400px wide so it stays sharp full-bleed, none flagged
  AI-generated and none with an identifiable person. They're in `public/images/guides/<slug>.jpg`.
  Adobe Stock IDs: barrier-island 297480009, cdd-fees 713644680, condo-hoa 637443918,
  flood-zones 289523694, getting-here 576081666, wind-and-flood insurance 199682484, homestead
  120382429, hurricane-season 194827807, inspections 698842009, selling-a-home-you-dont-live-in
  1587155923, spring-start-in-october 529733750, gated-community 532484718. Only the
  getting-here (Sarasota) and barrier-island (Anna Maria) photos are of a named place, and only
  because Adobe's own titles say so; the alt text names none.
- **Guide PDFs.** Every guide has a print edition at `public/guides/pdf/<slug>.pdf`, served by
  the "Download the PDF" buttons on the guide. Each is `/print/guides/<slug>` (the print layout in
  `app/(print)`, no site chrome, noindex) printed on US Letter by Chromium: a full-bleed cover and
  back page, the guide's name as the running head, the team, the brokerage and the page number at
  the foot. Change a guide, then run the site (`npm run dev`) and `BASE=http://localhost:3000 npm run
  guides:pdf` (or name slugs to print only those), and commit the PDFs. A unit test fails if a guide
  has no PDF.
- **Tide covers.** Each Tide issue page (`/tide/<issue>`) opens on one of three free Adobe Stock
  photos licensed through the Adobe connector on October 3, 2026, 2400px wide, none flagged
  AI-generated and none with an identifiable person, in `public/images/tide/tide-{1,2,3}.jpg`.
  Adobe Stock IDs: tide-1 (a bayfront marina and towers at dusk, titled "Downtown Sarasota with
  Boats") 456377261, tide-2 (a Gulf inlet between two jetties, titled as Nokomis) 1082458028,
  tide-3 (red mangroves on a tidal flat) 1660124415. The issue month picks one
  (`lib/tide/cover.ts`): January, April, July and October take tide-2, the jetties at golden hour; the months after take tide-3, then tide-1. The alt text
  names no place.
- **Stock photos, then key art.** An event without the presenter's own image (see "Images"
  below) gets a stand-in photograph for its kind of event: 51 free Adobe Stock photos, three
  each for 17 themes (exhibition, concert, chamber, orchestra, choral, jazz, theater, musical,
  ballet, comedy, talk, film, festival, art walk, family, gala, market), licensed through the
  Adobe connector on October 3, 2026, none flagged AI-generated. They're in
  `public/images/encore-stock/`, listed with their Adobe Stock IDs and alt text in
  `lib/content/encore/stock-photos.json`. `lib/encore/stock.ts` maps the subcategory, then the
  category, to a theme and picks one of its three by the event slug; in a list (`varyStock`,
  used by the rails, the On view grid, the venue and neighborhood pages) a card whose slug names
  the photo a card just before it has takes the next one, so a stand-in never sits beside itself.
  The event's own page keeps the slug's pick. They show no faces, logos, readable signs or recognisable local venues, and the event
  page captions them "Stock photo · Adobe Stock" so nobody takes one for the production. The
  share image uses the same photo. Only if no theme fits does `components/key-art.tsx` fall back
  to the art drawn in code by `lib/encore/key-art.ts` (one motif per category, varied by slug).
- The ICS feed emits one VEVENT per performance: the next 90 days by default, six months with
  `?all=1` or any filter, plus the current runs.

When Sanity is live the same shape lives in the `event` document (performances, presenter, room,
firstDate, runsThrough, status) and `scripts/seed-sanity.ts` imports the dataset once.

### Keeping Encore current

The calendar lives in Supabase Postgres (`encore_*` tables, migration `0012_encore.sql`) and
refreshes itself from the venues' and presenters' own sites. The JSON file is the seed and the
fallback: `lib/encore/live.ts` reads the tables (five minutes in memory, then the pages' hourly
ISR) and uses the JSON whenever the database is missing, down, slow (8 s) or empty, so a build
never needs it.

- **Tables.** `encore_venues`, `encore_events`, `encore_performances` (one row per date and time,
  with `status` scheduled / cancelled / postponed / removed, `availability` on-sale / few-left /
  sold-out / not-on-sale / unknown, price range, `checked_at`), `encore_sources` (one row per
  feed: adapter, `config` overrides, frequency, `last_ok_at`, `last_error`, counts),
  `encore_checks` (every status/price reading), `encore_review_queue`, `encore_images`,
  `encore_runs`. RLS on, no policies: only DATABASE_URL reads them.
- **Sources and adapters** (`lib/encore/collect/`). `sources.ts` lists all 83 domains from the
  source audit, each with its adapter. Generic: The Events Calendar REST (`tribe`), iCal
  (`ical`), schema.org Event JSON-LD and plain event pages (`jsonld` / `pages`, with per-site
  readers in `adapters/sites.ts`), Squarespace JSON (`squarespace`). Platforms: Tessitura TNEW's
  own JSON (`tnew`: Orchestra, Ringling, Asolo Rep, Opera, Ballet), OvationTix
  (`ovationtix`: Artist Series, SCD, Urbanite, SCA, Via Nova), TicketSpice (`ticketspice`).
  Per site: Van Wezel, SILL, MPAC. Sources the audit found closed to automation (captchas,
  Cloudflare and Akamai challenges, prose-only gallery pages) are listed as `manual` and never
  fetched. A row's `config` in `encore_sources` is merged over the code's, so a moved URL can be
  fixed with one UPDATE and no deploy; `enabled = false` pauses a source.
- **Manners.** One request at a time per host, 1.2 to 2 seconds apart (Van Wezel's paging five
  seconds apart), real browser headers, 20-second timeouts, one retry, robots.txt honoured for
  `User-agent: *` (and FST's ticketing host and WBTT's Salesforce site never fetched). A source
  whose content hash hasn't changed since its last good run is marked checked and skipped.
- **What applies on its own and what waits** (`reconcile.ts`). Known events update
  themselves: a date added or dropped, a time moved, status (on sale, few left, sold out,
  cancelled, postponed), price, ticket link, a run's closing day, the image. Matching is by a
  link that belongs to one event only, then by title, dates and venue together. Dates are only
  added from structured sources (feeds, APIs, listings with times); a date is dropped only when
  the source lists every date and more than half of them haven't vanished at once (that goes to
  review). Dates read off a page's prose never add or move anything. Everything new goes to
  `encore_review_queue`, because a new listing needs a description written fresh (never copied)
  and a check of its category and venue.
- **Schedule** (`vercel.json`). `/api/encore/collect` early Sunday (05:17 UTC), the weekly
  refresh of every due source and then the images; `/api/encore/check` daily (07:41 UTC), the
  sources with performances in the next 21 days, read again for status and price only. Each
  route stops starting work about a minute before its 300-second limit, reports `remaining`
  and `remainingImages`, and calls itself again (up to eight times) until both are 0; a daily
  check with time to spare finishes whatever the weekly run left due. Both accept
  `Authorization: Bearer $CRON_SECRET` or `$ENCORE_COLLECT_SECRET`; `?only=<id>,<id>` runs
  named sources whether due or not.
- **What reads what.** Pages read from 35 days back (`load({ since })` in `lib/encore/store/pg.ts`:
  the dates from that day on, the productions that still have one, the runs that reach it, and
  their images); the status report from yesterday; only the collector reads everything.
- **Pruning** (`lib/encore/prune.ts`). The Sunday collect starts by deleting dates more than 13
  months past, status readings (`encore_checks`) older than 90 days, and productions with nothing
  left whose run ended more than 13 months ago, with their image rows and their files in the
  bucket. It runs in app code, so it is part of a watched job and no pg_cron job is needed; the
  run's `stats.pruned` has the counts. A later `seed` would add pruned seed events back (it adds
  what is missing); the next Sunday removes them again.
- **Health.** `GET /api/encore/status` (same secret) returns every source with its last good
  run, last error and counts, the review queue by kind, the last runs, and counts of events,
  dates in the next 21 days and how many were checked, images. `?queue=1` adds the pending
  items. `npx tsx --conditions=react-server scripts/encore-collect.ts status` prints the same
  from a terminal that can reach the database.
- **Seeding.** `scripts/encore-collect.ts seed` (over DATABASE_URL) or `POST /api/encore/seed`
  (same secret, for when only Vercel reaches the database) loads the JSON. It only adds what is
  missing, so it is safe to run again.
- **Local runs.** `scripts/encore-collect.ts collect --file /tmp/encore.json --images
  public/encore-local` keeps everything in a JSON file and the images on disk; start the site
  with `ENCORE_SNAPSHOT_FILE=/tmp/encore.json` to see it. `scripts/encore-probe.ts` runs adapters
  live and prints what they found against the dataset, per source; `--record <dir>` saves the
  responses (the unit tests' fixtures in `lib/encore/collect/__fixtures__` came from it).

**Event pages.** The side panel is "From the venue" (`components/encore/venue-panel.tsx`):
the next dates as the source lists them, each with its status and its price when published,
"Checked … ago" from the last reading, the price or range, the venue, and buttons to tickets
and to the presenter's own page. It stands in for an embedded venue page: it uses the site's
type, fits a phone and loads no third-party frame. A production that is called off keeps its
page (with the dates struck through) and leaves the calendar and every list.

**Images.** Each event's picture is the presenter's own promotional image for that event (the
og:image or JSON-LD image of its page, or the listing's card art), used to promote their own
event, credited under it ("Image: <presenter>", linked to the page it came from). The collector
resizes it to at most 1600px wide as WebP and stores it in the public `encore-images` bucket
(`encore_images` keeps the source URL, the page, the credit and the size). Logos, icons and
anything under 400px wide are refused (a listing thumbnail that small is retried with the
image on the event's own page), and the stock photo stays the fallback. Every collect run also
looks on the event's own page for current events no source has offered an image for. To take one down on
request: `update encore_images set hidden = true where event_slug = '<slug>';` (the collector
never touches `hidden`, so it stays down), then call `/api/encore/collect?only=<source id>` or
wait for the hourly ISR.

### Reviewing the queue

1. Read the pending items: `GET /api/encore/status?queue=1` or
   `scripts/encore-collect.ts review`. Each has its source, the page, the first date, what the
   source said (`payload`: title, dates, price, image, the source's own wording for reference
   only) and a proposal (`proposed`: slug, venue, market, presenter).
2. **New event, worth listing:** add it with a description written fresh in the site's voice
   (one factual sentence, never the source's words), the right `category`/`site_category`/
   `subcategory`, the venue (`venue_key`, adding an `encore_venues` row if it's a new place),
   `origin = 'review'`, `source_id`, the page in `sources`, then its dates in
   `encore_performances`. Mark the item `status = 'approved'`, `event_slug = '<slug>'`. The next
   run keeps it current like any other event.
3. **Not for the calendar** (a class, a fitness session, a rental under a company's name, a
   duplicate): `update encore_review_queue set status = 'rejected', reviewed_at = now(),
   reviewed_by = '<name>' where id = …;`. A rejected or approved item never comes back.
4. **Already listed under another slug:** `status = 'merged'`, `event_slug = '<that slug>'`,
   and add the item's page to that event's `sources` so the next run matches it by link.
5. **change / removed:** the collector wouldn't make the change on its own (most of a run's
   dates gone, a run's dates read off prose, a production no longer on its ticketing
   platform). Check the source, make the change in `encore_events`/`encore_performances` (or
   hide the event: `hidden = true`) and approve or reject the item.

Claude can do all of this with the Supabase connector (only INSERT/UPDATE; deletes belong in
app code) given this section.

### When an adapter breaks

`/api/encore/status` shows it: `lastError`, `failures`, or a source whose `eventsFound` fell to
nothing. Then:

1. Run it alone against the live site:
   `npx tsx scripts/encore-probe.ts <source id> --record /tmp/rec --json /tmp/out.json` (or
   `/api/encore/collect?only=<source id>` on Vercel) and read the error and the saved response.
2. A moved page or a new listing URL is configuration: `update encore_sources set config =
   config || '{"listings": ["https://…"]}' where id = '<source id>';` (merged over `sources.ts`).
   Put the same fix in `sources.ts` when convenient.
3. A changed page layout is code: fix the reader in `lib/encore/collect/adapters/`, save a new
   trimmed fixture under `__fixtures__/`, update its test in `collect.test.ts`, and run
   `npm run -s test:unit`.
4. A site that now blocks automated reading (a captcha or a JS challenge): set its `adapter`
   to `manual` in `sources.ts` and keep its events by hand through the review steps above.
   Never route around a block or a robots.txt rule.

## The data portraits

The three products each draw their own picture from their own data, on the server, as inline SVG
(`components/art/*`, geometry in `lib/art/*`). Nothing is typed by hand and nothing is a file, so
the pictures are never grainy and never out of date; the raw data stays on the server.

- **Tide** is a ridgeline of the market's sale prices: one ridge per month, the oldest at the back
  and the newest at the front, each the smoothed distribution of that month's qualified home sale
  prices in the three markets (a Gaussian kernel density over log price, `lib/art/tide.ts`). The
  months are the ones ending with the latest month complete in all three markets, the same month
  the Tide issue reports on (`lib/art/load.ts`). It is the masthead on `/blog` and `/tide`, composed
  once at 3:1 and once at 4:3, and the card head on the home page. An issue page opens with a cover
  photograph instead (below).
- **Atlas** is every place in the index as a point of light (`lib/art/atlas.ts`): areas the bright
  stars, communities the field, enclaves faint; each market in its own light; threads between the
  areas and from each community to its nearest neighbour.
- **Encore** is a season clock (`lib/art/encore.ts`): the next 365 days as a ring, today at the top,
  every performance a stroke at its day in its category's light, stacked outward on busy days;
  exhibitions as arcs inside the ring. The category lights are the `art` colours in
  `lib/encore/categories.ts`, separate from the chip colours.

All three share the deep ground and the luminous set in `lib/art/palette.ts`. The masthead version
drifts slowly and its horizon breathes; both stop under `prefers-reduced-motion` and neither moves
layout.

**Arrival.** Each portrait draws itself once (`draw` on the component; `app/globals.css`,
"Arrival"): the Tide ridges draw left to right over 1.1 s (every ridge path has `pathLength={1}`,
so the dash is "1" and the stroke runs on `stroke-dashoffset` while the fills are wiped in beneath),
the Atlas sky settles in from the back one group of places at a time (web, figures, halos, then
the stars by level and market, 60 ms apart), and the Encore hand sweeps the season once and rests
at today while the categories light up behind it. The masthead plays on the page's first paint;
the cards play when they are reached, through `components/motion/in-view.tsx`, which adds
`.draw-on` to its box the first time it scrolls into view. Without JavaScript nothing is added and
the finished drawing shows; reduced motion runs each at 0.01 ms, so it shows finished too. Tide's
issue charts arrive the same way (`components/tide/sparkline.tsx`, `price-bands.tsx`,
`home-mix.tsx`), and the figures beside them count up to themselves over 600 ms on the brand curve
in their own shape (`components/motion/living-number.tsx`, `lib/motion/number.ts`), only when
scrolled to and never for a figure already on screen. On the Atlas map, hovering a row pulses the
place's marker once (a ring to 1.6×, fading over 600 ms); hovering a marker raises the row. A masthead slot in `lib/content/mastheads.ts` is either a photograph (at least 2000px
wide, held to it by `lib/content/mastheads.test.ts`) or an art piece.

## Site search

`/search` searches the site's own content: every guide section, every researched Atlas place
(plus the editorial neighborhood pages), the Tide posts and issues, the Encore events and venues,
the market hubs, the relocation page's sections and a hand-written summary of each main page.
Everything runs in Supabase: Postgres full-text search, pgvector, and the `gte-small` embedding
model (384 dimensions) built into Supabase Edge Functions. No other vendor.

**How a query is answered** (`lib/search/search.ts`):

1. A cached answer for the same words from the last five minutes (per server instance).
2. The query is embedded by the `embed` Edge Function (`supabase/functions/embed`, called with
   the anon key, 4s timeout), then `search_scored()` (migration `0011_search_score_fusion.sql`)
   runs in Postgres over `DATABASE_URL`. It takes the 40 nearest chunks by cosine (HNSW, with
   `hnsw.ef_search` raised to 200 for the call) and the 40 best full-text matches
   (`websearch_to_tsquery`, `english`; plain questions match on any word, a query with quotes or
   a minus sign keeps its strict web-search meaning), and scores every candidate on both
   signals, each on a fixed 0–1 scale:
   - **semantic** = (cosine − 0.82) / (0.92 − 0.82), clamped. On the live index gte-small puts
     gibberish at 0.79–0.82 and strong matches at 0.90–0.94, so 0.82 is the noise floor and
     0.92 a strong match.
   - **keyword** = √(share of the query's words the chunk contains, each word weighted by its
     IDF in the index). 1 when every word is there, whatever the chunk's length; low when it
     only shares a common word ("price", "fix"). Words the index has never seen count against
     the match, so nonsense stays near 0.
   - **score** = 0.8 × semantic + 0.2 × keyword, plus 0.15 when the title is exactly the query
     (a place or venue typed by name).

   A row is shown only if its score is at least 0.2. In words: a chunk with no word in common
   needs cosine ≥ 0.845, a chunk with no semantic signal needs every word of the query, and
   anything between needs some of both. When nothing reaches 0.2, the search returns nothing.
   The settings are `SCORING` in `lib/search/query.ts` (passed on every call; the function's
   defaults match). The excerpt is `ts_headline` with the matched words wrapped in
   U+E000/U+E001, which the page turns into `<mark>`; no HTML ever travels in a result. At most
   three sections of one page are shown. If the query can't be embedded, the same function runs
   on keywords alone (semantic = 0, so only chunks with every word pass).
3. If there's no `DATABASE_URL`, the database errors, the index has nothing yet, or a
   keyword-only search found nothing, the page answers from an in-memory BM25 keyword search
   over the same chunks (`lib/search/fallback.ts`). An embedded query that nothing reaches the
   threshold for is answered with no results, not sent to the fallback. The page never breaks.

**The answer card** (`lib/answers/*`, `components/search/answer-card.tsx`). Above the results, a
question the site already answers gets the answer, with the page it comes from. No model writes it:
`lib/answers/bank.ts` gathers what the pages already say (each hub's questions, the questions on the
editorial Atlas pages, Atlas Move's and the home page's, the terms the guides define, and the sourced
fields of every researched Atlas place) and `lib/answers/match.ts` picks at most one. It errs toward
silence, since a wrong answer above the results is worse than none:

- Only a query shaped like a question (a question word first, or a question mark) gets a written
  question's answer. The words of the query and the question must cover each other, weighted by how
  rare each word is in the bank (`THRESHOLDS`: 0.75 of the query, 0.34 of the question, 0.62 mean),
  and the places must agree: a question that names a place needs the query to name it (unless it
  names all three markets), a question on an Atlas page needs the query to name that place, and a
  hub's unnamed question stands for its market. The place's own question wins over its market's.
- "What is …" with a term a guide defines gets the guide's definition, whole term only.
- A query that names one researched place and asks one fact ("is Camargo in a CDD", "Belleisle
  evacuation level") gets that field of the record with the source it cites and the day it was
  opened; a field the record doesn't hold, or doesn't cite, is no answer. An evacuation level points
  on to the address check (`/check`). A fact about the place named beats a general answer from its
  market's page.
- School ratings, safety and who lives where get a plain decline instead (Fair Housing): what we
  don't answer and where the real source is (the two districts' locators; the address check; Atlas
  Match). "Safe" counts only beside a place's name, and "safe from flooding" is about the land. The
  decline words are in `lib/answers/copy.ts`, which `scripts/copy-rules.mjs` sets aside from the
  places-not-people list for that reason only.

Street, address and ZIP queries never get a card (they get the Tide Street lead). The bank is built
once an hour per server from the same content layer the pages read; a source that fails costs only
its own answers. The `Search` goal carries `answer` (faq, definition, fact or decline) when the
card showed. Tests: `lib/answers/answers.test.ts`, on the real content, including the review's
example ("is Lakewood Ranch in Manatee or Sarasota County").

**Why not reciprocal rank fusion.** The first version (`search_hybrid()`, 0010) fused the two
lists with RRF, the pattern in Supabase's hybrid search guide. RRF looks only at each list's
order: the nearest neighbour gets the same boost whether its cosine is 0.95 or 0.80, a chunk that
matches one common word ranks like one that matches all of them, and the fused number has no
meaning of its own, so it can't be thresholded. Gibberish ("xyzzy blorp") came back as theater
listings until a rule was bolted on outside the fusion. Fusing the scores themselves keeps
"how good is this match" in the number, which is what a threshold needs.

**The eval** (`lib/search/eval/queries.json`, `scripts/search-eval.ts`): 50 queries a buyer,
seller or relocator would type (14 keyword, 11 place or venue names, 5 typos, 13 paraphrased
questions with little or no keyword overlap, 7 gibberish or off-topic queries that should return
nothing), each labelled with the chunk ids that answer it, written from the index's contents
before either method was run. Every third query was held out from tuning. Measured on the live
index, October 2026 (hit@k and MRR over the 43 real queries, top ten after the per-page cap):

| | hit@1 | hit@3 | MRR | real queries with no results | noise with results |
| --- | --- | --- | --- | --- | --- |
| RRF (`search_hybrid` + the noise rule), all | 0.651 | 0.814 | 0.755 | 1 of 43 | 4 of 7 |
| Score fusion (`search_scored`), all | **0.837** | **0.860** | **0.851** | 3 of 43 | **0 of 7** |
| RRF, held-out third (14 + 2 noise) | 0.643 | 0.929 | 0.780 | 0 | 1 of 2 |
| Score fusion, held-out third | 0.857 | 0.857 | 0.857 | 1 | 0 of 2 |

By type (MRR, RRF → scored): keyword 0.96 → 1.00, places 0.87 → 1.00, paraphrases 0.53 → 0.74,
typos 0.51 → 0.40. Typos are the one loss: "siesta kee" and "flod zone" have one real word, a
made-up one and a weak cosine, so they fall under the threshold, where RRF showed them at ranks
5 and 3. "hommestead portabilty" fails both ways (gte-small doesn't see through it). Raising
`hnsw.ef_search` alone doesn't move RRF's numbers (identical at 200); the gain is the fusion.
Keyword-only mode (no embedding) is much weaker (MRR 0.36, every word required) and leans on the
in-memory fallback, as before.

How much of this is fitted: the weights and threshold were picked by grid search on the tuning
two-thirds (29 real + 5 noise queries). Most settings near the chosen one score within 0.01 MRR
of it, so the exact numbers aren't what's doing the work; the threshold is the fragile part.
On the tuning split the highest-scoring noise query reached 0.149 and the weakest right answer
0.174; 0.2 was chosen for margin over the noise, and it costs one held-out query ("flod zone",
0.194). 50 queries is a small set: treat ±0.05 on these numbers as noise.

`GET /api/search?q=` returns the same JSON (`q`, `source`: hybrid or keyword, `results`), 2–200
characters, 30 a minute per IP per instance (429 past it), `s-maxage=300`. `/search` itself has
its own limit of 60 a minute per IP; past it the page answers from the in-memory index. Result
pages (`?q=`) are `noindex, follow`; `/search` alone is in the sitemap. The header's search
button and ⌘K / Ctrl+K open it with the cursor in the box. The Plausible `Search` goal carries
only a bucket of the result count.

**The index** (`search_documents`, migration `0010_search.sql`): one row per chunk, id readable
and stable (`guide:<slug>#<section>`, `place:<slug>`, `post:<slug>`, `tide:<issue>#what`,
`event:<slug>`, `venue:<slug>`, `page:<path>#<part>`; later parts of a long chunk end `~2`,
`~3`), the url with the section's anchor, the body, a `content_hash`, the `embedding` and a
generated `fts` (title A, section B, body C). RLS on with no policies and execute on
`search_scored` (and the retired `search_hybrid`) revoked from `anon` and `authenticated`: only
the server reads it. Chunks are
150–300 words where the content allows (a place or an event is shorter), and each is embedded
with its title and section in front. Zoned schools, research notes and anything age-related are
left out of the index; county-registry places aren't indexed (their pages are noindex). The page
summaries live in `lib/search/copy.ts` and are checked by `check:copy`; when a main page changes,
change its summary there.

**Reindexing** (`lib/search/indexer.ts`): load every chunk, compare by id and content hash,
delete rows whose ids are gone, embed only new or changed chunks (the Edge Function stops at
its CPU budget and returns `complete: false`; the client sends the rest, four calls at a time,
with retries), and upsert each group of 48 as it finishes, so a run cut short keeps its work. If
a content source fails to load, or the run has under half the stored rows, deletes are held
back (`?force=1` lets the second case through).

- Daily: Vercel Cron calls `GET /api/search/reindex` at 08:23 UTC with `CRON_SECRET`.
- By hand: `curl -X POST -H "Authorization: Bearer $SEARCH_REINDEX_SECRET" https://<site>/api/search/reindex`.
  A run stops starting new work a minute before its 300s limit and reports `remaining`; repeat
  until it's 0. The first full index (about 1,700 chunks) should take one or two calls.
- From a machine that can reach Postgres: `npm run search:index` (no deadline; reads
  `.env.local`). `npm run search:index -- --dry-run` lists the chunks without touching anything.
- After a deploy that changes content, the next daily run picks it up; call the route to do it
  sooner. Neither the build nor the pages depend on the database.

**Environment:** `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(already set for the site), plus `SEARCH_REINDEX_SECRET` and/or `CRON_SECRET` for the reindex
route. `SEARCH_EMBED_URL` overrides the function's address (defaults to
`<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/embed`).

**The Edge Function** `embed`: `POST {texts: string[]}` (1–64 texts, 2,000 characters each,
otherwise 400) → `{model, dims, complete, embeddings}`, `gte-small` with mean pooling and
normalisation. `verify_jwt` is on; it has no database access. The file in
`supabase/functions/embed/index.ts` is the deployed source: redeploy with
`supabase functions deploy embed` after a change. It's excluded from `tsc` (it's Deno).

**Tuning:** `SCORING` in `lib/search/query.ts` holds the match count, the semantic weight, the
cosine floor and ceiling, the title boost, the threshold and the candidate count. `search_scored`
also returns each row's `cosine` and `keyword` score, so a query can be inspected in the SQL
editor: `select id, score, cosine, keyword from search_scored('flood insurance', '<vector>'::extensions.vector);`
(pass `min_score => 0` to see what the threshold drops). To re-tune:

1. Add or fix queries in `lib/search/eval/queries.json` from what the index holds
   (`select id, kind, title, section_title from search_documents`), never from what a method
   returned. Keep some gibberish and off-topic queries.
2. `npm run search:eval` (needs `DATABASE_URL` reachable, plus the Supabase URL and anon key)
   prints hit@1, hit@3, MRR, real queries with no answer and the noise false-positive rate for
   the tuning and held-out splits. `--verbose` lists each query's top three; `--set
   minScore=0.18` tries a setting; `--grid` sweeps weight × floor × threshold and lists the best
   settings with no noise results.
3. Choose from the tuning split, from a plateau rather than a peak, then read the holdout once.
   Watch the cosine floor if the model or the content changes: re-measure where gibberish lands
   (`select max(1 - (embedding <=> '<vector>')) from search_documents` for a few nonsense
   queries).
4. Change `SCORING`, and the function's defaults in a new migration, together.

The eval was first run through the Supabase connector with its queries and embeddings in a
scratch schema, `search_eval` (not used by the site; RLS on, nothing granted to the API roles).
It can be dropped. `search_hybrid` is no longer called; `0011_search_score_fusion.sql` carries a
commented `DROP` for it, to run once the new function has been live for a while.

## Search and answer engines

- FAQPage structured data on the home page (five questions), the buy page, the sell page and every
  neighborhood page (three questions each, in `lib/content/seed/neighborhoods.ts` and the Sanity
  `faqs` field). Every FAQ carries a plain-text `answer` beside its JSX `a`; keep both in step.
- Open Graph images are generated per page (`opengraph-image.tsx` beside home, buy, sell, about,
  listings, events, venues, neighborhoods, the market hubs, the tools, and since October 2026
  `/calendar`, `/guides`, `/tools`, `/contact`, `/reviews` and `/listings`) from the page's photograph
  and the brand lockup (`lib/og.tsx`). Every card leaves as a JPEG under 300 KB (`OG_BUDGET`,
  checked by `lib/og-budget.test.ts`; WhatsApp skips larger previews), and the photograph is cut to
  its 520x630 box before it's drawn, so a cold render never decodes a full-size original. Pages
  without a card of their own (privacy, terms, search) use `/og-image.jpg`.
- Titles: one template in `pageMetadata` (`lib/seo.ts`, `composeTitle`). The team's name follows
  the title when both fit a result's width (measured as 20px Arial against 600px, not counted in
  characters); a data page's qualifiers (`titleQualifiers`: a place's town and kind, an event's
  venue, a listing's price) give way first. Titles, descriptions, share titles and FAQ structured
  data get curly quotes (`lib/typography.ts`).
- Descriptions: place pages build theirs from the record's facts when the words run short
  (`lib/neighborhoods/describe.ts`), guides add the byline and the day their sources were checked,
  and `lib/neighborhoods/describe.test.ts` holds every researched place and guide at 110 characters
  or more.
- Structured data for answer engines: each Person has its `/about#slug` address and `sameAs` from
  `profiles` on the team record (the agents' own pages elsewhere; only real ones); the team lists
  Manatee and Sarasota counties and `knowsAbout`; each place page's Place carries `additionalProperty`
  rows for gated, HOA, CDD, evacuation zone and water, each with the source that names it.
- `/llms.txt` lists every researched place by market; `/llms-full.txt` carries every guide's text
  with its sources (`lib/guides/markdown.ts`).
- Sitemap: `/sitemap.xml` is an index of `/sitemaps/sitemap/pages.xml`, `neighborhoods.xml` and
  `calendar.xml` (`lib/sitemap.ts`), with real `lastmod` dates only (a place's latest source check,
  an event's last collector read, the sales refresh, a guide's update) and `image:image` entries.
- Three evergreen guides ship in the seed (gated communities, inspections, selling from away). They
  carry no figures. The sample market reports stay behind `NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS`.
- RealEstateAgent and Person on every page, Article on reports and guides, Event and Place on the
  calendar, BreadcrumbList on detail pages. No license numbers anywhere, at the client's direction.
- Team photographs were upscaled 2x with a light denoise and sharpen; the originals are 1100px on
  the long edge. Replace them with the photographer's full-resolution files when available.

## Content: seed now, Sanity when ready

`lib/content/index.ts` picks the source at request time:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` empty → `lib/content/seed-source.ts` (sample data, relative event dates).
- Set → `lib/content/sanity-source.ts` (GROQ through the CDN client, tagged for on-demand ISR).

Both return the same TypeScript shapes, so no page changes when the switch is flipped.

To bring Sanity online:

1. Create the project and dataset; put the ids in `.env` (see `.env.example`).
2. `npx sanity exec scripts/seed-sanity.ts --with-user-token` — pushes the sample content and photographs.
3. Add a GROQ-powered webhook in Sanity Manage → `POST https://<site>/api/revalidate`, secret =
   `SANITY_REVALIDATE_SECRET`, projection `{ _type, "slug": slug.current }`.
4. Open `/studio`. The Presentation tool previews the live site with click-to-edit
   (`/api/draft-mode/enable`). `SANITY_VIEWER_TOKEN` (read-only) is enough for previews.
5. `npm run sanity:typegen` to generate typed query results once a project exists.

Tier notes, cost levers and the archive requirement are in `docs/handoff/integrations/sanity.md`.

## Leads: one action, one pipeline

Every form (`components/lead-form.tsx`, `components/letter-form.tsx`) posts to
`actions/submit-lead.ts`, which validates and hands off to `lib/lead-pipeline.ts`:

0. **Rules and the guard.** `lib/leads/rules.ts` holds the checks (no zod), run by the form before
   it sends and by the server schema (`lib/leads/schema.ts`) when it arrives. An email or a phone
   is enough on the enquiry forms; phones are parsed by `lib/phone.ts` and kept as `(941) 555-0100`
   with E.164 beside them. `lib/lead-guard.ts` then answers a resend of the same attempt (the
   form's `submissionId`) without sending anything twice, and keeps a honeypot hit or a sender over
   the rate limit (6 per address per 10 minutes, 4 per email or phone per hour; the keys are
   hashes) as `suspected_bot`, sent nowhere. Every check fails open.
1. **Postgres first** (`leads` + `lead_deliveries`, plus `contacts`/`events` for the consent record), when
   `DATABASE_URL` is set. The lead row exists before anything external is tried, and it's all the
   visitor waits for: the steps below run after the response (`after()` from `next/server`). A
   returning email updates its `contacts` row, and the lead carries `priorEnquiries`.
2. **CRM** through `lib/crm.ts`. `CRM_PROVIDER=webhook` (the default when `CRM_WEBHOOK_URL` is
   set) POSTs the payload to a Zapier Catch Hook, which runs Compass "Create a New Lead" into the
   Home Platform; 8s timeout, one retry, any 2xx is success, `Idempotency-Key` = the lead's id.
   `fub` keeps the old Follow Up Boss client (`lib/fub.ts`); `none` means no CRM. The result lands
   in `leads.delivery_status`.
3. **Team email** with the full payload to `TEAM_NOTIFY_EMAIL` (Resend), reply-to the visitor.
4. **Alert** to `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`) when the CRM step failed.
5. **Server-side Plausible** `Lead server` event (`form`, `channel: server`), with the visitor's
   User-Agent and IP forwarded, as a backstop for visitors whose ad blocker stops the script.

Steps 2 and 3 go through the outbox (`lib/lead-outbox.ts`, table `lead_outbox`): a failure is
retried after 1, 5, 15, 60 and 240 minutes, swept after every new lead and daily by
`/api/cron/lead-redeliver`, and marked `dead` after six tries or three days with a `[lead-alarm]`
log line (and a Sentry message when it's on). Without a database there's nothing to come back to,
so the steps run before the answer and decide it. Migration `0015_lead_guard_and_outbox.sql`
holds the outbox and the guard's tables; until it's applied each sink is tried once, as before,
and one log line names the file.

The form itself (`components/lead-form.tsx`, Figma "01 Lead form"): the two questions (timing,
then a house to sell) come first as rows of chips (radios underneath), then name, email and
phone. With JavaScript it never resets: a failed check focuses the first field to fix, under the
header, and lists them by Send ("Two things to fix above: name, email"); the Send label and width
hold while it's sending and the dash runs; a failed or dropped request shows the call-or-text
line, never the error page. Without JavaScript it posts as a plain form and the page comes back
with the values. Home Platform's pixel reads named fields as they're typed, so once the page is
live only the visitor's own name, email and phone and the two questions keep a `name`
(`lib/leads/pixel.ts`); the message, the address and everything about a referred friend are added
to the request by the form itself. `scripts/check-client-bundle.mjs` (postbuild) fails the build if
zod reaches a browser chunk.

Then a `LeadForm` sends the visitor to `/thanks/<form>` (what happens next, both direct numbers,
"Book 15 minutes" when `NEXT_PUBLIC_BOOKING_URL` is set, one next step; `noindex`; fires the `Lead`
goal). The `LetterForm` bars stay inline: the success line shows where the bar was and `Subscribe`
fires there. With JavaScript off the inline success state shows for every form. The visitor sees an error only
when nothing kept the lead; in production a deployment with no sink at all logs an error at boot
(`instrumentation.ts`) and `GET /api/health` reports `ok: false`. On the live site health also
needs a sink that tells a person (the CRM webhook or the team email): with Postgres alone it
answers 503 (`no-human-sink`). The thank-you page says back what was sent ("For 9403 9th Ave NW,
moving inside three months.", from sessionStorage, never the URL), offers the plan link a tool
sent for sharing, and puts "Book 15 minutes" first, prefilled with name and email, on the
contact, buy, sell and valuation pages when the booking URL is set.

**The site emails a visitor only about the newsletters.** A Tide or Encore sign-up, or a ticked
email box, gets one confirmation email (double opt-in); once confirmed, a short welcome and each
issue (`docs/ISSUES.md`). Replies to an enquiry come from the agents' own Coldwell Banker mailboxes
(a Zapier step if they want a template).

Consent: every enquiry form with an email field shows an unchecked **email** box; forms with a phone
also show the unchecked **calls/texts** box (`CONSENT_EMAIL_WORDING`, `CONSENT_WORDING` in
`lib/leads/constants.ts`). Neither is required, and the referral and review-permission forms show
neither. Call/text consent is recorded only with a valid phone number. State, timestamp and `CONSENT_WORDING_VERSION` are stored on
the lead and travel as `consent:email` / `consent:sms` tags. The Tide and Encore boxes imply email
consent and record `IMPLIED_CONSENT_VERSION` (`implied:subscribe`) instead, since the visitor saw
the band copy, not a checkbox. The payload field map for Zapier is in `docs/INTEGRATIONS.md`.

## Growth pages: channels, referrals and reviews

- **Channel landings** `/from/youtube`, `/from/instagram`, `/from/facebook`, `/from/nextdoor`: the
  links for bios and posts. One component (`components/growth/channel-landing.tsx`) and one copy file
  (`lib/channels/copy.ts`): a line in the team's voice, one primary action (the relocation planner
  for YouTube and Instagram, What sold on your street for Facebook and Nextdoor), then Atlas match,
  the Encore visit planner and the Tide bar. `noindex, nofollow` and left out of the sitemap. The
  visit's channel is kept for the session and every form sends it as `source`, so the lead is tagged
  `source:<channel>`; a first visit with no `utm_*` also gets `utm_source=<channel>`,
  `utm_medium=social` in the first-touch record (`docs/MEASUREMENT.md` §4).
- **`/refer`**: "Know someone moving here?" The `referral` form is two labelled groups: "About you"
  (the referrer's first name, last name, email and phone) and "About them" (the person moving: first
  name, last name, email and/or phone, what they're planning, a note), closed by a required box
  marked "(required)": "They know I'm passing their details along and expect to hear from Joelyn
  and Jessica." No marketing boxes for the referrer. Under the form, "Rather send them a link"
  shares Atlas instead, and the referral thank-you page has the same share. The referred person
  travels under `referral` in the payload with a CRM note naming the referrer (`lib/crm.ts`,
  `docs/INTEGRATIONS.md`). The copy says we write back to the referrer first and reach out to the
  person at their pace. No gifts or rewards are mentioned (anything like that is cleared with the
  brokerage first). Tags `form:referral`; a `General Inquiry` like `contact`.
- **`/reviews`**: the Google review link from `NEXT_PUBLIC_GOOGLE_REVIEW_URL` (an `https` URL; when
  it's empty the page says the link is coming soon), and the `review-permission` form: name, email,
  the words, and a required box ("You can use these words on the site with my first name and the
  place we bought or sold", `REVIEW_CONSENT_WORDING`, versioned `REVIEW_CONSENT_VERSION`). Stored
  like every lead, tagged `consent:review`. **Nothing from it is displayed anywhere on the site**; a
  quote goes up only when someone enters it as a Sanity `testimonial` with `permissionOnFile`.
- **Where they're linked.** `/refer` and `/reviews` sit at the end of the footer's "The team"
  column and in the sitemap; the `/from/*` pages are linked only from the profiles themselves.
- **Copy check.** Each page's strings live in a `copy.ts` (`lib/channels`, `lib/refer`,
  `lib/reviews`) and `scripts/check-copy.mjs` (prebuild) runs the Fair Housing list and the stricter
  hub rules over them alongside the hubs.
- **Social links.** `socialLinks` in `lib/site.ts` (empty until the client sends the URLs) plus any
  in the Sanity site settings feed the footer's icon row and `sameAs` on the RealEstateAgent
  JSON-LD; both render nothing while the list is empty.

## The questionnaire: private links for Joelyn, Jessica and the owner

The website questionnaire (121 questions in 10 sections, the facts the site still needs from the
team) lives on the site at three private links. Nobody needs an account.

- **Routes.** `/q/<token>` in its own route group, `app/(questionnaire)`: no site header, footer,
  analytics or lead pixels, and nothing loaded from another origin. Joelyn's token shows her own
  section plus the eight shared ones (team, promises, first questions, footer and legal, accounts
  and tools, photos, Tide and Encore, anything else) and hides Jessica's; Jessica's is the mirror.
  Each sees 107 questions, numbered 1 to 107 on their own link; the compiled view and the
  exports use the source numbering, 1 to 121. The admin token shows the compiled view: both answers to every question
  side by side (stacked on phones), each person's progress and last save, an "Answers differ"
  marker on shared questions, Print, and Download Markdown / Download CSV from
  `/q/<admin token>/export?format=md|csv` (checks the admin token, 404 for anything else). Any
  other token is a 404 that says nothing about what the link was for.
- **Kept private.** `robots: noindex, nofollow`, `X-Robots-Tag`, `Referrer-Policy: no-referrer`
  and `Cache-Control: no-store` on `/q/:path*` (`next.config.ts`), `Disallow: /q/` in
  `app/robots.ts`, and not in the sitemap. There is no proxy/middleware in front of it.
- **Code.** The questions are `lib/questionnaire/questions.ts`, copied verbatim from the
  questionnaire artifact; ids are the storage keys, so never rename one. Who sees what and the
  numbering are in `model.ts`, the Markdown and CSV in `compile.ts`, the save rules (Zod, 10,000
  characters an answer, only your own questions and the options a question offers) in
  `validate.ts`, the wording around the questions in `copy.ts` (checked by `check:copy`), and the
  pages in `components/questionnaire/*`. Tests: `lib/questionnaire/questionnaire.test.ts`.
- **Storage.** Postgres table `questionnaire_answers` (respondent, question_id, value, choice,
  updated_at; primary key respondent + question_id; RLS on, no policies), migration
  `0007_questionnaire.sql`. `lib/questionnaire/store.ts` also runs the same `CREATE TABLE IF NOT
  EXISTS` and `ENABLE ROW LEVEL SECURITY` once per server process, so the links work even if the
  migration hasn't been run. Saves go through a server action that checks the token again and
  writes only that person's rows. `updated_at` is when the answer was typed, and an older copy
  never overwrites a newer one.
- **Without a database.** Every change is written to the browser's `localStorage` straight away
  (`jj-questionnaire:v1:<joelyn|jessica>`) and sent ~900ms after typing stops; the local copy is
  cleared only once the server confirms it. With no `DATABASE_URL` the form says answers are kept on
  this device until the database is connected, and the status reads "Kept on this device". A failed
  save reads "Couldn't save, kept on this device". The next time the link is opened with a working
  database, anything kept locally that is newer than the server copy is sent and then cleared. The
  admin page says plainly when the database isn't connected; answers typed before then are only on
  the phone or computer they were typed on until that person opens their link again.
- **Tokens.** `lib/questionnaire/access.ts` holds only the SHA-256 of each token, compared in
  constant time. The raw links are kept outside the repo by whoever sends them (never in code,
  commits, docs or issues). To rotate one:
  1. `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"` for a new token.
  2. `node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" <token>`
     for its hash.
  3. Replace that role's `sha256` in `TOKEN_HASHES`, deploy, and send the new
     `https://<site>/q/<token>` link. The old link stops working on deploy; answers stay, since
     they're stored by person, not by token.

## Client rooms: a private page per client, without a login

Once someone is working with the team, `/room/<token>` is their page: the neighborhoods the team
has picked with them, their Atlas Move plan and Encore visit plan, where they are in the buyer's or
seller's guide, the team's notes, and how to reach Joelyn and Jessica. Nobody signs in; the link is
the only way in, as with the questionnaire.

- **Making and keeping one.** The console is `/q/<token>/rooms` behind each person's own
  questionnaire link (Joelyn's, Jessica's or the admin's, `lib/questionnaire/access.ts`): a first
  name and what they're doing makes a room and shows its link once; `/q/<token>/rooms/<id>` edits
  it (the guide step, neighborhoods from the Atlas index, the two plan links pasted from the
  planners, notes), makes a new link (the old one stops working at once) and closes or reopens it
  (a closed room's link is a 404 and nothing is deleted). The client's page is rendered underneath,
  as it stands.
- **What is stored.** `client_rooms` (migration `0019_client_rooms.sql`, also created on first
  use by `lib/room/store.ts`): the SHA-256 of the token, the first name as typed, the kind, the
  status and the room as JSON (`lib/room/model.ts` reads it back tolerantly). A pasted plan link is
  reduced to the planner's own canonical query (`planQuery`): another path or a key the planner
  doesn't define never survives, so a room never carries anything personal beyond the name. The raw
  token is shown to the agent once and never kept.
- **Kept private.** `app/(room)` is bare like the questionnaire (no header, footer, analytics or
  pixel; nothing from another origin); `noindex`, `X-Robots-Tag`, `Referrer-Policy: no-referrer`
  and `Cache-Control: no-store` on `/room/:path*` (`next.config.ts`); `Disallow: /room/` in
  `app/robots.ts`; not in the sitemap. The title carries no name. Without `DATABASE_URL` the
  console says so and a client's link is a plain 404.
- **Code.** `lib/room/{model,validate,store,copy}.ts` (copy checked by `check:copy`), the pages
  in `app/(room)/room/[token]` and `app/(questionnaire)/q/[token]/rooms`, the pieces in
  `components/room/*`. Tests: `lib/room/room.test.ts`, which also holds the guide-step list to the
  titles on `/buy` and `/sell`.

## Cards to post: a private link for Joelyn and Jessica

`/cards/<token>` gives the team cards they can post, drawn from the site's own data and
photographs, at Instagram's feed (1080x1350) and story (1080x1920) sizes, as PNGs to download:

- **Tide**: the latest issue's three median sale prices, on the issue's cover photo.
- **This week on the coast**: the Monday issue's Encore picks for the week (`pickWeek`).
- **A neighborhood**: any place Atlas has researched, by name: its kind, jurisdiction, gated, HOA
  and CDD on record, evacuation zone and ZIPs, each only when the record holds it.
- **A street**: Tide Street's count and median for one street over the sales window.

Each card carries the JJ lockup, the Coldwell Banker mark (the brand's white file) and the short
address of the chosen network's landing page (`jjpremiergroup.com/from/instagram`, …), and comes
with a caption to copy. Every caption and card line runs through `checkFairHousing` before the card
is offered; a held card says so instead. The words are in `lib/cards/copy.ts` (checked by
`check:copy`), the data in `lib/cards/data.ts`, the drawing in `lib/cards/render.tsx`, the page in
`app/(cards)` (bare like the questionnaire: no header, analytics or pixels; `noindex`,
`X-Robots-Tag`, `Referrer-Policy: no-referrer` and `no-store` on `/cards/:path*`; `Disallow:
/cards/`; not in the sitemap). The token works like the questionnaire's: only its SHA-256 is in
`lib/cards/access.ts`, the raw link is kept outside the repo, and `CARDS_TOKEN_SHA256` (optional)
replaces the hash to rotate it without a code change.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # next typegen (typed routes), then tsc --noEmit
npm run test:unit
npm run check:copy
npm run lint         # ESLint 9 with eslint-config-next (eslint.config.mjs)
npm run build
npm run sanity:typegen
```

`.github/workflows/ci.yml` runs typecheck, unit tests, the copy check, lint and
`npm audit --omit=dev --audit-level=critical` on every pull request and every push to main.
Make its `checks` job a required status check on main (Settings → Branches) so nothing merges red.
Dependabot (`.github/dependabot.yml`) opens one grouped minor-and-patch pull request a week;
majors are upgraded by hand. Lint's React Compiler rules (`set-state-in-effect`, `purity`, `refs`,
`immutability`) are warnings because the site doesn't use the compiler; see the comment in
`eslint.config.mjs`.

Useful switches:

- `NEXT_PUBLIC_ROBOTS_NOINDEX=true` sets `noindex, nofollow` on every page and in `robots.txt`.
  Turn it on for previews and the pre-launch domain, off at launch.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` loads Plausible (outbound links and tagged events). Custom events
  go through `track()` in `lib/analytics.ts`; register each as a goal in Plausible, with the props
  as custom properties:

  | Goal | Fired from | Props |
  | --- | --- | --- |
  | `Lead` | `/thanks/<form>` after a `LeadForm` send | `form`: contact, buy, sell, valuation, listing, referral · `market` · `source` (the `/from/<channel>`, or none) |
  | `Subscribe` | the `LetterForm` bars (Tide band, blog, calendar, Encore row, `/from/*`) inline on success | `form`: letter or calendar · `source` when there is a channel |
  | `Review permission` | `/thanks/review-permission` after the `/reviews` form | `form` · `market` · `source` |
  | `Lead server` | `lib/plausible-server.ts`, from the server action, for every form | `form` · `channel`: server. A backstop for visitors whose ad blocker stops the script; never add it to `Lead` |
  | `Calendar feed` | ICS links: the calendar page feed, Encore's filtered subscribe, the event page, the visit plan | `kind`: feed, event, performance, list, plan · `filter`: `all`, the feed query, or the event slug |
  | `Phone tap` | `tel:` and `sms:` links | `where`: header, footer, action-bar, action-bar-text, contact, contact-text, thanks, thanks-text, from-<channel> |
  | `Share` | `ShareButton` | `what`: calendar-view, my-list, … |
  | `Explore` | the tools, the footer's hub links, the `/from/*` buttons | `action`: select, filter, match, calendar-day, visit-plan, relocate-plan, sold-search, home-value, net-proceeds, hub, channel-cta, channel-more |
  | `Search` | `/search`, once per query shown | `results`: 0, 1-3, 4-9 or 10+. Never the query text (people type names and addresses) |
  | `Web Vitals` | `components/web-vitals.tsx`, 10% of page loads, once per metric | `metric`: LCP, INP, CLS · `rating` · `value`: a bucket · `template`: the landing route · `device` · `pixel`: on, off (`docs/MEASUREMENT.md` §5) |

  The full list of props, the funnel each goal answers and the exact Plausible setup are in
  `docs/MEASUREMENT.md`.

  Server-rendered `tel:`/`sms:` and ICS anchors use `components/tracked-link.tsx`, which fires the goal
  on click and leaves the navigation alone. `NEXT_PUBLIC_PLAUSIBLE_HOST` only for a self-hosted instance.
- First-touch attribution lives in `components/utm-tracker.tsx`: the landing path, external referrer,
  timestamp and any `utm_*`, `gclid` or `fbclid` are kept in `localStorage` for 90 days (no cookies),
  never overwritten while fresh, and forwarded by every form as `utm__<key>` hidden fields into
  `contacts.utm`, `leads.source` and the `source` block of the CRM webhook payload.

## Launch checklist

The operator's runbook for the cutover itself (client and brokerage checklist, Vercel variables, Zapier, Supabase, DNS, verification, first week) is `docs/LAUNCH.md`; the list below is the short form.

1. Add the custom domain to the Vercel project and set `NEXT_PUBLIC_SITE_URL` to it (with
   `https://`). Every canonical, sitemap entry, Open Graph URL and ICS UID uses this value.
2. Remove `NEXT_PUBLIC_ROBOTS_NOINDEX` (or set it empty) in the production environment and
   redeploy. Check `/robots.txt` and one page's `<meta name="robots">` afterwards.
3. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to the bare domain and confirm a pageview in the dashboard.
4. Google Business Profile: the client is creating it. The name, address and phone on the profile
   must match the footer, the contact page and the RealEstateAgent JSON-LD exactly (same
   punctuation, same suite line). Once the profile is live, add it to `socialLinks` in
   `lib/site.ts` (or the Sanity site settings) alongside the social links, which puts it in
   `sameAs`, and set `NEXT_PUBLIC_GOOGLE_REVIEW_URL` to its review link for `/reviews`.
5. Submit the sitemap in Google Search Console and Bing Webmaster Tools.
6. Confirm the custom 404 renders on the live domain (`/this-does-not-exist`).
- `LEAD_ALERT_EMAIL` (falls back to `TEAM_NOTIFY_EMAIL`) receives the alert when a lead cannot be
  delivered to the CRM (webhook rejected or unreachable; with `CRM_PROVIDER=fub`, also the
  archived-flow 204 case).
- `CRON_SECRET` protects `GET /api/cron/archive-events` (Bearer token), scheduled weekly in
  `vercel.json`, the daily lead redelivery (`/api/cron/lead-redeliver`), and the daily search reindex (`/api/search/reindex`, which also takes
  `SEARCH_REINDEX_SECRET`).

## Verification done for this build

- `npm run typecheck` (0 errors) and `npm run build` (80 static pages) pass with no env configured.
- Every route rendered in Chromium at 1440, 810 and 390: 200 status, exactly one `h1`, no
  horizontal scroll, no console errors. The one exception is the deliberate 404 test URL.
- Five independent review passes (design fidelity against the mockup, responsive layout,
  accessibility, compliance, code correctness) and all findings applied, except three deliberate
  keeps listed below.
- Fair-housing check (`lib/fair-housing.ts`) run over all copy files: nothing flagged.
- Open Graph images checked for the home page and a listing; the ICS feed checked for RFC 5545
  folding, escaping, CRLF and correct America/New_York times; listing filters fuzzed with
  `__proto__`, `constructor` and malformed values (all 200).

Deliberate keeps from the review passes:

- Both agents are titled REALTOR® (client correction; the brand system originally said Broker
  Associate). The mark is always set in capitals with the ® symbol.
- The Coldwell Banker mark sizes (185 in the nav, 220 in the footer) follow the approved mockup.
- The privacy and terms pages carry a "draft for legal review" label until counsel signs off.

## Security headers, legal pages and the error pages

- `next.config.ts` `headers()` sets `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN` (not DENY: the Studio's Presentation tool
  frames site pages from `/studio`) and a `Content-Security-Policy-Report-Only` whose hosts are
  derived from the same env vars the app reads (Plausible host, MapTiler or OpenFreeMap, the
  Sanity project). `/studio` gets a wider variant. Next's inline hydration scripts and the inlined
  Plausible queue need `'unsafe-inline'` until a per-request nonce is issued from a `proxy.ts`, and
  the dev server needs `'unsafe-eval'`. The policy is still report-only: the one report every
  production page sent (zod's `Function("")` JIT probe) is gone (`instrumentation-client.ts` sets
  zod to jitless), and a local pass over the main pages with Plausible and Sentry on sends none. The
  last step, once a week of production traffic (which is where the Home Platform pixel runs) has
  logged no `[csp-report]` lines, is to change `CSP_HEADER` in `next.config.ts` to
  `Content-Security-Policy`; check `/studio` the same way once Sanity is configured. Each report line
  names the script (`source=`). Also set: `Cross-Origin-Opener-Policy: same-origin`
  (`same-origin-allow-popups` on `/studio` for Sanity's sign-in window), and no `X-Powered-By`.
- `GET /api/health` answers `{ ok }` (200, or 503 when production would drop a lead) to anyone; the
  detail (sinks, newsletter, Places, Sentry, which deployment) needs `Authorization: Bearer` with
  `CRON_SECRET`, `ENCORE_COLLECT_SECRET` or `LEAD_TEST_SECRET`, and `?deep=1` with the same secret
  adds what the database knows ("Scheduled jobs and alerts" below). Bearer checks go through
  `lib/bearer.ts` (constant-time).
- Caching: photos under `/images` are `max-age=604800, stale-while-revalidate=2592000` (names are
  reused when a file is replaced, so not immutable); optimized images keep 31 days
  (`images.minimumCacheTTL`); the MapLibre worker lives in `/vendor/maplibre-gl/<version>/`
  (immutable) behind a one-line `/vendor/maplibre-gl-worker.mjs` that imports it.
- The privacy policy names the stack as deployed: Plausible (cookieless), Vercel, Supabase,
  Zapier to the brokerage's CRM (the Home Platform), Resend for team notifications only, MapTiler
  for tiles. Production needs `NEXT_PUBLIC_MAPTILER_KEY` set for the map paragraph to be exact;
  without it the explorer falls back to OpenFreeMap.
- `app/global-error.tsx` is the last-resort page (own `<html>`, seed phone numbers, fallback font
  stacks); `app/(site)/error.tsx` handles errors inside the site layout; both `not-found.tsx`
  files share `components/not-found-content.tsx`.

## Still open (needs the client or the brokerage)

Phase 0 blockers from `docs/handoff/BUILD-PLAN.md`:

1. Office street address and zip for the footer, JSON-LD and the privacy page.
2. Joelyn's Florida licence number (Jessica's is in; the footer hides a name until its number exists).
3. The Zapier Catch Hook URL (`CRM_WEBHOOK_URL`) and the Zap into the Home Platform. Until it is
   set, leads are mirrored to the database and emailed only, and production logs an alert.
4. The Sanity project and dataset, then the seed script and webhook in the section above.
5. Consent wording sign-off from counsel (`CONSENT_WORDING` in `lib/leads/constants.ts`) and 10DLC
   registration before any texting starts.
6. An IDX licence from Stellar MLS before any MLS data or MLS wording goes on the site. The sample
   listings are placeholders.
7. Coldwell Banker brand asset review, and licensed webfont files for IvyPresto Headline and
   Contralto (the CSS stacks already lead with them).

Also worth knowing:

- Tide and Encore subscribers go through the same pipeline as every other lead (tagged
  `consent:email`) and are mirrored to the database. Nothing emails them from the site.
- Every statistic on the site carries its source and date in the seed content. When the numbers
  are replaced in Sanity, keep the source field filled.

## Previews

Preview deployments share production's database and keys (`docs/LAUNCH.md` §2), so
`lib/deploy-env.ts` reads `VERCEL_ENV` and only production does anything outside the site. On a
preview (and on `vercel dev`):

- the CRM provider is `none` (`lib/lead-sinks.ts`): no Zapier webhook, no Follow Up Boss;
- `sendEmail` (`lib/email`) sends nothing, or, with `PREVIEW_EMAIL_TO` set, sends to that one test
  inbox with "[Preview]" in front of the subject; it answers ok with id `preview-noop`, so nothing is
  queued for production to retry;
- subscriber email is off (`lib/newsletter/config.ts` lists "a production deployment" as missing):
  no subscription is recorded and no confirmation goes;
- Google Places is off (`placesEnabled()`), so previews never spend production's daily allowance;
- Plausible is off, the script and the server-side `Lead server` event alike;
- every lead is saved with `is_test = true` and the tag `preview`, and the team email (to the test
  inbox, if any) says so;
- scheduled jobs refuse to run (403), whoever calls them, since they write to production's data;
- the lead outbox's sweep (`redeliverDue`) doesn't run on a preview, and production's sweep skips
  any lead tagged `preview`, so a preview never settles a production lead and production never
  retries a preview's lead into a real inbox.

Home Platform's pixel was already production only (`lib/home-platform.ts`). Off Vercel
(`next dev`, `next start` on a laptop) `VERCEL_ENV` is unset and the keys decide, as before.
`/api/health` shows `deployment` and, on a preview, what it holds back.

## Scheduled jobs and alerts

Every cron in `vercel.json` is a route wrapped in `monitoredCron` (`lib/ops/cron.ts`); a unit test
fails if one isn't. A call with a job secret (`CRON_SECRET`, `ENCORE_COLLECT_SECRET`,
`SEARCH_REINDEX_SECRET`) is a run, and every run:

1. writes one log line, `[cron] {"job":"encore-check","outcome":"ok","http":200,"ms":…}`, at error
   level when it didn't go well;
2. is kept in `ops_runs` (migration 0016) with its outcome (`ok`, `held`, `partial`, `failed`), the
   HTTP status and a short summary;
3. when it failed, sends an alert (`lib/ops/alert.ts`): an email to `LEAD_ALERT_EMAIL` (falling back
   to `TEAM_NOTIFY_EMAIL`) through Resend, an `[ops-alert]` log line, and a Sentry issue when
   `NEXT_PUBLIC_SENTRY_DSN` is set. A run where only some parts failed (an Encore venue's page, a
   search source; HTTP 207) is emailed once the same part fails on two runs in a row. A held
   newsletter hand-off (422) isn't a failure: the team email already says why. Each problem is
   emailed once, then weekly while it lasts; a good run clears it, so a relapse is emailed again.

`/api/cron/ops-check` runs daily at 07:53 UTC and emails what fails without a sound: a job whose
last run is older than its schedule allows (a daily job after 26 hours, a weekly one after 7 days
and 2 hours, a monthly one after 31 days and 2 hours), or that never ran; the nightly
`retention_purge()` not having run (it writes its own `ops_runs` row; the email includes pg_cron's
error when there is one); the database not answering; a newsletter send that has stopped, or that
won't reach everyone before it expires at the daily cap. With a Sentry DSN, the ops check is also
the one Sentry Crons monitor (`site-crons`): if the check itself stops, Sentry says so. Sentry's free
plan includes one cron monitor and charges for more, so the jobs don't each get one
(`monitorEveryJob` in `lib/ops/jobs.ts` turns that on once the plan allows).

`GET /api/health?deep=1` (the health secret) shows the same picture: the database ping, each job's
last run and state (`ok`, `held`, `partial`, `failed`, `stale`, `never`, `waiting` before the first
run), the purge, the newsletter sends against the cap (`newsletterSends`: confirmed subscribers per
list, how many one issue can reach, each open send's pending count and shortfall), the Encore review
queue and today's Google Places calls. Counts and times only.

To run a job by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/encore/check`
(Encore's routes and the reindex also take their own secrets). The run is logged and kept like a
scheduled one. Before migration 0016 is applied everything above still runs except the record:
one log line names the file, and alerts go out on every failure instead of once a week.

## Personal data retention

`lib/db/migrations/0009_retention.sql` installs `public.retention_purge()` and a pg_cron job
(`retention-purge`, 07:17 UTC daily). Home Platform is the CRM, so the site database applies one
rule to everyone: `lead_deliveries` after 90 days; on `leads`, names, message, address, source and
payload cleared after 2 years (email, phone and the consent proof stay), rows deleted after 5;
on `contacts`, names, source and UTM cleared after 2 years without contact, rows deleted after 5
unless the person unsubscribed or asked not to be called (then email, phone and those flags stay
for good); `events` payloads cleared after 2 years and rows removed after 5, except unsubscribe
entries. Five years covers the 4-year window for TCPA claims. IP addresses are never stored.
Questionnaire answers are deleted by hand once the site copy is final. The privacy page states
the same periods; change both together. Check runs with
`select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'retention-purge') order by start_time desc limit 5;`.

`0016_ops_and_retention.sql` replaces the function with one that keeps every rule above and adds the
newsletter tables: a sign-up never confirmed is deleted 30 days after it was asked for (the confirm
link lasts 7), with the record of its confirmation email; a confirmed subscription with no email
sent to it and no change for 5 years is deleted; an unsubscribed one stays, as the do-not-email
record the privacy page promises; `newsletter_deliveries` (who was sent which email) go after 2
years. It also clears `ops_runs` and `ops_alerts` after 180 days, and writes each run's counts to
`ops_runs`, so `/api/cron/ops-check` emails when a night is missed.

**Erasing one person.** For a request under the privacy page's "To see, correct or delete …":

```bash
DATABASE_URL="<pooler URL>" npx tsx scripts/forget.ts --email jane@example.com --phone "(941) 555-0100"
DATABASE_URL="<pooler URL>" npx tsx scripts/forget.ts --email jane@example.com --phone "(941) 555-0100" --confirm
```

The first is a dry run that changes nothing and prints what it found; the second does it in one
transaction: their leads (with `lead_deliveries` and anything else that hangs off a lead), their
`contacts` rows (with their events), their newsletter subscriptions and the record of every
newsletter email sent to them. Where someone referred them, their name, email, phone and the note
about them are scrubbed from the referrer's lead and event, and the referrer's own record stays. A
phone matches on its last ten digits however it was typed. One row goes into `erasures` with the
date, the counts and a SHA-256 of the address and number (never the address), and the receipt
lists what's held elsewhere and has to be deleted by hand: the contact in Home Platform, the Zap's
task history in Zapier, the "New lead" emails in the team's inboxes. The site keeps no contact list
at Resend. An erasure also removes a do-not-contact flag, which is what the person asked for; a new
sign-up later starts over with double opt-in.
