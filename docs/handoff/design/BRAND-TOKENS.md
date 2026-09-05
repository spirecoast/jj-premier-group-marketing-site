# Brand tokens

**Filled 2026-09-05** from the JJ Premier Group brand system at
https://jj-premier-brand-system.vercel.app (source files in `design/brand-system/`),
and the website mockup `JJ Premier Group Website.dc.html` published in the same place.

The brand system remains the master. Any later revision there gets mirrored here
deliberately rather than re-derived. Values marked *(mockup)* come from the website
composition rather than the brand style document; they are recorded verbatim so the
built site matches the approved page.

## Where they live in the repo

1. `app/globals.css` — the Tailwind v4 `@theme` block is the single definition. Utilities
   like `bg-navy`, `text-linen-700`, `font-display`, `t-eyebrow` come from it.
   No hex value appears in a component file.
2. `styles/tokens.css` — `:root` custom properties Tailwind cannot express: the font stacks
   (licensed face first, Google stand-in second), gutter and section rhythm by breakpoint,
   header height, motion easings and durations.
3. `docs/handoff/architecture.html` — the client-facing document; token block at the top.

## Color

```
Color
  primary        #2E4A5C   navy (mockup) — hero ground, headline ink, primary button
  primary-dark   #1E3442   Deep Harbor / Harbor 900 — the only structural colour added to the CB range
  accent         #89D4E3   Sky 300 — focus ring, active nav underline, drawn rules. 6% ceiling.
  accent-ink     #2C6E7E   Sky 700 — teal fills (calendar subscribe, sold stat), focused field
  ink            #2B2D30   Graphite 900
  surface        #FAF8F5   Paper / Linen 50
  surface-alt    #E6DDD1   Linen 200 — footer, hero frame, marquee ground
  surface-warm   #F1E9DC   parchment (mockup) — "Who you are hiring" ground
  line           #E4DED2   hairline (mockup) — card borders, list dividers on Paper
  line-strong    #C4B69F   rule (mockup) — section rules on Linen
  body           #3A3D42   running text (mockup)
  body-muted     #4E5157   secondary running text (mockup)
  eyebrow        #7A5B1E   amber for 11px eyebrows. The mockup's #96702A measures 4.3:1 on Paper, under AA; this darker step of the same hue is 5.9:1. `--color-warning` keeps #96702A for fills.
  success        #3D7A63   fill #E6EFEB
  warning        #96702A   fill #F4EBD9
  danger         #A6483C   fill #F6E5E1
  info           #4C728A   fill #E1EAF0
  cb-blue        #012169   Coldwell Banker ink. Never used for JJ elements.

Ramps (brand style document, all locked)
  Harbor   50 #F2F6F9 · 100 #E1EAF0 · 200 #C3D5E0 · 300 #9EBCCC · 400 #7BA1B6 · 500 #5C86A0
           600 #4C728A · 700 #3F5F73 · 800 #35566B · 900 #1E3442 · 950 #142530
  Sky      50 #F1FAFC · 100 #DEF3F8 · 200 #C7E7EF (Mist) · 300 #89D4E3 · 400 #63C0D3 · 500 #44A6BB
           600 #35899C · 700 #2C6E7E · 800 #245764 · 900 #1C444E
  Linen    50 #FAF8F5 (Paper) · 100 #F3EEE6 · 200 #E6DDD1 · 300 #D2C6B4 (Sand) · 400 #BCAD96
           500 #A3927A · 600 #877764 · 700 #6B5D4E · 800 #4E443A · 900 #332D26
  Graphite 50 #F6F6F7 · 100 #ECECED · 200 #D8D9DA · 300 #BCBEC0 · 400 #90949A · 500 #63666A
           600 #53565A · 700 #44464A · 800 #33353A · 900 #2B2D30 (Ink) · 950 #1A1C1F

Rules
  Harbor 500 is structural only: 3.6:1 on Paper fails for text; 2.9:1 under Linen is banned as a button ground.
  Links use Harbor 700. Buttons use navy / Harbor 900, hover one step lighter (Harbor 800), 120 ms.
  White on Sky 300 is banned. Sky is never a button ground on a light surface.
  Listing status tags (exactly one per listing): Coming soon Linen 200/Deep Harbor · New Mist/Deep Harbor ·
  Just reduced Sand/#46402F · Under contract Deep Harbor/Sky 300 · Sold 1px Linen 400 outline/Linen 700 ·
  Off market 1px Harbor 200 outline/Harbor 700.
```

