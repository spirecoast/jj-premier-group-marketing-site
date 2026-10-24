// Renders every template in deck.mjs to out/img/<id>.jpg (and the HTML it came from to out/html/<id>.html).
//   node design/social-templates/render.mjs            all
//   node design/social-templates/render.mjs 03 07-02   families or ids that start with these
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Playwright is preinstalled on the machine, not in the repo: resolve it through require so a bare import does not fail.
const { chromium } = (() => { try { return require("playwright"); } catch { return require("/opt/node-tools/node_modules/playwright"); } })();
import { DECK, FAMILIES } from "./deck.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(HERE, "out");
const IMG = path.join(ROOT, "public/images");
const BRAND = path.join(ROOT, "design/brand-system/assets");
fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
fs.mkdirSync(path.join(OUT, "html"), { recursive: true });

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Inline emphasis: *word* becomes an italic span. */
const rich = (s = "") => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const file = (p) => "file://" + p;
/** Photo keys: library/x, encore/x, photos/x, guides/x, brand/x (design/brand-system/assets/...). */
function photo(key) {
  if (!key) return "";
  if (key.startsWith("library/")) return file(path.join(IMG, key + (key.endsWith(".jpg") ? "" : ".jpg")));
  if (key.startsWith("encore/")) return file(path.join(IMG, "encore-stock", key.slice(7) + ".jpg"));
  if (key.startsWith("photos/")) return file(path.join(IMG, key + ".jpg"));
  if (key.startsWith("guides/")) return file(path.join(IMG, key + ".jpg"));
  if (key.startsWith("brand/")) return file(path.join(BRAND, key.slice(6)));
  return file(path.join(IMG, key));
}
const posFor = (t) => (t.pos ? `object-position:${t.pos}` : "");
const ph = (t, cls = "ph") => (t.photo ? `<img class="${cls}" src="${photo(t.photo)}" style="${posFor(t)}" alt="">` : "");

const EHO_B = file(path.join(BRAND, "marks/equal-housing-black.png"));
const EHO_W = file(path.join(BRAND, "marks/equal-housing-white.png"));
const CB_BLUE = file(path.join(BRAND, "coldwell-banker-horz-cbblue.svg"));

const mark = () => `<span class="mark"><b>JJ</b><i></i><span>Premier Group</span></span>`;
const eho = (dark) => `<span class="eho"><img src="${dark ? EHO_W : EHO_B}" alt="">Equal Housing<br>Opportunity</span>`;
/** Footer: team mark left, Equal Housing when a listing, Coldwell Banker Realty right. */
function foot(t, { dark = false, logo = false } = {}) {
  const needsEho = t.eho ?? t.layout === "listing";
  return `<div class="foot">${mark()}${needsEho ? eho(dark) : ""}<span class="cb">${logo ? `<img src="${CB_BLUE}" alt="Coldwell Banker Realty">` : "Coldwell Banker Realty"}</span></div>`;
}
const sampleLine = (t) => (t.sample ? `<div class="sample">Sample listing · for review</div>` : "");

