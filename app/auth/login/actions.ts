"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required").max(320),
});

export type LoginState = {
  ok: boolean;
  error?: string;
  email?: string;
};

export const initialLoginState: LoginState = { ok: false };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/portal`,
      // Don't auto-create accounts for unknown emails — only existing agents
      // (whose email is already in `agents`) should be able to log in.
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[auth] magic link send failed", error);
    return {
      ok: false,
      error: "Couldn't send the link. Try again in a moment.",
      email,
    };
  }

  return { ok: true, email };
}
