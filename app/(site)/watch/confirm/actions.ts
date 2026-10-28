"use server";

import { confirmWatch } from "@/lib/watch/service";

export type WatchConfirmState = { ok: boolean; state?: "confirmed" | "already" | "unsubscribed" | "invalid" | "off" | "error"; label?: string; path?: string };

/** The button on /watch/confirm: records the opt-in (lib/watch/service.ts). */
export async function confirmWatchAction(_prev: WatchConfirmState, formData: FormData): Promise<WatchConfirmState> {
  const t = formData.get("t");
  const result = await confirmWatch(typeof t === "string" ? t : null);
  return result.ok ? { ok: true, state: result.state, label: result.label, path: result.path } : { ok: false, state: result.state };
}