const FILTERS = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="posterize" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>
<feFuncR type="discrete" tableValues="0.078 0.247 0.537 0.953"/><feFuncG type="discrete" tableValues="0.145 0.373 0.831 0.933"/><feFuncB type="discrete" tableValues="0.188 0.451 0.890 0.902"/></feComponentTransfer></filter>
<filter id="posterize-warm" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>
<feFuncR type="discrete" tableValues="0.118 0.420 0.824 0.980"/><feFuncG type="discrete" tableValues="0.204 0.365 0.776 0.973"/><feFuncB type="discrete" tableValues="0.259 0.306 0.706 0.961"/></feComponentTransfer></filter>
</defs></svg>`;

/* ---------- layouts ---------- */
const L = {};

L.statement = (t) => {
  const light = t.style === "paper";
  const top = t.toptext ? " toptext" : "";
  return `<div class="frame statement${light ? " light" : ""}${top}">${light ? "" : ph(t)}${t.dim ? `<div class="dim"></div>` : ""}${light ? "" : `<div class="scrim${t.toptext ? " top" : ""}"></div>`}
  ${t.eyebrow ? `<div class="tl eyebrow" style="color:${light ? "var(--sky700)" : "var(--sky)"}">${esc(t.eyebrow)}</div>` : ""}
  <div class="text"><div class="h1${t.size || ""}">${rich(t.headline)}</div>${t.sub ? `<div class="sub">${rich(t.sub)}</div>` : ""}</div>
  ${foot(t, { dark: !light })}</div>`;
};

L.quiet = (t) => `<div class="frame quiet">
  <div class="win" style="${t.win || "left:600px;top:400px;width:380px;height:480px"}"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
  ${t.eyebrow ? `<div class="tl eyebrow" style="color:var(--graphite)">${esc(t.eyebrow)}</div>` : ""}
  <div class="line${t.wide ? " wide" : ""}">${rich(t.headline)}</div>
  <div class="meta">${t.facts ? `<div class="facts">${esc(t.facts)}</div>` : ""}${t.sub ? `<div class="body sm" style="max-width:620px;margin-top:14px">${rich(t.sub)}</div>` : ""}${sampleLine(t)}</div>
  ${foot(t)}</div>`;

L.bignum = (t) => `<div class="frame bignum${t.style === "paper" ? " paper" : " dark"}"><div class="grid"></div>
  <div class="tl eyebrow" style="opacity:.8">${esc(t.eyebrow || "")}</div><div class="tr eyebrow" style="opacity:.8">${esc(t.eyebrow2 || "")}</div>
  <div class="num ${t.numSize || ""}">${t.numHtml || esc(t.number)}</div>
  <div class="explain"><div class="skybar"></div><div class="body">${rich(t.headline)}</div>${t.source ? `<div class="src">${esc(t.source)}</div>` : ""}</div>
  ${foot(t, { dark: t.style !== "paper" })}</div>`;

const addrBlock = (t) => `<div class="addr">${rich(t.address)}</div><div class="facts">${esc(t.facts)}</div>${sampleLine(t)}`;

L.listing = (t) => {
  const s = t.style;
  if (s === "cbblue") return `<div class="frame listing cbl">
    <div class="photo"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div><div class="hair"></div>
    ${t.tag ? `<span class="tag ${t.tagClass || "new"}">${esc(t.tag)}</span>` : ""}
    <div class="band"><div class="price">${esc(t.price)}</div><div class="addr">${esc(t.address)}</div><div class="facts">${esc(t.facts)}</div>${t.headline ? `<div class="line">${rich(t.headline)}</div>` : ""}<div style="margin-top:16px">${sampleLine(t)}</div></div>
    ${foot(t, { logo: true })}</div>`;
  if (s === "gallery") return `<div class="frame listing gal dark"><div class="wall"></div>
    <div class="tl eyebrow">${esc(t.eyebrow || "")}</div>
    <div class="frame-art"><div class="mat"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div></div>
    <div class="label">${t.sold ? `<span class="dot"></span>` : ""}<div class="t">${esc(t.address)}</div><div class="d">${rich(t.headline || "")}</div><div class="facts">${esc(t.facts)}</div>${t.price ? `<div class="facts" style="margin-top:6px">${esc(t.price)}</div>` : ""}<div class="sample" style="margin-top:10px;font-size:13px">Sample listing · for review</div></div>
    ${foot(t, { dark: true })}</div>`;
  if (s === "night") return `<div class="frame listing night dark">
    <div class="tl eyebrow" style="color:var(--linen500)">${esc(t.eyebrow || "")}</div>${t.eyebrow2 ? `<div class="tr eyebrow" style="color:var(--linen500)">${esc(t.eyebrow2)}</div>` : ""}
    <div class="win"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    <div class="text"><div class="h1">${rich(t.address)}</div><div class="body">${rich(t.headline || "")}</div><div class="hair"></div><div class="facts">${esc(t.facts)}${t.price ? " · " + esc(t.price) : ""}</div><div style="margin-top:12px">${sampleLine(t)}</div></div>
    ${foot(t, { dark: true })}</div>`;
  if (s === "cinema") return `<div class="frame listing cinema dark">
    <div class="tl">${esc(t.eyebrow || "SC. 01 · TAKE 1")}</div><div class="tr">JJ Premier Group</div>
    <div class="slug">${esc(t.slug)}</div>
    <div class="band"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    <div class="sub">${rich(t.subtitle || "")}</div>
    <div class="text"><div class="body">${rich(t.headline || "")}</div><div class="facts">${esc(t.tag ? t.tag + ". " : "")}${esc(t.facts)}${t.price ? " · " + esc(t.price) : ""}</div><div style="margin-top:18px">${sampleLine(t)}</div></div>
    ${foot(t, { dark: true })}</div>`;
  if (s === "elev") return `<div class="frame listing elev"><div class="sheet"></div><div class="ruler"></div>
    <div class="title"><div class="eyebrow" style="color:var(--h700);margin-bottom:12px">${esc(t.eyebrow || "Sheet A-201 · Front elevation")}</div><div class="h1">${rich(t.headline || t.tag || "Just listed")}</div></div>
    <div class="sketch"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""><img class="inv" src="${photo(t.photo)}" style="${posFor(t)}" alt=""><div class="wash"></div><div class="soft"></div></div>
    ${(t.callouts || []).map((c) => `<div class="call${c.r ? " r" : ""}" style="${c.at}">${esc(c.text)}</div>`).join("")}
    <div class="block"><div><div class="k">Project</div><div class="v">${esc(t.address)}</div><div class="s">${esc(t.sub || "")}</div></div><div><div class="k">List price</div><div class="v mono">${esc(t.price || "")}</div><div class="s">${esc(t.facts)}</div></div><div><div class="k">Drawn for</div><div class="v" style="font-size:22px">JJ Premier Group</div><div class="s">Coldwell Banker Realty</div><div class="s" style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-family:var(--mono)">Sample listing · for review</div></div></div>
    <div class="foot" style="bottom:78px;left:84px;right:84px">${mark()}${eho(false)}<span class="cb">Coldwell Banker Realty</span></div></div>`;
  if (s === "poster") return `<div class="frame listing poster">
    <div class="art${t.warm ? " warm" : ""}"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    <div class="title"><div class="big${t.bigSm ? " sm" : ""}">${esc(t.tag || "Just listed")}</div><div class="small">${esc(t.address)} · ${esc(t.facts)}</div>${t.headline ? `<div class="line">${rich(t.headline)}</div>` : ""}<div style="margin-top:14px">${sampleLine(t)}</div></div>
    ${foot(t)}</div>`;
  if (s === "collage") return `<div class="frame listing collage">
    <div class="dots" style="right:60px;top:80px"></div>
    <div class="scrap torn" style="left:70px;top:110px;width:720px;height:680px;transform:rotate(-2deg)"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    ${t.photo2 ? `<div class="scrap" style="left:420px;top:620px;width:560px;height:360px;transform:rotate(3deg);outline:12px solid #fff"><img src="${photo(t.photo2)}" alt=""></div>` : ""}
    <div class="tape" style="left:60px;top:100px"></div><div class="tape" style="left:640px;top:130px;transform:rotate(8deg)"></div>
    <div class="lbl navy" style="left:90px;top:60px;transform:rotate(-3deg);font-size:28px">${esc(t.tag || "Just listed")}</div>
    <div class="lbl" style="left:84px;top:1010px;font-size:24px">${esc(t.address)}</div>
    <div class="lbl" style="left:110px;top:1080px;font-size:22px">${esc(t.facts)}${t.price ? " · " + esc(t.price) : ""}</div>
    <div class="lbl" style="left:84px;top:1150px;font-size:16px;letter-spacing:.14em;text-transform:uppercase">Sample listing · for review</div>
    ${foot(t)}</div>`;
  if (s === "quiet") return L.quiet({ ...t, headline: t.headline, facts: `${t.facts}${t.price ? " · " + t.price : ""}`, eyebrow: t.eyebrow || t.tag });
  if (s === "edition") return `<div class="frame listing edition dark">${ph(t)}<div class="scrim top" style="height:70%"></div><div class="scrim"></div>
    <div class="mast">Edition</div>
    <div class="issue"><span>${esc(t.issue || "No. 05 · Winter 2026–27")}</span><span>JJ Premier Group · Coldwell Banker Realty</span></div>
    <div class="lines">${(t.lines || []).map((l, i) => `<div class="k">${esc(l.k)}</div><div class="l${i === 0 ? " big" : ""}">${rich(l.l)}</div>`).join("")}</div>
    <div class="plate" style="bottom:190px"><div class="facts">${esc(t.address)} · ${esc(t.facts)}${t.price ? " · " + esc(t.price) : ""}</div>${sampleLine(t)}</div>
    ${foot(t, { dark: true })}</div>`;
  // golden (default): full bleed, type low
  return `<div class="frame listing golden dark">${ph(t)}<div class="scrim"></div>
    <div class="tl eyebrow" style="color:var(--linen)">${esc(t.tag || "Just listed")}</div>${t.camnote ? `<div class="tr camnote">${esc(t.camnote)}</div>` : ""}
    <div class="plate">${addrBlock(t)}${t.price ? `<div class="facts" style="margin-top:8px">${esc(t.price)}</div>` : ""}${t.headline ? `<div class="body" style="margin-top:22px;max-width:900px">${rich(t.headline)}</div>` : ""}</div>
    ${foot(t, { dark: true })}</div>`;
};

L.check = (t) => `<div class="frame check${t.style === "dark" ? " dark" : ""}">
  ${t.photo ? `<div class="photo"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>` : ""}
  ${t.eyebrow ? `<div class="tl eyebrow" style="color:${t.photo ? "#fff" : "var(--sky700)"}">${esc(t.eyebrow)}</div>` : ""}
  <div class="panel" style="${t.photo ? "" : "top:170px"}"><div class="h1">${rich(t.headline)}</div>
  ${t.items.map((it, i) => `<div class="item">${t.boxes ? `<span class="box"></span>` : `<span class="n">0${i + 1}</span>`}<span>${rich(it)}</span></div>`).join("")}</div>
  ${t.sub ? `<div class="note">${rich(t.sub)}</div>` : ""}
  ${foot(t, { dark: t.style === "dark" })}</div>`;

L.cal = (t) => `<div class="frame cal${t.style === "paper" ? " paper" : " dark"}">${t.style === "paper" ? "" : ph(t) + `<div class="scrim"></div>`}
  ${t.style === "paper" && t.photo ? `<div style="position:absolute;left:420px;right:0;top:0;height:760px;overflow:hidden"><img src="${photo(t.photo)}" style="width:100%;height:100%;object-fit:cover;${posFor(t)}" alt=""></div>` : ""}
  <div class="date"><div class="m">${esc(t.month)}</div><div class="d">${esc(t.day)}</div>${t.weekday ? `<div class="w">${esc(t.weekday)}</div>` : ""}</div>
  <div class="text"><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}${t.source ? `<div class="src" style="margin-top:18px">${esc(t.source)}</div>` : ""}</div>
  ${foot(t, { dark: t.style !== "paper" })}</div>`;

L.myth = (t) => `<div class="frame myth dark">${ph(t)}<div class="scrim full" style="background:rgba(20,37,48,.35)"></div><div class="scrim"></div>
  <div class="card"><div class="k">${esc(t.k || "What people think")}</div><div class="said">${rich(t.said)}</div><div class="k">${esc(t.k2 || "What's actually true")}</div><div class="truth">${rich(t.truth)}</div>${t.more ? `<div class="more">${rich(t.more)}</div>` : ""}${t.source ? `<div class="src" style="margin-top:22px;color:var(--graphite)">${esc(t.source)}</div>` : ""}</div>
  ${foot(t, { dark: true })}</div>`;

L.tot = (t) => `<div class="frame tot dark">
  <div class="half l"><img src="${photo(t.left.photo)}" style="${t.left.pos ? "object-position:" + t.left.pos : ""}" alt=""></div>
  <div class="half r"><img src="${photo(t.right.photo)}" style="${t.right.pos ? "object-position:" + t.right.pos : ""}" alt=""></div>
  <div class="scrim top" style="height:45%"></div><div class="scrim" style="height:40%"></div><div class="seam"></div>
  <div class="q"><div class="h1">${rich(t.headline)}</div></div>
  <div class="or">or</div>
  <div class="lab l"><span>${esc(t.left.label)}</span></div><div class="lab r"><span>${esc(t.right.label)}</span></div>
  ${t.sub ? `<div class="ask">${rich(t.sub)}</div>` : ""}
  ${foot(t, { dark: true })}</div>`;

/* charts */
function chartSvg(t) {
  const W = 952;
  if (t.chart === "bars") {
    const H = 560, max = Math.max(...t.bars.map((b) => b.v));
    const bw = Math.floor((W - (t.bars.length - 1) * 28) / t.bars.length);
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 470}px;height:${H}px;width:${W}px">${t.bars.map((b, i) => {
      const h = Math.round((b.v / max) * 380), x = i * (bw + 28), y = 420 - h;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${b.fill || "#89D4E3"}"/><text x="${x + bw / 2}" y="${y - 18}" text-anchor="middle" font-size="26" font-weight="500" fill="currentColor">${esc(b.label)}</text><text x="${x + bw / 2}" y="470" text-anchor="middle" font-size="19" letter-spacing="2" fill="currentColor" opacity=".8">${esc(b.name.toUpperCase())}</text>${b.sub ? `<text x="${x + bw / 2}" y="505" text-anchor="middle" font-size="16" letter-spacing="1" fill="currentColor" opacity=".55">${esc(b.sub)}</text>` : ""}`;
    }).join("")}</svg>`;
  }
  if (t.chart === "hbars") {
    const rowH = 92, H = t.bars.length * rowH + 20, max = Math.max(...t.bars.map((b) => b.v));
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 440}px;height:${H}px;width:${W}px">${t.bars.map((b, i) => {
      const w = Math.round((b.v / max) * 480), y = i * rowH;
      return `<text x="0" y="${y + 50}" font-size="22" letter-spacing="2" fill="currentColor">${esc(b.name.toUpperCase())}</text><rect x="330" y="${y + 24}" width="${w}" height="40" fill="${b.fill || "#89D4E3"}"/><text x="${330 + w + 16}" y="${y + 53}" font-size="26" font-weight="500" fill="currentColor">${esc(b.label)}</text>`;
    }).join("")}</svg>`;
  }
  if (t.chart === "months") {
    const H = 520, max = Math.max(...t.points.map((p) => p.v)), n = t.points.length, gap = 10, bw = Math.floor((W - gap * (n - 1)) / n);
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 470}px;height:${H}px;width:${W}px">${t.points.map((p, i) => {
      const h = Math.round((p.v / max) * 340), x = i * (bw + gap), y = 400 - h;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${p.fill || "#89D4E3"}" opacity="${p.faint ? .45 : 1}"/><text x="${x + bw / 2}" y="${y - 14}" text-anchor="middle" font-size="19" fill="currentColor" opacity=".9">${esc(p.label || "")}</text><text x="${x + bw / 2}" y="440" text-anchor="middle" font-size="17" letter-spacing="1" fill="currentColor" opacity=".75">${esc(p.name)}</text>`;
    }).join("")}</svg>`;
  }
  if (t.chart === "atlas") {
    const pts = JSON.parse(fs.readFileSync(path.join(HERE, "atlas-points.json"), "utf8"));
    const minLng = -82.76, maxLng = -82.26, minLat = 27.19, maxLat = 27.66; const H = 700;
    const sx = (lng) => ((lng - minLng) / (maxLng - minLng)) * W, sy = (lat) => H - ((lat - minLat) / (maxLat - minLat)) * H;
    const col = { b: "#89D4E3", s: "#C7E7EF", l: "#FAF8F5" };
    const sel = t.market ? pts.filter((p) => p[2] === t.market) : pts;
    const dim = t.market ? pts.filter((p) => p[2] !== t.market) : [];
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 380}px;height:${H}px;width:${W}px">${dim.map((p) => `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="2.2" fill="#5C86A0" opacity=".35"/>`).join("")}${sel.map((p) => `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="3" fill="${col[p[2]]}" opacity=".9"/>`).join("")}${(t.labels || []).map((l) => `<text x="${sx(l.lng)}" y="${sy(l.lat)}" class="halo" font-size="22" letter-spacing="3" fill="#FAF8F5">${esc(l.text.toUpperCase())}</text>`).join("")}<text x="30" y="${H - 30}" font-size="22" letter-spacing="6" fill="#9EBCCC" opacity=".6">GULF OF MEXICO</text></svg>`;
  }
  if (t.chart === "pie") {
    const H = 560, cx = 260, cy = 280, r = 230; let a = -Math.PI / 2; const tot = t.slices.reduce((s, x) => s + x.v, 0);
    const arcs = t.slices.map((s) => { const b = a + (s.v / tot) * Math.PI * 2; const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a), x2 = cx + r * Math.cos(b), y2 = cy + r * Math.sin(b); const big = b - a > Math.PI ? 1 : 0; const d = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${big} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`; a = b; return `<path d="${d}" fill="${s.fill}" stroke="#1E3442" stroke-width="3"/>`; }).join("");
    const legend = t.slices.map((s, i) => `<rect x="560" y="${96 + i * 104}" width="26" height="26" fill="${s.fill}"/><text x="606" y="${118 + i * 104}" font-size="25" font-weight="500" fill="currentColor">${esc(s.name)}</text><text x="606" y="${152 + i * 104}" font-size="21" fill="currentColor" opacity=".8">${esc(s.label)}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 440}px;height:${H}px;width:${W}px">${arcs}${legend}</svg>`;
  }
  if (t.chart === "line") {
    const H = 520, xs = t.points.length, max = Math.max(...t.points.map((p) => p.v)), min = Math.min(...t.points.map((p) => p.v)) * 0.96;
    const px = (i) => (i / (xs - 1)) * (W - 40) + 20, py = (v) => 380 - ((v - min) / (max - min)) * 330;
    const d = t.points.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" style="top:${t.chartTop || 470}px;height:${H}px;width:${W}px"><path d="${d}" fill="none" stroke="#89D4E3" stroke-width="5"/>${t.points.map((p, i) => `<circle cx="${px(i)}" cy="${py(p.v)}" r="9" fill="#FAF8F5"/><text x="${px(i)}" y="${py(p.v) - 24}" text-anchor="middle" font-size="22" font-weight="500" fill="currentColor">${esc(p.label || "")}</text><text x="${px(i)}" y="440" text-anchor="middle" font-size="18" letter-spacing="1" fill="currentColor" opacity=".75">${esc(p.name)}</text>`).join("")}</svg>`;
  }
  return "";
}
L.chart = (t) => `<div class="frame chart${t.style === "paper" ? " paper" : " dark"}"><div class="grid"></div>
  <div class="tl eyebrow" style="opacity:.8">${esc(t.eyebrow || "")}</div>${t.eyebrow2 ? `<div class="tr eyebrow" style="opacity:.8">${esc(t.eyebrow2)}</div>` : ""}
  <div class="title"><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>
  ${chartSvg(t)}
  ${t.source ? `<div class="src">${esc(t.source)}</div>` : ""}
  ${foot(t, { dark: t.style !== "paper" })}</div>`;

