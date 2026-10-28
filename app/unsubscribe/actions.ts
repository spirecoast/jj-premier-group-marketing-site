"use server";

import { z } from "zod";
import { UNSUBSCRIBE_PAGE_COPY } from "@/lib/newsletter/copy";
import { applyUnsubscribe as unsubscribe, verifyUnsubscribeTarget } from "@/lib/newsletter/service";

/**
 * The button on /unsubscribe. Two kinds of link reach it:
 *
 * - `s=<subscription id>`: the links in every email the site sends to a
 *   subscriber (lib/newsletter). The button stops that list, or everything.
 * - `id=<contact id>`: the older links signed over a contacts row, from
 *   before the site sent its own email. They stop everything, as before.
 * - `w=<watch id>`: a Street Watch email (lib/watch). The button stops that
 *   watch, every watch on the address, or everything.
 *
 * Stopping everything also sets contacts.unsubscribed_email on every row for
 * the address: nothing more is sent to it.
 */

const schema = z.object({
  kind: z.enum(["subscription", "contact", "watch"]),
  id: z.string().uuid(),
  sig: z.string().min(1),
  scope: z.enum(["tide", "encore", "watch", "watches", "all"]),
});

export type UnsubscribeState = {
  ok: boolean;
  scope?: "tide" | "encore" | "watch" | "watches" | "all";
  error?: string;
};

export async function applyUnsubscribe(_prev: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.invalid };
  const { kind, id, sig, scope } = parsed.data;
  if (!verifyUnsubscribeTarget({ kind, id, sig })) return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.invalid };
  try {
    // A newsletter link can't stop a Street Watch alone, and a Street Watch link can't stop one newsletter alone.
    const allowed = kind === "contact" ? "all" : kind === "watch" ? (scope === "watch" || scope === "watches" ? scope : "all") : scope === "watch" || scope === "watches" ? "all" : scope;
    const done = await unsubscribe({ kind, id, sig }, allowed, "link");
    return { ok: true, scope: done.list };
  } catch (err) {
    console.error("[unsubscribe] db update failed", err);
    return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.error };
  }
}
