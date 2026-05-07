import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";

/**
 * Lead scoring v1 per ARCHITECTURE.md §10.
 *
 * Scoring is intentionally simple in Phase 2 — recency, frequency, depth, and
 * stated intent. Phase 7's AI signals (urgency / specificity / financial
 * readiness from interaction transcripts) plug in as a fifth dimension when
 * the AI agents land. Score caps at 90 here (max-100 once AI signals add 10).
 *
 * Recompute is called from write paths (form submit, note add, stage change)
 * rather than on read, so the score is fresh by the time it surfaces in the
 * dashboard. Failsafes can also trigger recomputes when stale.
 */

export type Temperature = "hot" | "warm" | "cold";

const HOT = 75;
const WARM = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

function bucket(score: number): Temperature {
  if (score >= HOT) return "hot";
  if (score >= WARM) return "warm";
  return "cold";
}

export async function scoreContact(
  contactId: string,
): Promise<{ score: number; temperature: Temperature }> {
  const db = getDb();

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);
  if (!contact) {
    return { score: 0, temperature: "cold" };
  }

  const cutoff = new Date(Date.now() - 30 * DAY_MS);
  const recent = await db
    .select({ eventType: events.eventType })
    .from(events)
    .where(and(eq(events.contactId, contactId), gte(events.occurredAt, cutoff)));

  let score = 0;

  // 1) Recency (max 30) — distance from last_touch_at.
  if (contact.lastTouchAt) {
    const days = (Date.now() - contact.lastTouchAt.getTime()) / DAY_MS;
    if (days < 1) score += 30;
    else if (days < 7) score += 20;
    else if (days < 30) score += 10;
  }

  // 2) Frequency (max 20) — events in last 30 days.
  score += Math.min(recent.length * 3, 20);

  // 3) Engagement depth (max 25) — different signals contribute.
  const eventTypes = new Set(recent.map((e) => e.eventType));
  if (eventTypes.has("form_submit")) score += 10;
  if (eventTypes.has("newsletter_signup")) score += 5;
  if (eventTypes.has("note")) score += 5; // agent has actually engaged
  if (eventTypes.has("lifecycle_stage_changed")) score += 5;
  // Phase 3+: 'saved_listing', 'showing_scheduled', 'tool_used' add up to 25.

  // 4) Stated intent (max 15).
  if (contact.consentEmail) score += 5;
  // Phase 4: pre_approved → +15. timeframe='0-3 months' → +10.
  // Phase 7: AI signals → +10.

  // Penalties — explicit opt-out cools the lead immediately.
  if (contact.unsubscribedEmail || contact.doNotCall) {
    score = Math.max(0, score - 30);
  }

  score = Math.min(score, 100);
  return { score, temperature: bucket(score) };
}

/**
 * Recompute and persist the score on the contact row. Best-effort: failures
 * log but don't throw, so a scoring bug never breaks an upstream write.
 */
export async function updateScore(contactId: string): Promise<void> {
  try {
    const result = await scoreContact(contactId);
    const db = getDb();
    await db
      .update(contacts)
      .set({
        score: result.score,
        temperature: result.temperature,
        lastScoreUpdate: new Date(),
      })
      .where(eq(contacts.id, contactId));
  } catch (err) {
    console.error("[scoring] updateScore failed", { contactId, err });
  }
}
