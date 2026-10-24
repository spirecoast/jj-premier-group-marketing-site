// Builds out/index.html: every template with its line, caption and notes, one chapter per family.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DECK, FAMILIES } from "./deck.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plain = (s = "") => esc(String(s).replace(/\*/g, "").replace(/<br>/g, " ").replace(/<[^>]+>/g, ""));
const dims = (t) => (t.format === "story" ? [1080, 1920] : t.format === "sq" ? [1080, 1080] : [1080, 1350]);
/** The line on the image, as a reviewer would read it aloud. */
function line(t) {
  if (t.layout === "bignum") return `${plain(t.numHtml || t.number)} · ${plain(t.headline)}`;
  if (t.layout === "listing") return [t.tag, t.address, t.headline].filter(Boolean).map(plain).join(" · ");
  if (t.layout === "check") return `${plain(t.headline)} ${t.items.map((i, n) => `(${n + 1}) ${plain(i)}`).join(" ")}`;
  if (t.layout === "cal") return `${plain(t.month)} ${plain(t.day)} · ${plain(t.headline)}`;
  if (t.layout === "myth") return `People think: ${plain(t.said)} Actually: ${plain(t.truth)}`;
  if (t.layout === "tot") return `${plain(t.headline)} ${plain(t.left.label)} / ${plain(t.right.label)}.`;
  if (t.layout === "encore") return `${plain(t.show)}${t.by ? " · " + plain(t.by) : ""} · ${plain(t.venue)}${t.when ? " · " + plain(t.when) : ""}${t.headline ? " — " + plain(t.headline) : ""}`;
  if (t.layout === "place") return `${plain(t.name || "")}${t.name ? " · " : ""}${plain(t.headline)}`;
  if (t.layout === "ui") {
    if (t.ui === "thread") return t.msgs.map((m) => (m.from === "us" ? "Us: " : "Them: ") + plain(m.text)).join(" ") + " — " + plain(t.headline);
    if (t.ui === "search") return `"${plain(t.query)}" + ${t.sugg.join(", ")} — ${plain(t.headline)}`;
    if (t.ui === "note") return plain(t.note).replace(/\n/g, " / ") + " — " + plain(t.headline);
    if (t.ui === "lock") return t.notifs.map((n) => `${plain(n.t)}: ${plain(n.m)}`).join(" · ") + " — " + plain(t.headline);
    if (t.ui === "list") return `${plain(t.title)}: ${t.rows.map((r) => plain(r.text || r)).join("; ")} — ${plain(t.headline)}`;
  }
  if (t.layout === "story") return `${plain(t.headline)}${t.q ? " · sticker: " + plain(t.q) : ""}${t.link ? " · " + plain(t.link) : ""}${t.count ? " · " + plain(t.count) + " " + plain(t.unit) : ""}`;
  return [t.headline, t.sub].filter(Boolean).map(plain).join(" ");
}
const JOB = { reach: "reach", share: "share", save: "save", comment: "comment", click: "click", follow: "follow", "comment and click": "comment · click" };
const byFam = {};
for (const t of DECK) (byFam[t.family] ||= []).push(t);
const counts = { registers: 12 };

const toc = FAMILIES.map((f) => `<a href="#f${f.n}"><span>${f.n} ${esc(f.name)}</span><b>${esc(JOB[f.job] || f.job)}</b></a>`).join("");
const sections = FAMILIES.map((f) => {
  const cards = byFam[f.n].map((t) => {
    const [w, h] = dims(t);
    return `<article class="card${t.format === "story" ? " tall" : ""}">
<img src="img/${t.id}.jpg" alt="Template ${t.id}" loading="lazy" width="${w}" height="${h}">
<div class="meta"><div class="top"><span class="id">${t.id}</span><span class="ttl">${esc(t.title)}</span></div>
<p class="ln">${line(t)}</p>
${t.caption ? `<p class="cap"><b>Caption</b> ${plain(t.caption)}</p>` : ""}
${t.note || t.check ? `<p class="why">${[t.note, t.check].filter(Boolean).map(plain).join(" ")}</p>` : ""}
</div></article>`;
  }).join("\n");
  return `<section id="f${f.n}"><header><div><div class="kicker">${f.n} · job: ${esc(JOB[f.job] || f.job)} · ${esc(f.register)}</div><h2>${esc(f.name)}</h2></div><p class="avg">10 templates</p></header>
<p class="thesis">${esc(f.thesis)}</p>
<div class="grid">${cards}</div></section>`;
}).join("\n");

