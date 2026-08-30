# Handoff: JJ Premier Group brand system

## Overview

A complete visual identity and collateral system for **JJ Premier Group** — a Coldwell Banker–affiliated real estate team (Joelyn Nauman and Jessica Garza) working Lakewood Ranch, Sarasota, Bradenton and Tampa. The system covers the wordmark, color, type, printed collateral (business cards, property and event signage), a website design, and social profile/content templates.

**The immediate task most likely wanted: deploy this as a static site.** See `DEPLOY.md` at the project root — the project is already plain HTML with relative paths and needs no build step. Netlify Drop or GitHub Pages will host it as-is.

## About the design files

The `.dc.html` files in this bundle are **design references created in HTML** — high-fidelity prototypes showing intended look and specification, not production code to lift directly. Two distinct jobs could be asked of them:

1. **Host them as a reference site** (most likely) — no recreation needed, just deploy. `DEPLOY.md` covers it.
2. **Build the real product** (the website in document 05) — in that case recreate the design in the target codebase's environment using its established patterns, or pick an appropriate framework if none exists. Do not ship the prototype HTML as the product.

The files load a small runtime (`support.js`) and render inline-styled markup. There is no CSS framework, no npm dependency, and no bundler.

## Fidelity

**High-fidelity.** Final colors, type, spacing, and measures. Every value below is specified, not approximate. Contrast ratios in the documents were computed, not estimated. Where something is a placeholder it is labelled as one in an amber-ruled callout inside the file.

## Documents

| # | File | Contents |
| --- | --- | --- |
| — | `index.html` | Site entry, links all seven |
| 01 | `JJ Premier Group Brand Style.dc.html` | **The source of truth.** Foundation, wordmark, Coldwell Banker co-brand + CB palette, four color ramps, typography, space & elements, two registers, in-use, kit index |
| 02 | `JJ Premier Group Business Cards.dc.html` | 15 card fronts + backs, 3.5 × 2 in and 2 × 3.5 in |
| 03 | `JJ Premier Group Property Signage.dc.html` | Listing panels, riders, open-house directionals, A-frames, post assembly |
| 04 | `JJ Premier Group Event Signage.dc.html` | Retractable banners, easels, table pieces, name badges |
| 05 | `JJ Premier Group Web Design.dc.html` | Desktop homepage, three mobile screens (390 × 844), interface rules |
| 06 | `JJ Premier Group Social Profiles.dc.html` | Avatars with size ladder, X header, Facebook cover, YouTube channel art, IG + TikTok profiles |
| 07 | `JJ Premier Group Social Content.dc.html` | Quote posts, promotions, Suncoast culture calendar, 9:16 stories |
| — | `JJ Premier Group Brand Style-print.dc.html` | Print copy of 01, paginated for PDF export |
| — | `JJ Premier Group Brand Style v1.dc.html` | Superseded first version, kept for reference |

## The identity

### Wordmark — "the waterline"

`JJ` set in **Contralto**, tracking +120, with a **1px Harbor 500 hairline crossing the mark at 62% of cap height**, knocked out around the letters by a ground-colored box with horizontal padding of 0.28 × cap height. `PREMIER GROUP` sits below at 26% of the JJ cap height, tracking +440. Gap between them: 0.21 × cap height.

The waterline is the brand's only graphic device and is reused as a section rule, card divider and footer edge. Nothing else ever crosses it.

Five lockups, all carrying `PREMIER GROUP` in full:
- **A · Waterline** (primary) — stacked, crossed
- **B · Seal** — JJ + rule + name inside a 1px circle; avatars, stamps, title cards
- **C · One-line** — `JJ · PREMIER GROUP` on one baseline with a 5px Harbor square; nav bars, running heads
- **D · Plate** — framed in 2px Deep Harbor; covers, yard signs
- **E · Upright** — JJ, vertical hairline, PREMIER / GROUP stacked; narrow vertical slots

**Clearspace** = the cap height of JJ on all four sides. **Size grades:** hero 72px+ (A), header 40px (A), running head 22px (C), favicon 16px (JJ alone — the only case the name is dropped).

**Never:** tighten the tracking to fill a line; reset in the body sans; Sky as a field or Linen as ink; skew/stretch/outline; recolour or thicken the waterline.

