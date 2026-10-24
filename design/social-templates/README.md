# Social templates, round four

Fourteen families, ten templates each, for the JJ Premier Group feed. Built the way the
Virtus v3 set was built: each family has one job from the social plan (reach, share,
save, comment, click, follow), and every template carries its line, a suggested caption
and what to check before it posts. The visual registers are round three's.

## Files

| File | What it is |
| --- | --- |
| `deck-a.mjs`, `deck-b.mjs` | The copy deck: families 01–07 and 08–14. Every line, caption, photo and register. This is where the writing lives. |
| `deck.mjs` | Merges the two and defines the families (name, job, register, thesis). |
| `render.mjs` | Draws every template as HTML and screenshots it with Chromium at 1080 px wide. |
| `styles.css` | The registers: Golden Hour, Quiet, Big Type, Coldwell Banker Blue, Gallery, Harbor Night, Cinema, Poster, Cut Paper, Edition, Elevation, Chart Room, plus the checklist, calendar, correction, this-or-that, interface, carousel, story and moment layouts. |
| `build-index.mjs` | Builds `out/index.html`, the review page, from the same deck. |
| `fonts/`, `fonts.css` | Google Fonts stand-ins for the licensed faces (Newsreader for IvyPresto, Cormorant Garamond for Contralto), fetched once so renders don't depend on the network. |
| `atlas-points.json` | Coordinates of the 2,038 Atlas neighborhoods with a lat/lng, for the chart maps. |
| `out/img/*.jpg` | The 140 rendered templates. |
| `out/html/*.html` | The same templates as editable HTML, one file each. |

## Rendering

```
node design/social-templates/render.mjs          # all 140
node design/social-templates/render.mjs 03 11-02 # a family, or ids that start with these
node design/social-templates/build-index.mjs     # the review page
```

Playwright and Chromium come from the machine, not the repo (`render.mjs` resolves them
through `require`). Photos are read from `public/images/library`, `public/images/encore-stock`,
`public/images/guides` and `public/images/photos`; marks from `design/brand-system/assets`.

## Rules every template keeps

- Team voice (“we”), never one agent's first person. No exclamation marks, no emoji,
  no superlatives, no “reach out”, no “stunning”.
- Fair housing: describe the property, never the people who might live in it.
- Every number carries its source and pull date. Tide figures are recomputed from
  `data/sales` (qualified home sales, Oct 2025 – Sep 2026); re-pull before posting.
- Every listing is invented, on a real neighborhood name, and says “Sample listing · for review”.
  Listing pieces carry the Equal Housing mark.
- “Coldwell Banker Realty” on every piece. The franchise logo only in the CB Blue register.
- Encore shows, venues and dates come from `lib/content/encore/encore-calendar.json`
  and are named properly. Check each at the venue the week it posts. Nothing is sold.
- Stories keep type clear of the top 250 and bottom 320 pixels. Stickers are drawn placeholders.