L.car = (t) => {
  const kind = t.kind || "slide";
  if (kind === "cover") return `<div class="frame car cover dark">${ph(t)}<div class="scrim"></div><div class="n" style="color:#fff">${esc(t.n || "")}</div>
    <div class="text"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div><div class="swipe">Swipe →</div>${foot(t, { dark: true })}</div>`;
  if (kind === "end") return `<div class="frame car end dark"><div class="n" style="color:var(--h300)">${esc(t.n || "")}</div>
    <div class="text"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>${foot(t, { dark: true })}</div>`;
  if (kind === "plain") return `<div class="frame car plain"><div class="n">${esc(t.n || "")}</div>${t.num ? `<div class="bignum">${esc(t.num)}</div>` : ""}
    <div class="text"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>${foot(t)}</div>`;
  return `<div class="frame car"><div class="photo"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div><div class="n" style="color:#fff">${esc(t.n || "")}</div>
    <div class="text"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>${foot(t)}</div>`;
};

L.encore = (t) => {
  const s = t.style || "night";
  const when = `<div class="when facts">${esc(t.venue)}${t.when ? " · " + esc(t.when) : ""}</div>`;
  if (s === "night") return `<div class="frame enc night dark"><div class="tl eyebrow" style="color:var(--linen500)">${esc(t.eyebrow || "Encore")}</div><div class="tr eyebrow" style="color:var(--linen500)">${esc(t.category || "")}</div>
    <div class="win" style="height:620px"><img src="${photo(t.photo)}" style="width:100%;height:100%;object-fit:cover;${posFor(t)}" alt=""></div>
    <div class="text" style="top:820px"><div class="show">${rich(t.show)}</div>${t.by ? `<div class="by">${rich(t.by)}</div>` : ""}${when}${t.headline ? `<div class="line">${rich(t.headline)}</div>` : ""}</div>${foot(t, { dark: true })}</div>`;
  if (s === "gallery") return `<div class="frame enc gal dark"><div class="wall" style="background:radial-gradient(ellipse 70% 55% at 50% 38%,#f4f1ec 0%,#dcd7cf 50%,#bdb7ad 100%)"></div>
    <div class="tl eyebrow" style="color:var(--graphite)">${esc(t.eyebrow || "Encore")}</div>
    <div class="frame-art" style="top:140px;height:560px;background:#111;border-color:#333;box-shadow:0 30px 60px rgba(0,0,0,.35)"><div class="mat" style="border-color:#555"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div></div>
    <div style="position:absolute;left:64px;right:64px;top:760px;color:var(--ink)"><div class="eyebrow" style="color:var(--graphite);margin-bottom:16px">${esc(t.category || "")}</div><div class="show" style="color:var(--deep)">${rich(t.show)}</div>${t.by ? `<div class="by" style="color:var(--graphite)">${rich(t.by)}</div>` : ""}${when}${t.headline ? `<div class="line" style="color:var(--ink)">${rich(t.headline)}</div>` : ""}</div>
    <div class="foot" style="color:var(--ink)">${mark()}<span class="cb">Coldwell Banker Realty</span></div></div>`;
  if (s === "poster") return `<div class="frame enc poster"><div class="art${t.warm ? " warm" : ""}" style="height:820px"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    <div class="title" style="top:900px"><div class="eyebrow" style="color:var(--h700);margin-bottom:16px">${esc(t.eyebrow || "Encore")} · ${esc(t.category || "")}</div><div class="big${t.bigSm ? " sm" : ""}">${esc(t.show)}</div><div class="small">${esc(t.venue)}${t.when ? " · " + esc(t.when) : ""}</div>${t.headline ? `<div class="line">${rich(t.headline)}</div>` : ""}</div>${foot(t)}</div>`;
  if (s === "cinema") return `<div class="frame enc cinema dark"><div class="tl">${esc(t.eyebrow || "Encore")}</div><div class="tr">${esc(t.category || "")}</div>
    <div class="slug">${esc(t.slug || "INT. THE HALL — NIGHT")}</div><div class="band"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div><div class="sub">${rich(t.show)}</div>
    <div class="text"><div class="body">${rich(t.headline || "")}</div><div class="facts" style="margin-top:28px">${esc(t.venue)}${t.when ? " · " + esc(t.when) : ""}</div></div>${foot(t, { dark: true })}</div>`;
  if (s === "edition") return `<div class="frame enc edition dark">${ph(t)}<div class="scrim top" style="height:70%"></div><div class="scrim"></div><div class="mast">Edition</div>
    <div class="issue"><span>${esc(t.issue || "The Encore issue")}</span><span>JJ Premier Group · Coldwell Banker Realty</span></div>
    <div class="lines">${(t.lines || []).map((l, i) => `<div class="k">${esc(l.k)}</div><div class="l${i === 0 ? " big" : ""}">${rich(l.l)}</div>`).join("")}</div>
    <div style="position:absolute;left:64px;right:64px;bottom:190px;color:#fff"><div class="facts">${esc(t.venue)}${t.when ? " · " + esc(t.when) : ""}</div></div>${foot(t, { dark: true })}</div>`;
  // quiet
  return L.quiet({ ...t, headline: t.headline || t.show, facts: `${t.show} · ${t.venue}${t.when ? " · " + t.when : ""}`, eyebrow: t.eyebrow || "Encore" });
};