### Coldwell Banker co-brand

- **Equal or larger measure.** The CB wordmark runs at 1.0×–1.2× the JJ lockup width. Never narrower.
- **CB Blue `#012169` is the preferred ink** on any light ground; Deep Harbor `#1E3442` is the one-ink substitute; white on dark grounds. Never Sky 300, never Sand.
- **No wording accompanies the mark** — no "affiliated with" line anywhere.
- Minimum 200px wide; below that the mark comes off the piece entirely rather than shrinking.
- Sits outside JJ's clearspace, behind its own hairline.
- Assets: `assets/coldwell-banker-horz-{cbblue,navy,white,cream,celestial,piano}.svg` (viewBox aspect 7.303:1).

## Design tokens

### Color — four locked base colors, each grown into a ramp

> **The key finding:** all four base colors are Coldwell Banker colors. Harbor is CB **Slate**, Sky is CB **Carolina**, Linen is CB **Cement**, Graphite is CB **Cool Gray**. The palette is not a riff on the franchise palette — it *is* the franchise's tertiary range promoted to lead roles. Deep Harbor `#1E3442` is the only structural color added, deliberately darker and warmer than CB Blue so the two blues never read as a failed match. **Ocean `#00B4BD` and Celestial Blue `#418FDE` stay with Coldwell Banker** — adopting them would collapse the distinction.

**Harbor** (base 500, locked)
`50 #F2F6F9` · `100 #E1EAF0` · `200 #C3D5E0` · `300 #9EBCCC` · `400 #7BA1B6` · **`500 #5C86A0`** · `600 #4C728A` · `700 #3F5F73` · `800 #35566B` · **`900 #1E3442` (Deep Harbor)** · `950 #142530`

**Sky** (base 300, locked)
`50 #F1FAFC` · `100 #DEF3F8` · **`200 #C7E7EF` (Mist)** · **`300 #89D4E3`** · `400 #63C0D3` · `500 #44A6BB` · `600 #35899C` · `700 #2C6E7E` · `800 #245764` · `900 #1C444E` · no 950

**Linen** (base 200, locked)
**`50 #FAF8F5` (Paper)** · `100 #F3EEE6` · **`200 #E6DDD1`** · **`300 #D2C6B4` (Sand)** · `400 #BCAD96` · `500 #A3927A` · `600 #877764` · `700 #6B5D4E` · `800 #4E443A` · `900 #332D26` · no 950

**Graphite** (base 500, locked)
`50 #F6F6F7` · `100 #ECECED` · `200 #D8D9DA` · `300 #BCBEC0` · `400 #90949A` · **`500 #63666A`** · `600 #53565A` · `700 #44464A` · `800 #33353A` · **`900 #2B2D30` (Ink)** · `950 #1A1C1F`

**Semantic** — muted on purpose; a failed inspection should not look like a browser error.
`success #3D7A63 / fill #E6EFEB` · `warning #96702A / fill #F4EBD9` · `error #A6483C / fill #F6E5E1` · `info #4C728A / fill #E1EAF0`

**Listing status** — exactly one tag per listing.
Coming soon `Linen 200 / Deep Harbor` · New listing `Mist / Deep Harbor` · Just reduced `Sand / #46402F` · Under contract `Deep Harbor / Sky 300` (the only filled dark tag) · Sold `1px Linen 400 outline / Linen 700` · Off market `1px Harbor 200 outline / Harbor 700`

**Surface balance:** 56% Paper · 18% Linen · 12% Deep Harbor · 8% Harbor · 6% Sky. Sky's 6% is a ceiling, not a target.

**Contrast anchors (computed):**

| Pair | Ratio | |
| --- | --- | --- |
| Ink on Paper | 12.6 : 1 | AAA |
| Linen on Deep Harbor | 9.5 : 1 | AAA |
| Deep Harbor on Linen | 9.5 : 1 | AAA |
| Deep Harbor on Sky 300 | 7.6 : 1 | AAA |
| White on Harbor 800 | 7.7 : 1 | AAA |
| White on Sky 700 | 5.7 : 1 | AA |
| Harbor 700 on Paper (links) | 6.2 : 1 | AA |
| Graphite on Paper | 5.4 : 1 | AA |
| Linen on Ink 900 | 10.3 : 1 | AAA |
| **Harbor 500 on Paper** | 3.6 : 1 | **body text FAILS** |
| **Linen on Harbor 500** | 2.9 : 1 | **BANNED** |
| **White on Sky 300** | 1.7 : 1 | **BANNED** |

