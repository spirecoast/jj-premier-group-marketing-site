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
 *
 * Stopping everything also sets contacts.unsubscribed_email on every row for
 * the address: nothing more is sent to it.
 */

const schema = z.object({
  kind: z.enum(["subscription", "contact"]),
  id: z.string().uuid(),
  sig: z.string().min(1),
  scope: z.enum(["tide", "encore", "all"]),
});

export type UnsubscribeState = {
  ok: boolean;
  scope?: "tide" | "encore" | "all";
  error?: string;
};

export async function applyUnsubscribe(_prev: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.invalid };
  const { kind, id, sig, scope } = parsed.data;
  if (!verifyUnsubscribeTarget({ kind, id, sig })) return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.invalid };
  try {
    const done = await unsubscribe({ kind, id, sig }, kind === "contact" ? "all" : scope, "link");
    return { ok: true, scope: done.list };
  } catch (err) {
    console.error("[unsubscribe] db update failed", err);
    return { ok: false, error: UNSUBSCRIBE_PAGE_COPY.error };
  }
}
