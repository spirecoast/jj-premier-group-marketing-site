/**
 * Shared by the inline script that hides a tool while it reads its URL
 * (components/url-pending.tsx, a server component) and the hook that lets go
 * (lib/url-state.ts, client code), so it lives in a plain module.
 */
export const URL_PENDING_STYLE_ID = "url-pending";
