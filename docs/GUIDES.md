# Guides (`/guides`)

The long-form, data-rich guides. The first one is *Flood zones and elevation
certificates on the Suncoast*; the other seven Tide guides are to be rebuilt to the
same template. This note is the template.

The bar is the client's own guides from his financial firm: 20-odd pages, 4,700 to
6,900 words, a cover with a one-sentence promise, "How to use this guide", a
numbered contents, three questions the reader keeps coming back to, numbered
sections that each open with why they matter, figures labelled "Fig. 03" with a
title and a one-line reading instruction, a "Source:" line under every figure and
factual block, a call-out to the firm's tool where it helps, and a one-page
worksheet at the end. Ours stay web pages, free and ungated, with a print
stylesheet so they also read as a document.

## Where things live

| What | Where |
|---|---|
| A guide's content | `lib/guides/<slug>.ts`, exporting one `Guide` object |
| The types | `lib/guides/types.ts` |
| The registry, counts, text extraction | `lib/guides/index.ts` (`GUIDES`, `getGuide`, `guideStrings`, `guideWordCount`, `guideReadingMinutes`, `guideSources`, `guideFigures`, `TOOLS`) |
| The slugs the old `/blog` paths redirect from | `lib/guides/slugs.ts` (`REBUILT_GUIDE_SLUGS`, `guideHref`); imported by `next.config.ts` for the 308s and by every card that links a guide |
| The page | `app/(site)/guides/[slug]/page.tsx`, its OG image beside it, the index at `app/(site)/guides/page.tsx` |
| Components | `components/guides/` — `cover`, `contents` (client; sticky with the active section highlighted, a folded list on phones), `section-header`, `blocks` (paragraph, definition, subhead, pull quote, table, callout), `figure` (the frame) and `figures/*` (one component per figure kind), `one-page`, `sources`, `guide-card` |
| Styles | `app/globals.css`, the "Guides" block: `.guide-text`, `.guide-drop`, `.guide-ghost`, the `.series-N` fills, and the `@media print` rules scoped to `#guide-article` |
| Checks | `npx tsx scripts/check-guides.ts` (Fair Housing and the places-not-people rules over every string, seed guides and rebuilt guides alike), `lib/guides/guides.test.ts` (structure: every section has a lead and sources, every figure has a source line, 5 to 7 figures, length, the house rules) |
| Screenshots and the print PDF | `docs/screenshots/guides-v2/`; the PDF is produced with Playwright's `page.pdf()` under `media: "print"` |

## The data shape

```ts
const GUIDE: Guide = {
  slug, title,
  promise,            // one sentence under the title on the cover
  howToUse: [...],    // two or three short paragraphs
  questions: [q1, q2, q3],
  cover: img("library/…", "alt", "50% 55%"),
  author: { name, slug }, publishedAt, updatedAt,
  checked: "checked October 1, 2026",   // printed on every source line
  sections: [{ id, title, lead, blocks: [...], sources: [...] }],
  onOnePage: { title, reading, rows: [{ label, value }] },
  next: { eyebrow, title, body, cta, tool },
};
```

Block kinds, in `lib/guides/types.ts`:

| Kind | What it is | Source line |
|---|---|---|
| `paragraph` | `segs: Inline[]` — strings and `{ text, href }` links. The first paragraph in a section gets the drop cap. | optional `source`, shown in print |
| `definition` | `term` and a plain `definition`; use it the first time a term appears | optional |
| `subhead` | an h3 inside a section | — |
| `pull-quote` | a sentence that appears in the guide's own text, set large on navy | — |
| `table` | `title`, `columns`, `rows` | required |
| `callout` | a pointer at one of the site's tools: `tool` is one of `atlas`, `atlas-match`, `relocate`, `sold`, `home-value`, `net-proceeds`, `contact` (paths in `TOOLS`) | — |
| `figure` | `eyebrow`, `title`, `reading`, `figure` (one of the kinds below), optional `note` and `tool` | required |

Figure kinds (`FigureSpec.type`) and the component that draws each:

