"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts, events, tasks } from "@/lib/db/schema";

const ADMIN_EMAILS = (process.env.DEMO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin() {
  const agent = await requireAgent();
  const isAdmin =
    ADMIN_EMAILS.length === 0
      ? true // no allowlist set → any active agent
      : ADMIN_EMAILS.includes(agent.email.toLowerCase());
  if (!isAdmin) throw new Error("forbidden");
  return agent;
}

const FIRSTS = [
  "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Ashley",
  "Christopher", "Amanda", "Daniel", "Lauren", "James", "Stephanie",
  "Matthew", "Jennifer", "Andrew", "Megan", "Brian", "Rachel", "Kevin",
] as const;

const LASTS = [
  "Anderson", "Thompson", "Mitchell", "Hayes", "Martinez", "Robinson",
  "Clark", "Lewis", "Walker", "Young", "Allen", "King", "Wright",
  "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Roberts",
] as const;

type Source = {
  source: string;
  source_detail: string;
};
const SOURCES: Source[] = [
  { source: "organic", source_detail: "contact_form" },
  { source: "organic", source_detail: "newsletter" },
  { source: "google", source_detail: "paid_search" },
  { source: "facebook", source_detail: "paid_social" },
  { source: "referral", source_detail: "past_client" },
];

type Stage =
  | "new" | "contacted" | "qualified" | "active"
  | "under_contract" | "closed" | "nurture";

const STAGE_DISTRIBUTION: Stage[] = [
  // Skewed toward early-pipeline so the dashboard demonstrates
  // the lead-management value prop.
  "new", "new", "new", "new", "new",
  "contacted", "contacted", "contacted", "contacted",
  "qualified", "qualified", "qualified",
  "active", "active",
  "under_contract", "under_contract",
  "closed",
  "nurture", "nurture", "nurture",
];

const NOTE_TEMPLATES = [
  "Left a voicemail. Will follow up tomorrow.",
  "Quick chat — they're 2-3 months out, watching inventory.",
  "Sent comps for the area. Asked them to reply with thoughts.",
  "Tour scheduled for Saturday afternoon.",
  "Pre-approved for $625k. Looking in the LWR / Esplanade range.",
  "Inspection came back clean. Moving toward financing milestone.",
  "Followed up after open house. Strong interest, narrowing options.",
];

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedDemoData(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorized." };
  }

  const db = getDb();
  const allAgents = await db.select({ id: agents.id }).from(agents);
  if (allAgents.length === 0) {
    return { ok: false, error: "No agents seeded yet." };
  }

  const rng = mulberry32(42);
  const now = Date.now();
  const created: string[] = [];

  for (let i = 0; i < 20; i++) {
    const first = pick(FIRSTS, rng);
    const last = pick(LASTS, rng);
    const fullName = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${i}@demo.example`;
    const phone = `(941) 555-${String(1000 + Math.floor(rng() * 8999)).padStart(4, "0")}`;
    const src = pick(SOURCES, rng);
    const stage = STAGE_DISTRIBUTION[i % STAGE_DISTRIBUTION.length]!;
    const agentId = pick(allAgents, rng).id;
    const consent = rng() > 0.25;

    // Backdate created_at across the last 14 days so sparklines + recency curves
    // have a real shape, not a flat-today spike.
    const ageDays = Math.floor(rng() * 14);
    const ageMs = ageDays * 86400000 + Math.floor(rng() * 86400000);
    const createdAt = new Date(now - ageMs);

    // Last touch: somewhere between created_at and now
    const lastTouchAt = new Date(createdAt.getTime() + Math.floor(rng() * (now - createdAt.getTime())));

    // Score: hotter for active/under-contract, cold for closed/nurture
    let score = 0;
    if (stage === "active" || stage === "under_contract") score = 70 + Math.floor(rng() * 30);
    else if (stage === "qualified") score = 50 + Math.floor(rng() * 25);
    else if (stage === "contacted") score = 30 + Math.floor(rng() * 25);
    else if (stage === "new") score = 10 + Math.floor(rng() * 35);
    else if (stage === "closed") score = 60 + Math.floor(rng() * 20);
    else score = Math.floor(rng() * 25);
    const temperature = score >= 75 ? "hot" : score >= 40 ? "warm" : "cold";

    const [row] = await db
      .insert(contacts)
      .values({
        primaryAgentId: agentId,
        fullName,
        firstName: first,
        lastName: last,
        email,
        phone,
        type: ["lead"],
        lifecycleStage: stage,
        source: src.source,
        sourceDetail: src.source_detail,
        utm: { demo_seed: true },
        consentEmail: consent,
        consentEmailAt: consent ? createdAt : null,
        score,
        temperature,
        lastScoreUpdate: lastTouchAt,
        createdAt,
        firstTouchAt: createdAt,
        lastTouchAt,
      })
      .returning({ id: contacts.id });
    created.push(row.id);

    // Form-submit / signup event at create time
    await db.insert(events).values({
      eventType: src.source_detail === "newsletter" ? "newsletter_signup" : "form_submit",
      contactId: row.id,
      payload: { demo: true, source_detail: src.source_detail },
      occurredAt: createdAt,
    });

    // Lifecycle change event if not 'new'
    if (stage !== "new") {
      await db.insert(events).values({
        eventType: "lifecycle_stage_changed",
        contactId: row.id,
        agentId,
        payload: { stage, by: agentId, demo: true },
        occurredAt: lastTouchAt,
      });
    }

    // Drop a note on ~half
    if (rng() > 0.5) {
      await db.insert(events).values({
        eventType: "note",
        contactId: row.id,
        agentId,
        payload: { note: pick(NOTE_TEMPLATES, rng), by: agentId, demo: true },
        occurredAt: lastTouchAt,
      });
    }

    // Open task on ~25% (so /portal/tasks shows something)
    if (rng() > 0.75) {
      await db.insert(tasks).values({
        agentId,
        contactId: row.id,
        title: `Follow up: ${fullName}`,
        description: pick(NOTE_TEMPLATES, rng),
        priority: rng() > 0.7 ? "high" : "normal",
        source: "manual",
        dueAt: new Date(now + Math.floor(rng() * 3 * 86400000)),
      });
    }
  }

  revalidatePath("/portal", "layout");
  return { ok: true, count: created.length };
}

export async function wipeDemoData(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorized." };
  }

  const db = getDb();
  // Cascade deletes events + tasks via FK; we only need to delete contacts.
  const result = await db
    .delete(contacts)
    .where(sql`utm->>'demo_seed' = 'true'`)
    .returning({ id: contacts.id });

  revalidatePath("/portal", "layout");
  return { ok: true, count: result.length };
}
