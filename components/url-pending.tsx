import { URL_PENDING_STYLE_ID } from "@/lib/url-island";

/**
 * The tool pages are static, so the server renders each tool in its default
 * state and the browser applies the address's state after hydration
 * (lib/url-state.ts). When the address carries any of `keys` (a shared view,
 * a plan link), this hides the tool's island (`data-url-island`) until then,
 * so a visitor never sees the default view swap for the one they were sent
 * (or, with `draftKey`, for the question they had reached).
 * It runs before the island is parsed, needs no React, and lets go after four
 * seconds whatever happens, so a failed script never leaves the tool hidden.
 * A visit without those keys (and every crawler) sees the server's render at once.
 */
export function UrlPending({ keys, draftKey }: { keys: readonly string[]; /** The localStorage key of answers in progress, which bring a returning visitor back to their question. */ draftKey?: string }) {
  const css = `[data-url-island]{opacity:0;animation:url-pending-release 0s 4s forwards}@keyframes url-pending-release{to{opacity:1}}`;
  const test = `${JSON.stringify(keys)}.some(function(k){return s.has(k)})${draftKey ? `||!!localStorage.getItem(${JSON.stringify(draftKey)})` : ""}`;
  const js = `try{var s=new URLSearchParams(location.search);if((${test})&&!document.getElementById(${JSON.stringify(URL_PENDING_STYLE_ID)})){var e=document.createElement("style");e.id=${JSON.stringify(
    URL_PENDING_STYLE_ID,
  )};e.textContent=${JSON.stringify(css)};document.head.appendChild(e)}}catch(_){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
