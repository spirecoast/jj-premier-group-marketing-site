# Guides (`/guides`)

The guides are free, ungated web pages with a print stylesheet so they also read as
a document. The first one rebuilt to this template is *Flood zones and flood
insurance, explained*. Every other guide is to be rebuilt the same way, and the
client wants one of these for every topic a buyer or seller runs into. This note is
the template.

## What the client asked for

He compared the first long version with the guides from his financial firm (Virtus)
and called it "nonsensical" and "too clever". The brief now:

- **Simple.** Write at about a third-grade reading level. Explain each thing well and
  no more than that. No cuteness, no clever titles, no jargon left unexplained.
- **Story and pictures.** Teach with a small story ("picture two houses on the same
  street") and one clear figure per section, the way the Virtus pages do.
- **Shorter.** The flood guide went from about 5,500 words to about 1,600 words of
  prose. Aim for 1,200 to 2,000 words of prose and 8 to 12 minutes of reading.
- **Premium.** A calm, dark, typographic cover. Short numbered sections on navy
  bands. Generous type. A worksheet at the end. Sources gathered at the foot, not
  scattered through the text.

## Where things live

| What | Where |
|---|---|
| A guide's content | `lib/guides/<slug>.ts`, exporting one `Guide` object |
| The types | `lib/guides/types.ts` |
| The registry, counts, text extraction | `lib/guides/index.ts` (`GUIDES`, `getGuide`, `guideStrings`, `guideProse`, `guideWordCount`, `guideReadingMinutes`, `guideSources`, `guideFigures`, `TOOLS`) |
| The reading-level measure | `lib/guides/readability.ts` (Flesch-Kincaid grade, sentences, syllables) |
| The slugs the old `/blog` paths redirect from | `lib/guides/slugs.ts` (`REBUILT_GUIDE_SLUGS`, `guideHref`); imported by `next.config.ts` for the 308s and by every card that links a guide |
| The page | `app/(site)/guides/[slug]/page.tsx`, its OG image beside it, the index at `app/(site)/guides/page.tsx` |
| Components | `components/guides/`: `cover` (the typographic cover with contour lines), `contents` (sticky, with the active section highlighted, folded on phones), `section-header`, `blocks`, `figure` (the frame) and `figures/*` (one component per figure kind), `one-page`, `sources`, `guide-card` |
| Styles | `app/globals.css`, the "Guides" block: `.guide-cover-ground`, `.guide-text`, `.guide-drop`, `.guide-ghost`, the `.series-N` fills, and the `@media print` rules scoped to `#guide-article` |
| Checks | `npx tsx scripts/check-guides.ts` (Fair Housing and the places-not-people rules over every string, plus the reading level of each rebuilt guide) and `lib/guides/guides.test.ts` (structure, length, reading level, no links in paragraphs, the house rules) |

## The voice

- Short sentences, about ten words on average. No sentence over 24 words.
- Everyday words. When an official term has to appear (base flood elevation,
  elevation certificate), say what it is in plain words the first time.
- Second person, with contractions: "you", "you'll", "doesn't". "We" for Joelyn and
  Jessica only where they'd actually do the thing.
- One idea per paragraph, two to four sentences each.
- Story first, rule second: picture the place or the house, then explain.
- No superlatives, no exclamation marks, no stacked comma fragments, never "lands" as a
  verb, no flippant asides, nothing invented about Joelyn or Jessica.
- Plain titles that say what the section is: "How to find the zone for a house", not
  "Look up the parcel, not the street".

The checks hold the line: the prose (promise, how to use, section leads, paragraphs,
definitions and figure notes) must measure a Flesch-Kincaid grade of 5 or lower, and
no sentence may run past 24 words. The flood guide measures 3.2, with about 10 words a
sentence. Official terms cost syllables you can't avoid, so keep the sentences around
them short.

Fair Housing: places and rules, never people. No demographics, income, safety or
crime, schools, age or familial status. No license numbers. No premium dollar figures.

## The shape

```ts
const GUIDE: Guide = {
  slug, title,
  promise,            // one sentence under the title on the cover
  howToUse: [...],    // two short paragraphs
  questions: [q1, q2, q3],
  cover: img("library/…", "alt", "50% 55%"),   // used for the card and the share image only
  author: { name, slug }, publishedAt, updatedAt,
  checked: "checked October 1, 2026",   // printed on every source line
  sections: [{ id, title, lead, blocks: [...], sources: [...] }],
  onOnePage: { title, reading, rows: [{ label, value }] },
  next: { eyebrow, title, body, cta, tool },
};
```

Each section: a plain title, a one- or two-sentence `lead` that says why it matters,
a few short paragraphs, then one figure. Subheads are fine for a list of zones or
steps.

Block kinds, in `lib/guides/types.ts`:

| Kind | What it is | Source line |
|---|---|---|
| `paragraph` | plain strings only, with no links (the test checks). The section's first block gets the drop cap if it's a paragraph that starts with an ordinary word. | optional `source`, printed in the PDF |
| `definition` | `term` and a plain `definition`; use it for the one term a section turns on | optional |
| `subhead` | an h3 inside a section | — |
| `table` | `title`, `columns`, `rows` | required |
| `callout` | a pointer at one of the site's tools (`TOOLS`) | — |
| `figure` | `eyebrow`, `title`, `reading`, `figure` (a kind below), optional `note` and `tool` | required |

Figure kinds for the plain guides (the older table-like kinds still exist for later
use: `comparison`, `matrix`, `timeline`, `worked-example`, `ladder`):

| Type | Draws | Use it for |
|---|---|---|
| `coast` | the coast from the side, Gulf to higher ground, with the big flood as a dashed line and a house in each zone | what a zone is |
| `zone-cards` | one card per zone: the letter set large, what it means, the lender's rule, the building rule | the three zones |
| `two-houses` | two houses on one street against one flood line, to one scale | why the floor height matters (heights are made up and the note says so) |
| `decides` | two panels: what one thing decides, and what another decides | "the zone decides this, the house decides that" |
| `questions` | numbered questions set the way a form asks them, with yes and no boxes | a form's questions in plain words |
| `bar` | horizontal bars to one scale | a few numbers compared (days, feet) |
| `map-callout` | one card per website or office with its link | where to look something up |
| `checklist` | a worksheet with boxes and a line of detail under each | "before you make an offer" |
| `villages` | one block per kind of district, each row a district with its villages set as chips | which district a village is in |
| `parts` | a building from the front with a numbered mark on each part, the parts listed as text under it | the parts a reserve study must cover |
| `sketch` | a fixed drawing with numbered marks on it (`scene`: `islands` from above, the road `corridor` from the Skyway to the islands, a `house` from the side, a `seawall` in section); the words for each mark are set under it as text | which government runs each island, the parts of a house an inspection covers, the parts of a seawall |
| `year` | one calendar year as a strip of twelve months, with shaded spans and numbered marks; positions are months from January 1 (0 to 12) | the hurricane season, the four dates in the tax year |
| `tiers` | a home's value as a column, lowest at the bottom, cut into exempt and taxed bands, each with its words beside it | the two parts of the homestead exemption |
| `house-points` | a house from the side with numbered points on the parts a wind inspection checks | the wind mitigation report |

Words never sit inside a drawing except short labels like zone letters; the line
labels and meanings are set as text under it so they stay readable on a phone. Every
drawn figure carries a real `<table>` under "Read this figure as a table". Series
colours are fixed: Harbor 800, Coral, Sky 600; zones use Coral (VE), Sky 600 (AE) and
the success green (X).

## The cover

Dark harbor with a fine grid and faint contour lines, set the way the Virtus covers
are, with the mono "Guide · 8 sections · 11 min read" line, the title, the promise and
the byline. No photograph on the cover itself: a cover photo needs the client's
approval, and a 1200px library frame stretched to full width looked grainy. The
`cover` image still feeds the guide's card and share image, where it's small. When
the client approves a photo for a guide, it can return to the cover at 2400px or wider.

## The sourcing rule

Every figure, every table and every fact names the page it came from, but not inside
the sentence: sources go on the figure's source line, in the section's `sources`
list, and in "Where this comes from" at the foot.

1. Open the page the day you write. Put the day in `checked` and reuse the `Source`
   objects (named once, `S.zones`, `S.ecForm`, …) across the guide.
2. Never state a fact you didn't read on the page you cite. If a page would not load,
   add it as a source with no `href` and a `note` saying so.
3. Made-up numbers (the two houses, a sample timeline) are labelled "made up" or
   "illustrative" in the figure's note and source line; the test checks.
4. Arithmetic is shown: the "1 in 4 over 30 years" paragraph carries its working as a
   source note.
5. A plain-language version of a legal text says so ("The real form uses the exact
   words in Florida law").

## Adding a guide

1. Write `lib/guides/<slug>.ts` and add it to `GUIDES` in `lib/guides/index.ts` and to
   `REBUILT_GUIDE_SLUGS` in `lib/guides/slugs.ts`. The old `/blog/<slug>` path redirects
   with a 308, cards point at `/guides/<slug>` through `guideHref`, and the sitemap
   lists the new path.
2. Update the seed `Post` in `lib/content/seed/*` so its title and excerpt match the
   guide's title and promise; the hubs and the blog index still read it for the card.
3. Run `npx tsx scripts/check-guides.ts`, `npm run test:unit`, `npx tsc --noEmit`,
   `npm run check:copy` and `npm run build`.
4. Screenshot at 1440 and 390 and read it on the phone width. If a figure's text wraps
   badly at 390, fix the figure.
