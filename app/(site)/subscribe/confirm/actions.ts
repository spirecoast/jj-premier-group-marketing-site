"use server";

import { confirmSubscription } from "@/lib/newsletter/service";

export type ConfirmState = { ok: boolean; state?: "confirmed" | "already" | "unsubscribed" | "invalid" | "off" | "error"; list?: "tide" | "encore" };

/** The button on /subscribe/confirm: records the opt-in and sends the welcome (lib/newsletter/service.ts). */
export async function confirmAction(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const t = formData.get("t");
  const result = await confirmSubscription(typeof t === "string" ? t : null);
  return result.ok ? { ok: true, state: result.state, list: result.list } : { ok: false, state: result.state };
}