## Type

```
Type
  display family   IvyPresto Headline (licensed, not embedded) → Newsreader (Google, opsz 6–72) → Georgia, serif
  display weights  200 Thin (headlines on the website mockup), 300 (card titles, quotes), 400/500 (small titles)
                   Brand doc: Semibold 600 is the floor for print headlines; the website mockup sets Thin 200 and governs the site.
  wordmark family  Contralto (licensed) → Cormorant Garamond 600. Wordmark only, tracking +120 to +440, never below 9px.
  text family      Jost → Helvetica, Arial, sans-serif
  text weights     300 / 400 / 500 / 600 (400 running text on screen, 500 emphasis and data, 600 eyebrows and buttons)
  record family    IBM Plex Mono 400 / 500, tracking +60, tabular numerals — prices, SF, dates, DOM, MLS, licenses, disclosures

  scale (size / line height)
    hero      92 / 1.02   display 200, tracking −24  (fluid 44 → 92)          .t-hero
    display   60 / 1.04   display 200, tracking −20  (fluid 36 → 60)          .t-display
    h1        48 / 1.06   display 200, tracking −18  (fluid 32 → 48)          .t-h1
    h2        34 / 1.08   display 300, tracking −10  (fluid 26 → 34)          .t-h2
    h3        21 / 1.16   display 300                                         .t-h3
    h4        19 / 1.20   display 400                                         .t-h4
    quote     22 / 1.24   display 300 italic                                  .t-quote
    lead      19 / 1.6    Jost 500                                            .t-lead
    body      17 / 1.7    Jost 400, colour body, measure 660px                .t-body
    small     14 / 1.6    Jost 400                                            .t-small
    label     12 / 1.2    Jost 600, tracking +120, uppercase (buttons, links) .t-label
    eyebrow   11 / 1.4    Plex Mono 500, tracking +160, uppercase             .t-eyebrow
    record    13 / 1.55   Plex Mono 400, tracking +60                         .t-record
    stat      44 / 1      Plex Mono 500                                       .t-stat
  letter spacing on display   −0.024em hero · −0.02em display · −0.018em h1 · −0.01em h2
```

## Layout

```
Layout
  container max width     1440 (mockup canvas) — .container-site
  base spacing unit       8 (scale 4 8 12 16 24 32 48 72 96)
  gutter                  96 desktop (≥1024) · 48 tablet (≥768) · 24 phone
  section vertical rhythm 120 desktop · 96 tablet · 72 phone   (--section-y)
  column gap              80 (two-column compositions) · 20 (card grids)
  card padding            32 / 48 (print) · 20–26 on screen cards
  corner radius           control 0 · card 0 · image 0  (square corners; only the cameo and seal are round)
  border width            1px hairline at rest · 2px Deep Harbor when a plate holds weight · 6px Sky bar accent, max 120px
  buttons                 52px tall (48px minimum hit target), 26px horizontal padding
  inputs                  48px, underline style; focus thickens to 2px Sky 700
  header                  70px sticky; transparent over a photographic hero, solid navy/90 on scroll
  breakpoints             Tailwind defaults: 640 · 768 (grids 3→2) · 1024 (2→1, nav collapses below) · 1280
                          Design canvases: desktop 1200–1440, tablet 810, phone 390
  motion                  rise 0.9s · draw 1.1s · fade 1.4s · card image 1.1s scale 3.5% · rows slide 16px · hover colour 120ms
                          Easing cubic-bezier(.2,.7,.2,1). Nothing bounces, nothing parallaxes. Honours prefers-reduced-motion.
```

## Open items recorded here

- **Office street address** — not in the brand system. Rendered from `siteSettings.officeAddress`; the seed
  carries city and state only until the brokerage confirms the street (BUILD-PLAN Phase 0).
- **Joelyn Nauman's license number** — outstanding per Compliance §02. Rendered as "FL SL pending" until set.
- **Social links** — none specified; the footer hides the list until `siteSettings.socialLinks` has entries.
- **Licensed fonts** — IvyPresto Headline and Contralto are specified but not embedded. Once the webfont files are
  licensed, self-host them in `app/layout.tsx` with `next/font/local`; the CSS stacks already list them first.