L.place = (t) => {
  if (t.style === "poster") return `<div class="frame poster"><div class="art${t.warm ? " warm" : ""}"><img src="${photo(t.photo)}" style="${posFor(t)}" alt=""></div>
    <div class="title"><div class="big${t.bigSm ? " sm" : ""}">${esc(t.name)}</div><div class="small">${esc(t.sub || "")}</div>${t.headline ? `<div class="line">${rich(t.headline)}</div>` : ""}</div>${foot(t)}</div>`;
  if (t.style === "quiet") return L.quiet(t);
  return L.statement({ ...t, eyebrow: t.eyebrow || t.name });
};

L.ui = (t) => {
  const bg = `<div class="bg">${ph(t)}</div>`;
  let body = "";
  if (t.ui === "thread") body = `<div class="thread">${t.msgs.map((m) => m.stamp ? `<div class="stamp">${esc(m.stamp)}</div>` : `<div class="bub ${m.from === "us" ? "out" : "in"}">${rich(m.text)}</div>`).join("")}</div>`;
  if (t.ui === "search") body = `<div class="search"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>${esc(t.query)}<span style="border-left:3px solid #333;margin-left:4px"></span></span></div><div class="sugg">${t.sugg.map((s) => `<div><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>${esc(t.query)} <b>${esc(s)}</b></span></div>`).join("")}</div>`;
  if (t.ui === "note") body = `<div class="note">${rich(t.note)}</div>`;
  if (t.ui === "lock") body = `<div class="lock">${t.notifs.map((n) => `<div class="notif"><div class="ic ${n.ic || ""}">${esc(n.icon || "JJ")}</div><div><div class="t">${esc(n.t)}</div><div class="m">${rich(n.m)}</div></div><div class="w">${esc(n.w || "now")}</div></div>`).join("")}</div>`;
  if (t.ui === "list") body = `<div class="list"><div class="h">${esc(t.title)}</div>${t.rows.map((r) => `<div class="row${r.done ? " done" : ""}"><i></i><span>${rich(r.text || r)}</span></div>`).join("")}</div>`;
  return `<div class="frame ui dark">${bg}<div class="scrim" style="height:50%"></div>${t.eyebrow ? `<div class="tl eyebrow" style="color:var(--sky)">${esc(t.eyebrow)}</div>` : ""}${body}
    <div class="caption">${rich(t.headline)}</div>${foot(t, { dark: true })}</div>`;
};