Consequence: **Harbor 500 is a structural color, not a text color and not a button ground.** Links use Harbor 700; buttons use Harbor 900.

### Typography

Four voices. Contralto and IvyPresto are licensed desktop fonts — specified but **not embedded**; the files list them first in each stack with Google Fonts stand-ins behind.

| Role | Face | Fallback in files | Usage |
| --- | --- | --- | --- |
| Wordmark | **Contralto** | Cormorant Garamond 500 | Wordmark only. Tracking +120 to +440, never below 9px. Never a headline, never body, never mid-sentence. |
| Display | **IvyPresto Headline Thin** | Bodoni Moda | Headlines, pull quotes. **Semibold 600 is the floor — 400 is retired from headline use.** 700 for display. Tracking −12 to 0, leading 1.12–1.24. |
| Body / UI | **Jost** | — | 300 / 400 / 500 / 600, leading 1.6–1.75. Light 300 is the default paragraph weight. |
| Record | **IBM Plex Mono** | — | 400 / 500, tracking +60, tabular. Every number that must be trusted: prices, SF, dates, DOM, license numbers, disclosures. |

**Scale:** Display 72/76 IvyPresto 700 −18 · H1 48/55 IvyPresto 600 −12 · H2 32/38 IvyPresto 600 −6 · H3 21/28 Jost 500 · Eyebrow 12 Jost 600 +180 uppercase · Body 17/28 Jost 300 · Record 13/20 Plex Mono +60. Reading measure caps at 660px.

### Space, line and shape

**8px scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 96. Container 1440 (web: 1248 max, 12 columns, 32 gutter). Section 112 vertical / 72 column gap. Card padding 32 / 48.

**Four line weights only:** 1px Harbor 100 (card borders, dividers) · 1px Harbor 500 (the waterline — one per surface) · 2px Deep Harbor (section openers, framed plates) · 6px Sky bar (accent, max 120px long).

**Radius 0 everywhere. No shadows — elevation is a border.** The monogram circle is the only exception. Hit targets 48px minimum.

**Motion:** 120ms `cubic-bezier(0.16,1,0.3,1)`, state changes only. Primary button Harbor 900 → 800. Cards darken the border. Never scale, never shadow, never bounce.

## Interaction & behaviour (document 05)

- **Navy is furniture** — header, footer, and one full-screen mobile overlay. Everything between is Paper or white. A navy band mid-page is the tell that the system has been abandoned.
- **Sky 300 is the focus ring** — on screen it earns the active nav underline and the focused field (2px). It never becomes a button on a light ground.
- **One waterline per screen** — footer on desktop, contact overlay on mobile. The nav uses the one-line mark, which carries no rule.
- Fields are bottom-ruled only: 1px Graphite 400 at rest, 2px Harbor 700 focused. 48px tall.
- Breakpoints 1248 / 1024 / 768 / 390.

## Two registers

One identity, two temperatures — the same mark, type and corners, differing only in lead color and copy length:

- **Linen-led (first-time buyers)** — Linen 200 ground, Sand accent, 2–4 sentences, Jost 300.
- **Harbor-led (luxury)** — Paper ground, Harbor + Mist accents, 1–2 sentences.

## Voice

Composed, expert, coastal. Specificity is the proof — real numbers, real streets, real timelines, never vague reassurance. Tagline is **"Every move, expertly guided."** — sentence case, always the period, IvyPresto Headline Thin Italic 600, tracking 0. One line in lockups, plates and footers; square social crops may break it **once, after "move,"**; never all caps, never a mid-clause break, never on Sky.

## Assets

