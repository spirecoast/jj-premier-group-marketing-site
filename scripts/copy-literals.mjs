/**
 * The words a reader can see, pulled out of the site's source files without
 * running them: string literals ("…", '…', `…`) and JSX text. Comments,
 * import paths, class names and code are left out. Used by
 * scripts/check-copy.mjs to run the voice rules (lib/voice.ts) over every
 * page, component and content file, including the ones whose strings it
 * can't import under plain Node.
 *
 * Rough by design: it's a lexer, not a parser. A string that is code (a URL,
 * a class list, a key) is skipped by the filters in `looksLikeCopy`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Where the site's visible words live. lib/search is skipped: it's checked through its own copy file. lib/encore/collect is the collector's parsing code (patterns, not words anyone reads). */
export const COPY_ROOTS = ["app", "components", "lib"];
const SKIP = [/\.test\.tsx?$/, /\.d\.ts$/, /(^|\/)lib\/search\//, /(^|\/)lib\/encore\/collect\//, /(^|\/)node_modules\//, /\/fixtures?\.ts$/, /(^|\/)app\/api\//, /(^|\/)lib\/voice\.ts$/, /(^|\/)lib\/questionnaire\/questions\.ts$/];

export function sourceFiles(root, dirs = COPY_ROOTS) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const rel = path.relative(root, p).split(path.sep).join("/");
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(name) && !SKIP.some((r) => r.test(rel))) out.push(rel);
    }
  };
  for (const d of dirs) walk(path.join(root, d));
  return out.sort();
}

/** Strip comments, keeping line numbers, without touching strings. */
function stripComments(src) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += n ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const chunk = src.slice(i, end < 0 ? src.length : end + 2);
      out += chunk.replace(/[^\n]/g, " ");
      i += chunk.length;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    out += c;
    i += 1;
  }
  return out;
}

/** Words a reader would see: at least three words with letters, not a path, class list or identifier. */
export function looksLikeCopy(s) {
  const t = s.trim();
  if (t.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length < 3) return false;
  if (/^(https?:|\/|\.\/|@\/|#)/.test(t)) return false;
  // Tailwind class lists: mostly hyphenated or colon-prefixed tokens.
  const tokens = t.split(/\s+/);
  if (tokens.filter((w) => /[-:[\]/]/.test(w) && !/[.,;!?’']$/.test(w)).length / tokens.length > 0.6) return false;
  return true;
}

/** Every string literal and JSX text run in a file, with its line. */
export function literals(src) {
  const code = stripComments(src);
  const out = [];
  const lineAt = (idx) => code.slice(0, idx).split("\n").length;
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(code))) {
    const text = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\$\{[^}]*\}/g, "X").replace(/\\u2019/g, "’").replace(/\\(.)/g, "$1");
    if (looksLikeCopy(text)) out.push({ line: lineAt(m.index), text });
  }
  // JSX text: between a closing > and the next <, outside braces.
  const jsx = />([^<>{}]*[A-Za-z][^<>{}]*)</g;
  while ((m = jsx.exec(code))) {
    const text = m[1].replace(/\s+/g, " ").trim();
    if (looksLikeCopy(text) && !/[=;(){}]/.test(text)) out.push({ line: lineAt(m.index), text });
  }
  return out;
}

export function siteLiterals(root) {
  return sourceFiles(root).flatMap((file) => literals(readFileSync(path.join(root, file), "utf8")).map((l) => ({ where: `${file}:${l.line}`, text: l.text })));
}
