import { parse, type HTMLElement } from "node-html-parser";

/** Small helpers over node-html-parser for the per-site adapters. */

export type Doc = HTMLElement;

/** A fetched page: the final URL, the raw HTML and the parsed document. */
export type Page = { url: string; html: string; doc: Doc };

export function parseHtml(html: string): Doc {
  return parse(html, { comment: false, blockTextElements: { script: true, style: false, noscript: false, pre: true } });
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", hellip: "…", eacute: "é", egrave: "è", aacute: "á", oacute: "ó", iacute: "í", uacute: "ú",
  ntilde: "ñ", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", rsaquo: "›", lsaquo: "‹", trade: "™", reg: "®", copy: "©",
  bull: "•", middot: "·", eacute2: "é", agrave: "à", ecirc: "ê", ocirc: "ô",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (all, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : all;
    }
    return ENTITIES[code.toLowerCase()] ?? all;
  });
}

/** Visible text, entities decoded, whitespace collapsed. */
export function clean(s: string | undefined | null): string {
  if (!s) return "";
  return decodeEntities(s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/[ \s]+/g, " ")
    .trim();
}

export function textOf(el: HTMLElement | null | undefined): string {
  return el ? clean(el.innerHTML) : "";
}

export function abs(href: string | undefined | null, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(decodeEntities(href.trim()), base).toString();
  } catch {
    return undefined;
  }
}

/** og:image, then twitter:image, then a link rel=image_src. */
export function metaImage(doc: Doc, base: string): string | undefined {
  const pick = (sel: string, attr: string) => doc.querySelector(sel)?.getAttribute(attr);
  const src =
    pick('meta[property="og:image:secure_url"]', "content") ??
    pick('meta[property="og:image"]', "content") ??
    pick('meta[name="og:image"]', "content") ??
    pick('meta[name="twitter:image"]', "content") ??
    pick('meta[property="twitter:image"]', "content") ??
    pick('link[rel="image_src"]', "href");
  return abs(src, base);
}

export function metaContent(doc: Doc, name: string): string | undefined {
  const v = doc.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ?? doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
  return v ? clean(v) : undefined;
}

/** Every JSON-LD object on the page, @graph flattened. Broken blocks are skipped. */
export function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    const body = m[1]!.trim().replace(/^<!\[CDATA\[|\]\]>$/g, "");
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      try {
        // Some CMSs leave raw newlines inside strings.
        data = JSON.parse(body.replace(/[\r\n\t]+/g, " "));
      } catch {
        continue;
      }
    }
    const visit = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (Array.isArray(o["@graph"])) (o["@graph"] as unknown[]).forEach(visit);
        else out.push(o);
      }
    };
    visit(data);
  }
  return out;
}

export function typeIs(o: Record<string, unknown>, ...types: string[]): boolean {
  const t = o["@type"];
  const list = Array.isArray(t) ? t : [t];
  return list.some((x) => typeof x === "string" && types.some((want) => x === want || x.endsWith(want)));
}

/** A JSON-LD image field (string, ImageObject, or a list of either) to one URL. */
export function ldImage(v: unknown, base: string): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return abs(v, base);
  if (Array.isArray(v)) return ldImage(v[0], base);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return ldImage(o.url ?? o.contentUrl ?? o["@id"], base);
  }
  return undefined;
}

/** A best-effort title: strips " | Site name" tails and ALL-CAPS shouting is left as is. */
export function tidyTitle(s: string): string {
  return clean(s)
    .replace(/\s+[|–—-]\s+[^|–—-]*(?:official website|tickets?|sarasota|bradenton)[^|–—-]*$/i, "")
    .trim();
}
