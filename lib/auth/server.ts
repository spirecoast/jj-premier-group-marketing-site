import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { agents, type Agent } from "@/lib/db/schema";

/**
 * Returns the agent row for the currently signed-in Clerk user, or null.
 *
 * Two-step lookup, idempotent:
 *   1. Find agent by clerk_user_id — fast path for repeat visits.
 *   2. If unset, fall back to email match against Clerk's primary email.
 *      On match, write back clerk_user_id so step 1 hits next time.
 *
 * The email-match fallback is how invitations work: admin adds an `agents`
 * row with the team member's email; team member signs up via Clerk with that
 * same email; first portal visit links the two records.
 */
export async function getCurrentAgent(): Promise<Agent | null> {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return null;
  }
  if (!userId) return null;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return null;
  }

  try {
    const byClerkId = await db
      .select()
      .from(agents)
      .where(eq(agents.clerkUserId, userId))
      .limit(1);
    if (byClerkId[0]) return byClerkId[0];
  } catch (err) {
    console.error("[auth] agent lookup by clerk_user_id failed", err);
    return null;
  }

  // Fallback: link by email if this is the first portal visit.
  let email: string | null = null;
  try {
    const user = await currentUser();
    email = user?.emailAddresses[0]?.emailAddress?.toLowerCase() ?? null;
  } catch (err) {
    console.error("[auth] currentUser fetch failed", err);
    return null;
  }
  if (!email) return null;

  try {
    const byEmail = await db
      .select()
      .from(agents)
      .where(eq(agents.email, email))
      .limit(1);
    if (!byEmail[0]) return null;

    const [linked] = await db
      .update(agents)
      .set({ clerkUserId: userId })
      .where(eq(agents.id, byEmail[0].id))
      .returning();
    return linked ?? null;
  } catch (err) {
    console.error("[auth] agent link-by-email failed", err);
    return null;
  }
}

/**
 * Use in any /portal/* page or layout. Redirects to /auth/login if no Clerk
 * session, or /auth/no-access if the authenticated user isn't on the team.
 */
export async function requireAgent(): Promise<Agent> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/login" as never);
  }

  const agent = await getCurrentAgent();
  if (!agent || !agent.active) {
    redirect("/auth/no-access");
  }
  return agent;
}