L.story = (t) => {
  const k = t.kind || "poll";
  let st = "";
  if (k === "poll") st = `<div class="sticker" style="top:1080px"><div class="q">${esc(t.q)}</div><div class="poll"><div>${esc(t.a)}</div><div>${esc(t.b)}</div></div></div>`;
  if (k === "question") st = `<div class="sticker" style="top:1080px"><div class="q">${esc(t.q)}</div><div class="qbox">Type something…</div></div>`;
  if (k === "link") st = `<div style="position:absolute;left:0;right:0;top:1140px;text-align:center"><span class="linkst"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.4"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>${esc(t.link)}</span></div>`;
  if (k === "count") st = `<div class="sticker" style="top:1040px"><div class="count"><div class="lab">${esc(t.label)}</div><div class="big">${esc(t.count)}</div><div class="lab">${esc(t.unit)}</div></div></div>`;
  if (k === "reel") return `<div class="frame story dark">${ph(t)}<div class="scrim full" style="background:rgba(20,37,48,.45)"></div><div class="reel"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>${foot(t, { dark: true })}</div>`;
  return `<div class="frame story dark">${ph(t)}<div class="scrim top" style="height:55%"></div><div class="scrim" style="height:50%"></div>
    ${t.eyebrow ? `<div class="eyebrow" style="position:absolute;left:64px;top:300px;color:var(--sky)">${esc(t.eyebrow)}</div>` : ""}
    <div class="text" style="top:${t.textTop || 380}px"><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>${st}
    <div class="placeholder">Drawn placeholder · add the real Instagram sticker when posting</div>${foot(t, { dark: true })}</div>`;
};