// Published as an artifact, which wraps the file in its own document skeleton, so the file starts at <title>.
const html = `<title>JJ Premier Group Templates</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--paper:#FAF8F5;--linen:#E6DDD1;--ink:#2B2D30;--deep:#1E3442;--muted:#5E6268;--rule:#DDD5C8;--accent:#2C6E7E;--sold:#A6483C;--card:#FFFFFF;--display:"Newsreader",Georgia,serif;--body:"Jost","Helvetica Neue",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#142530;--linen:#1E3442;--ink:#E6DDD1;--deep:#F3EEE6;--muted:#9EBCCC;--rule:#2A4556;--accent:#89D4E3;--sold:#E09A8F;--card:#1A2D3A;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#142530;--linen:#1E3442;--ink:#E6DDD1;--deep:#F3EEE6;--muted:#9EBCCC;--rule:#2A4556;--accent:#89D4E3;--sold:#E09A8F;--card:#1A2D3A;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:300 17px/1.6 var(--body)}code{font-family:var(--mono);font-size:.9em}
.wrap{max-width:1280px;margin:0 auto;padding-block:48px 96px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2{font-family:var(--display);font-weight:600;color:var(--deep);text-wrap:balance;margin:0;letter-spacing:-.01em}
h1{font-size:clamp(40px,6.5vw,84px);line-height:1}h2{font-size:clamp(32px,4.4vw,52px);line-height:1.04}
.kicker{font:500 13px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.lede{font-size:21px;line-height:1.5;max-width:64ch;margin:22px 0 0}
.prose{max-width:68ch}.prose p{margin:14px 0 0}
.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:34px 0 0;max-width:760px}
.facts div{border-top:2px solid var(--deep);padding-top:10px}.facts b{display:block;font:500 38px/1 var(--mono);color:var(--deep)}.facts span{font-size:14px;color:var(--muted)}
.confirm{margin-top:56px;border:1px solid var(--rule);background:var(--card);padding:28px clamp(18px,3vw,36px)}
.confirm h2{font-size:clamp(26px,3.2vw,38px)}.confirm ol{margin:18px 0 0;padding-left:22px;display:grid;gap:12px;max-width:80ch}.confirm li::marker{font-family:var(--mono);color:var(--accent)}.confirm li b{font-weight:500;color:var(--deep)}
.toc{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:0 28px;margin-top:56px;border-top:1px solid var(--rule)}
.toc a{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--rule);color:var(--deep);text-decoration:none;font:500 18px/1.2 var(--body)}
.toc a b{font:500 13px/1.2 var(--mono);color:var(--accent);text-transform:uppercase;letter-spacing:.1em;padding-top:3px}
.toc a:hover span,.toc a:focus-visible span{text-decoration:underline;text-underline-offset:4px}a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
section{margin-top:72px;padding-top:28px;border-top:2px solid var(--deep)}
section header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:8px 24px}
.avg{font-family:var(--mono);font-size:14px;color:var(--muted);margin:0}
.thesis{margin:14px 0 26px;font-size:18px;max-width:72ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:34px 22px;align-items:start}
.card{min-width:0}.card img{display:block;width:100%;height:auto;border:1px solid var(--rule);background:var(--linen)}
.card.tall img{max-width:78%}
.meta{padding-top:10px}.top{display:flex;justify-content:space-between;gap:10px;align-items:baseline;border-bottom:1px solid var(--rule);padding-bottom:6px;margin-bottom:8px}
.id{font-family:var(--mono);font-weight:500;font-size:15px;color:var(--accent)}.ttl{font-size:14px;color:var(--muted);text-align:right}
.ln{font-size:15.5px;line-height:1.45;margin:0 0 8px;color:var(--ink)}
.cap{font-size:14px;line-height:1.45;color:var(--ink);margin:0 0 8px;opacity:.9}.cap b{font:500 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-right:6px}
.why{font:400 12.5px/1.45 var(--mono);color:var(--muted);margin:0}
.notes{margin-top:80px;border-top:2px solid var(--deep);padding-top:28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px;font-size:15px}
.notes h4{font:500 13px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 8px}.notes p{margin:0}
@media (max-width:760px){.facts b{font-size:28px}}
</style><div class="wrap">
<div class="kicker">Social media · round four · ${esc(new Date().toISOString().slice(0, 10))}</div>
<h1>The templates, in fourteen families</h1>
<p class="lede">Built the way the Virtus set was built: fourteen families, each with one job from the social plan, ten templates in each. The registers are round three's (Gallery, Golden Hour, Big Type, Harbor Night, Poster, Cut Paper, Elevation, Cinema, Chart Room, Quiet, Coldwell Banker Blue, Edition), carried into formats round three didn't have: checklists, dates, corrections, this-or-that, text threads, carousels and stories.</p>
<div class="prose">
<p>The writing is the point of this round. Every line talks to one person, plainly. Are you thinking about moving? If you think someone would find this useful, please share it. No exclamation marks, no superlatives, nothing described as stunning or a must-see. Every number carries its source and pull date. Every house is described, never the people who might live in it. Venues are named properly and sell nothing.</p>
<p>Under each image is the line on the image, a suggested caption written in the same voice, and what to swap or check before it posts.</p>
</div>
<div class="facts"><div><b>${DECK.length}</b><span>templates</span></div><div><b>${FAMILIES.length}</b><span>families, ten each</span></div><div><b>${counts.registers}</b><span>visual registers from round three</span></div></div>
<div class="confirm"><div class="kicker">Before anything is posted</div><h2>Seven things to confirm</h2><ol>
<li><b>Listings are samples.</b> Every listing, open house, sold and showing piece uses an invented house and price on a real neighborhood name, and says “Sample listing · for review” on the piece. Swap in real listings and their own photos, then remove that line.</li>
<li><b>Market figures.</b> Medians, counts and shares come from the county appraiser files in the repo (<code>data/sales</code>): qualified home sales, October 2025 to September 2026, pulled October 2026. The month in progress is never complete. Re-run the numbers the week a figure posts.</li>
<li><b>Encore.</b> Every show, venue and date was checked against the Encore calendar in the repo on October 24, 2026. Check each one again at the venue's own site the week it posts, and never imply a sponsorship.</li>
<li><b>Brokerage sign-off.</b> “Coldwell Banker Realty” appears on all ${DECK.length} pieces. Listing pieces carry the Equal Housing mark. The franchise logo appears only in the Coldwell Banker Blue register. Nothing ships without the brokerage contact's review.</li>
<li><b>Stand-in photos.</b> Photographs are from the site's own library and the Encore stock set. Houses are stand-ins; a few place photos stand in for a neighbor (the Gillespie Park bungalow is a Tampa bungalow, the Alvin Ailey stage is a stock stage). The team photo is the current duo portrait.</li>
<li><b>Stickers.</b> Poll, question, link and countdown stickers on the stories are drawn placeholders. Add the real Instagram stickers when posting.</li>
<li><b>Fonts.</b> IvyPresto and Contralto are licensed and not embedded, so the pieces use the brand's documented stand-ins (Newsreader, Cormorant Garamond). Every template is also an HTML file in <code>out/html</code>, so the type can be swapped once the licensed faces are installed.</li>
</ol></div>
<nav class="toc" aria-label="Families">${toc}</nav>
${sections}
<div class="notes">
<div><h4>How it was built</h4><p>Each template is HTML and CSS rendered by Chromium at 1080 px wide (4:5, square, or 9:16). The deck of copy, photos and registers is <code>design/social-templates/deck-a.mjs</code> and <code>deck-b.mjs</code>; <code>render.mjs</code> draws them; this page is built from the same deck.</p></div>
<div><h4>Copy rules kept</h4><p>Team voice (“we”), never one agent's first person. No exclamation marks, no emoji, no superlatives, no “reach out”. Fair housing: the property, never the people. The tagline is not rewritten and never used as a headline.</p></div>
<div><h4>Data</h4><p>Tide figures were recomputed from <code>data/sales</code> for this round (single-family medians: Lakewood Ranch $730,000, Sarasota $619,700, Bradenton $435,000). Atlas maps plot the 2,038 neighborhoods with coordinates in the Atlas dataset. Encore picks come from the site's calendar file.</p></div>
<div><h4>What's next</h4><p>Pick the strongest two or three per family and we'll cut the rest, score them the way the Virtus set was scored (stop, read, share, craft), and build the editable Express or Figma versions of the keepers.</p></div>
</div>
</div>`;
fs.writeFileSync(path.join(HERE, "out/index.html"), html);
console.log("index.html", html.length, "bytes");
