# Putting this online

The project is already a static site — plain HTML with relative asset paths. There is no build step, no dependencies to install, and no server code. Uploading the folder is the whole job.

`index.html` is the entry point and links to all seven documents.

## Fastest option — Netlify Drop (about a minute, no account needed to start)

1. Go to https://app.netlify.com/drop
2. Drag this entire folder onto the page
3. You get a shareable URL immediately (e.g. `random-name-123.netlify.app`)
4. Claim the site with a free account to keep it and rename it

## GitHub Pages (best if you want a permanent, versioned home)

```bash
git init
git add .
git commit -m "JJ Premier Group brand system"
gh repo create jj-premier-brand --public --source=. --push
```

Then in the repo: **Settings → Pages → Source: deploy from branch `main`, folder `/ (root)`**.
Live at `https://<user>.github.io/jj-premier-brand/`.

## Vercel or Cloudflare Pages

Both auto-detect a static site. Framework preset: **Other**. Build command: leave empty. Output directory: `.` (root).

---

## What must ship

| Path | Why |
| --- | --- |
| `index.html` | Entry point |
| `*.dc.html` | The seven documents |
| `support.js` | Runtime the `.dc.html` files load — **required** |
| `doc-page.js` | Print geometry for the PDF copy |
| `assets/` | Coldwell Banker logo variants (6 SVGs), QR codes (4 PNGs) |
| `assets/photos/` | Team photography, web-optimised |

## Notes for whoever hosts it

- **Serve `.dc.html` as `text/html`.** Every major static host does this already, since the filename ends in `.html`. If you put this behind a hand-rolled server, check the MIME type mapping.
- **Spaces in filenames.** The document filenames contain spaces (`JJ Premier Group Brand Style.dc.html`). Every host handles this, but the URLs will contain `%20`. If you would rather have clean URLs, rename the files to kebab-case and update the `href`s in `index.html` and in the "The kit" section of `JJ Premier Group Brand Style.dc.html` — those are the only two places they are linked.
- **Fonts load from Google Fonts.** The pages need network access for type to render as designed. Contralto and IvyPresto are licensed desktop fonts and are *specified* but not embedded — the pages fall back to Cormorant Garamond and Bodoni Moda. If the real fonts are licensed for web, self-host them and add `@font-face` rules; the font stacks already list the real names first.
- **This is an internal brand reference, not a public marketing site.** If it is going somewhere crawlable, add `<meta name="robots" content="noindex">` to each page first — it contains unreleased collateral and placeholder contact details.

## Before sharing outside the team

Placeholders still in the files:

- **Florida licence numbers are outstanding** — every piece prints `FL LIC PENDING`. Format is Florida DBPR (`SL…`), not California DRE.
- Phones, emails and the QR destination (`jjpremiergroup.com`) are real and live.
- Photography in `assets/photos/` is web-optimised to 1100px. Full-resolution masters live in `uploads/` and are NOT needed to host the site — exclude them if you are size-limited.
- Coldwell Banker logo usage should be confirmed against the franchise brand centre before anything is printed or published