| Type | Draws | Use it for |
|---|---|---|
| `bar` | horizontal bars to one scale, a legend when two or more series, a table twin | a few numbers that are compared (days, feet, counts) |
| `comparison` | a table of options against the points that differ, with ✓ / ✕ marks | "leave it or move it" choices |
| `matrix` | things × questions with filled, half and empty marks | "what each document tells you" |
| `timeline` | lanes on one axis with markers (a contract, a closing), hatched for a wait | a purchase, a season, a statutory clock |
| `worked-example` | an illustrative house against its base flood elevation with the certificate's item codes beside it (`example: "elevation-certificate"`) | reading a form; add a variant per form |
| `map-callout` | one card per portal or office with its link | where to look something up |
| `checklist` | a worksheet with boxes and the detail under each line | "before you write an offer" |
| `ladder` | a stair of steps, each read three ways (lender, insurer, building code) | ordered categories |

Series colours are assigned in fixed order and never cycled: slot 0 Harbor 800, slot 1
Coral (`--color-coral`, the one saturated accent added for the guides), slot 2 Sky 600.
Marks carry the colour; text never does. Every drawn figure ships with a real `<table>`
under "Read this figure as a table"; the matrix, comparison and ladder are tables
already. Bars are 22px thick with a square baseline, gridlines are solid hairlines, a
hatch is the only texture and it means "not yet". The brand palette is muted by
design, so the dataviz validator's chroma-floor check is waived for it; the other five
checks (lightness band, CVD separation, normal-vision floor, contrast, legend present)
pass for the three slots on white, and every mark is also labelled in text.

## The sourcing rule

Every figure, every table and every factual paragraph names the page it came from.
The rules:

1. Open the page the day you write. Put the day in `checked` and reuse the `Source`
   objects (named once, `S.zones`, `S.ecForm`, …) across the guide.
2. Never state a fact you didn't read on the page you cite. If the page is a PDF,
   extract its text and quote from that. If a page would not load, add it as a
   source with no `href` and a `note` saying so; the foot prints the note.
3. Hypothetical numbers (a worked example, the days on a timeline) are labelled
   "illustrative" on the figure's note and in its source line, and the test checks for
   the word on every worked example.
4. No premium dollar figures. No figures about people. Places and rules only.
5. Section `sources` lists the pages the section drew on; the foot ("Where this comes
   from") is built from them in first-use order, then the figure sources one per figure.

## The voice

Plain, first person plural, contractions. Define every term the first time it
appears (use a `definition` block or a clause). No superlatives, no exclamation marks,
no stacked comma fragments ("phrase, phrase, phrase." is banned; write a sentence
with a verb), never "lands" as a verb, no flippant asides, nothing invented about
Joelyn or Jessica. Each section's `lead` is the "why this matters" in one or two
sentences. Byline: number first, decision at the end.

Fair Housing: places and rules, never people. No demographics, income, safety or
crime, schools, age, familial status. No license numbers. `scripts/check-guides.ts`
and the unit test run the brokerage list plus these house rules over every string a
guide renders, figures and source labels included.

## Adding a guide

1. Write `lib/guides/<slug>.ts` and add it to `GUIDES` in `lib/guides/index.ts` and to
   `REBUILT_GUIDE_SLUGS` in `lib/guides/slugs.ts`. The old `/blog/<slug>` path redirects
   with a 308 from `next.config.ts`, the blog index and the hubs point their cards at
   `/guides/<slug>` through `guideHref`, and the sitemap lists the new path.
2. Keep the seed `Post` in `lib/content/seed/*` for now: the hubs and the blog index
   still read its cover and excerpt for the card.
3. Run `npx tsx scripts/check-guides.ts`, `npm run test:unit`, `npx tsc --noEmit`,
   `npm run check:copy`, `npm run build`.
4. Screenshot at 1440 and 390 into `docs/screenshots/guides-v2/` and print to PDF so
   the client can compare it with his samples.
5. Cover and figure photographs: library photos for now; list Adobe Stock search
   strings for the final images in the scratchpad `IMAGES.md` and let the client pick.