L.moment = (t) => `<div class="frame moment dark${t.panel ? " panel" : ""}">${ph(t)}${t.panel ? `<div class="pscrim"></div>` : `<div class="scrim"></div>`}
  ${t.eyebrow && !t.panel ? `<div class="tl eyebrow" style="color:var(--sky)">${esc(t.eyebrow)}</div>` : ""}
  <div class="text">${t.eyebrow && t.panel ? `<div class="eyebrow" style="color:var(--sky700);margin-bottom:26px">${esc(t.eyebrow)}</div>` : ""}<div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}</div>
  ${t.panel ? `<div class="foot" style="color:#fff">${mark()}<span class="cb">Coldwell Banker Realty</span></div>` : foot(t, { dark: true })}</div>`;

L.title = (t) => `<div class="frame title-card dark" style="background:${t.bg || "var(--sky700)"}"><div class="k">${esc(t.eyebrow || "")}</div><div class="h1">${rich(t.headline)}</div>${t.sub ? `<div class="body">${rich(t.sub)}</div>` : ""}${foot(t, { dark: true })}</div>`;

/* ---------- page ---------- */
const CSS = file(path.join(HERE, "styles.css")), FONTS = file(path.join(HERE, "fonts.css"));
function page(t) {
  const fn = L[t.layout];
  if (!fn) throw new Error(`no layout ${t.layout} for ${t.id}`);
  let html = fn(t);
  if (t.format === "story") html = html.replace('class="frame ', 'class="frame story ');
  if (t.format === "sq") html = html.replace('class="frame ', 'class="frame sq ');
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><link rel="stylesheet" href="${CSS}"><title>${esc(t.id)}</title></head><body>${FILTERS}${html}</body></html>`;
}

const want = process.argv.slice(2);
const todo = DECK.filter((t) => !want.length || want.some((w) => t.id.startsWith(w)));
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();
let n = 0;
for (const t of todo) {
  const h = t.format === "story" ? 1920 : t.format === "sq" ? 1080 : 1350;
  const htmlPath = path.join(OUT, "html", t.id + ".html");
  fs.writeFileSync(htmlPath, page(t));
  await pg.setViewportSize({ width: 1080, height: h });
  await pg.goto(file(htmlPath));
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(60);
  await pg.screenshot({ path: path.join(OUT, "img", t.id + ".jpg"), type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1080, height: h } });
  n++;
}
await browser.close();
console.log(`rendered ${n} of ${DECK.length}`);
