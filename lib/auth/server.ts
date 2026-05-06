import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { agents, type Agent } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated Supabase user, or null. Use in pages that may or
 * may not be authenticated. Returns null on any failure (e.g. unset env in
 * dev) so consuming pages don't crash.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns the authenticated user's agent row. Returns null if not authenticated
 * or if the user has no matching agents row (i.e., not on the team).
 * Tolerates missing DB env in dev — returns null rather than throwing.
 */
export async function getCurrentAgent(): Promise<Agent | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(agents)
      .where(eq(agents.authUserId, user.id))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Use in /portal/* pages. Redirects to /auth/login if no agent session, or to
 * /auth/no-access if the authenticated user isn't on the team.
 */
export async function requireAgent(): Promise<Agent> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.authUserId, user.id))
    .limit(1);

  if (!rows[0]) {
    redirect("/auth/no-access");
  }
  if (!rows[0].active) {
    redirect("/auth/no-access");
  }
  return rows[0];
}

/**
 * Lazily link an authenticated user to their agents row by email match.
 * Called from the auth callback — supports the "invite by adding agents row,
 * agent later signs up with magic link to the same email" flow.
 */
export async function linkAuthUserToAgent(args: {
  authUserId: string;
  email: string;
}): Promise<Agent | null> {
  const db = getDb();

  const existing = await db
    .select()
    .from(agents)
    .where(eq(agents.authUserId, args.authUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const byEmail = await db
    .select()
    .from(agents)
    .where(eq(agents.email, args.email.toLowerCase()))
    .limit(1);
  if (!byEmail[0]) return null;

  const [linked] = await db
    .update(agents)
    .set({ authUserId: args.authUserId })
    .where(eq(agents.id, byEmail[0].id))
    .returning();
  return linked;
}