| Path | What |
| --- | --- |
| `assets/coldwell-banker-horz-cbblue.svg` | CB mark in CB Blue `#012169` — preferred on light |
| `assets/coldwell-banker-horz-navy.svg` | Deep Harbor one-ink substitute |
| `assets/coldwell-banker-horz-white.svg` | For dark grounds |
| `assets/coldwell-banker-horz-cream.svg` | Linen variant |
| `assets/coldwell-banker-horz-celestial.svg` | CB Celestial Blue — reference only |
| `assets/coldwell-banker-horz-piano.svg` | CB Piano Black — reference only |
| `assets/qr-{joelyn,jessica,team,tour}-navy.png` | **Real, scannable** QR codes — version 3, EC level L, hand-written encoder. 37-module grid |
| `assets/photos/joelyn-*.png` | Joelyn Nauman — the lighter, platinum blonde |
| `assets/photos/jessica-*.png` | Jessica Garza — the wavy, highlighted blonde |
| `assets/photos/duo-*.png` | Both, dark ground. Joelyn is on the **left** in both duo shots |

All photography is web-optimized to 1100px on the long edge. Full-resolution masters are in `uploads/` (3–16MB each) and are not required to host or build — they are there for print work only.

The CB wordmark SVG was supplied by the client and recoloured by setting `fill` on the root `<svg>` (its paths carry `class="cls-1"` with no fill rule, so they inherit). The JJ mark is **live type**, not an asset — there is no JJ logo file.

**QR rules:** dark modules on light, always. Never inverted — it decodes on some phone cameras and fails on most dedicated scanners, so no light-on-dark variant is kept on file. On any ground but Paper the code sits in a white panel with a 10px quiet zone. 0.72 in floor; below that print the URL instead.

## Open items before this goes public

1. **Jessica Garza:** Florida DBPR license `SL3658907`. **Joelyn Nauman: outstanding**, prints as `SL TBD` — do not go to press on anything carrying her name until confirmed. The format is Florida DBPR (`SL…`); an earlier draft used California `DRE` numbers, which was wrong for this market.
2. **Contact data is real and current:** Joelyn Nauman (309) 258-0225 / joelyn.nauman@cbrealty.com · Jessica Garza (941) 306-8699 / jessica.garza@cbrealty.com · jjpremiergroup.com. All four QR codes encode `jjpremiergroup.com` and scan.
4. **Coldwell Banker usage needs franchise sign-off** — permitted lockups, trademark symbols, minimum sizes and required placements are governed by the franchise agreement. Confirm against CB's brand center before printing or publishing.
5. **Signage regulations are local** — sign dimensions, setback and rider counts vary by municipality and HOA; brokerage identification requirements vary by state.
6. **Culture-post venues are real; show titles and dates are deliberately blank.** Confirm each against the venue's own calendar, and never imply a sponsorship the team doesn't have. Note: the Players Center's planned Waterside Place theatre **fell through** — do not reference it.
7. **Contralto / IvyPresto web licensing** — if licensed for web, self-host and add `@font-face`; the stacks already name them first.

## Material treatments

`JJ Premier Group Material Treatments.dc.html` documents the mark in physical substrates, with photography in `assets/materials/`.

| Treatment | Spec |
| --- | --- |
| Etched brass plaque | Satin brass 3mm, acid etch, paint fill #1E3442, 200mm sq, ring stroke 1.5mm |
| Sandblasted glass | 10mm low-iron, 25mm standoff, second surface |
| Powder-coated aluminum | 4mm ACM, RAL matched to #1E3442, Linen screen, Sky 300 rule 4mm |
| Blind deboss | 600gsm cotton uncoated, brass die, 0.9mm strike depth |
| Letterpress | Pantone 2166 C, rule box 1.5mm at 12mm inset |
| Bookcloth screenprint | Navy book linen, Linen ink, 12mm minimum cap height |
| Monument sign | Linen matte face, powder-coated steel surround, JJ cap 260mm min |
| Door vinyl | Matte cut, second surface, 1500mm from floor |

Production rules: one process per piece, matte always, the seal handles anything small or round or woven, and no gold in any form (satin brass is permitted as a substrate, gold foil and gold ink are not).

The seal always carries PREMIER GROUP under the rule. A bare JJ inside a ring is not approved artwork.

## Document set

Seventeen files, all static HTML with relative paths and no build step. `index.html` is the hub; every document carries the same wrapping navigation bar.

