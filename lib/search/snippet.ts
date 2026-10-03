import { HIGHLIGHT } from "./types";

/**
 * Snippet helpers shared by the server and the results page. No Node imports.
 */

/** Cut plain text to about `chars` characters at a word end, with an ellipsis when it was cut. Markers survive. */
export function excerpt(text: string, chars = 220): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= chars) return t;
  const cut = t.slice(0, chars);
  const space = cut.lastIndexOf(" ");
  let out = (space > chars * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, "");
  // Never leave a highlight open at the cut.
  if (out.lastIndexOf(HIGHLIGHT.start) > out.lastIndexOf(HIGHLIGHT.stop)) out += HIGHLIGHT.stop;
  return `${out}…`;
}

/**
 * Tidy a snippet from the database: ts_headline returns fragments with no
 * ellipsis at either end, the plain branch the first 280 characters. The
 * reader gets a clean excerpt that says where it was cut: a fragment that
 * starts mid-sentence (a lowercase first letter) gets a leading ellipsis.
 */
export function tidySnippet(snippet: string): string {
  const s = snippet.replace(/\s+/g, " ").trim();
  if (!s) return "";
  const first = s.replaceAll(HIGHLIGHT.start, "").replaceAll(HIGHLIGHT.stop, "").charAt(0);
  const trimmed = excerpt(s, 240);
  return /[a-z]/.test(first) ? `…${trimmed}` : trimmed;
}

/** A snippet split into plain and highlighted runs, for <mark>. Unbalanced markers are dropped. */
export function snippetParts(snippet: string): { text: string; mark: boolean }[] {
  const parts: { text: string; mark: boolean }[] = [];
  let mark = false;
  let buf = "";
  const push = () => {
    if (buf) {
      const last = parts[parts.length - 1];
      if (last && last.mark === mark) last.text += buf;
      else parts.push({ text: buf, mark });
    }
    buf = "";
  };
  for (const ch of snippet) {
    if (ch === HIGHLIGHT.start) {
      push();
      mark = true;
    } else if (ch === HIGHLIGHT.stop) {
      push();
      mark = false;
    } else buf += ch;
  }
  push();
  return parts;
}