| Document | What it is |
| --- | --- |
| Brand Style | Wordmark construction, color system, type scale, CB co-brand |
| Brand Voice | Vocabulary, rewrites, per-channel word counts, compliance |
| Photography Direction | Briefing, three subjects, shot lists, file naming |
| Material Treatments | Brass, glass, deboss, cloth, environment, production rules |
| Business Cards | Fifteen fronts and backs, both agents |
| Property Signage | Yard panels, riders, arrows, A-frames |
| Event Signage | Welcome boards, easels, table tents, badges |
| Client Guides | Buyer and seller booklets, 16pp each |
| Market Letter | Quarterly one-pager, five fixed paragraphs |
| Listing Presentation | Eight-slide deck on deck-stage.js |
| Web Design | Desktop and mobile screens, interface rules |
| Social Profiles | Avatars and banners, five platforms |
| Social Content | Quotes, promotions, culture calendar |
| Email System | Signatures, designed sends, daily templates |
| Quick Reference | One page for any vendor |
| Agent Onboarding | Week one for a new agent |

## Typography correction

Display type is **IvyPresto Headline Thin**, not IvyPresto Display. Headline Thin has a near-uniform stroke and stays legible while reading delicate; Display is high-contrast with hairline thins that disappear at size. The web fallback is **Newsreader**, also low-contrast — do not substitute a Didone such as Bodoni Moda.

Display weights track size: 200 at 44px and above, 300 from 30 to 43px, 400 from 20 to 29px, 500 below that. Body text (Jost) never goes below 400.

## Image library

`JJ Premier Group Image Library.dc.html` documents 24 owned frames in `assets/library/`, in five families.

| Family | Files | Job |
| --- | --- | --- |
| Place | `place-*` (7) | Sells the region. Culture posts, letters, covers. |
| Interiors | `interior-*` (2), `arch-breeze-block` | Stands in for a listing before its own photography exists. |
| Moments | `moment-*` (4) | Sells the service. Hands and gestures, no identifiable faces. |
| Texture | `texture-quartz-sand` | Proves the palette came from somewhere real. |
| Illustration | `art-*` (9) | Carries recurring series without looking repeated. |

Selection rules: one family per surface (a photograph and an illustration on the same page read as two brands); illustration for anything that posts weekly; type only over a calm third of a frame, otherwise on a Deep Harbor panel beside it; never a recognizable property the team does not represent.

No identifiable face appears in the Moments family, which is deliberate — it avoids the model-release requirement entirely. Keep it that way, or get releases in writing.

## Screen map

| Screen | Built from |
| --- | --- |
| index.html | Hub. Seventeen document cards, grouped nav. |
| Brand Style | Wordmark, color, type, CB co-brand |
| Brand Voice | Vocabulary, rewrites, channel word counts, compliance |
| Photography Direction | Briefing, subjects, shot lists, naming |
| Image Library | assets/library/ (24 frames) |
| Material Treatments | assets/materials/ (19 treatments) |
| Business Cards | 15 layouts, assets/photos/, assets/qr-*.png |
| Property / Event Signage | Panels, riders, boards, badges |
| Client Guides | Buyer and seller booklets |
| Market Letter | Quarterly one-pager |
| Listing Presentation | deck-stage.js, 8 slides |
| Web Design | Desktop + 3 mobile screens |
| Social Profiles / Content | Avatars, banners, posts, culture calendar |
| Email System | Signatures + templates |
| Quick Reference / Agent Onboarding | Vendor sheet, week-one guide |

## Contrast

Text rank comes from size and weight, never from a lighter gray. Every body and label color clears 4.5:1 on its ground.

| Token | Hex | On | Ratio |
| --- | --- | --- | --- |
| Ink | `#2B2D30` | Paper | 13.1:1 |
| Body | `#3A3D42` | Paper | 9.8:1 |
| Caption primary | `#4E5157` | Paper | 7.4:1 |
| Caption secondary | `#63666A` | Paper | 5.4:1 |
| Nav link | `#B4CBD8` | Harbor 950 | 7.9:1 |
| Nav group label | `#7BA1B6` | Harbor 950 | 5.3:1 |

Do not use `#7A7E84` (3.85:1) or `#4A6B80` (2.77:1) for text at any size; both were removed for failing AA. Harbor `#5C86A0` reaches only 4.0:1 on Harbor 950, so it is a rule and border color, not a small-text color.
