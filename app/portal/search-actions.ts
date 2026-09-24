"use server";

import { ilike, or, sql } from "drizzle-orm";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { contacts } from "@/lib/db/schema";

export type ContactHit = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string | null;
  score: number;
};

/**
 * Cmd+K contact search — case-insensitive ILIKE across name / email / phone.
 * Caps at 8 results to keep the palette snappy and the JSON payload small.
 */
export async function searchContacts(query: string): Promise<ContactHit[]> {
  await requireAgent();
  const q = query.trim();
  if (q.length === 0) return [];

  const db = getDb();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  return await db
    .select({
      id: contacts.id,
      fullName: contacts.fullName,
      email: contacts.email,
      phone: contacts.phone,
      lifecycleStage: contacts.lifecycleStage,
      score: contacts.score,
    })
    .from(contacts)
    .where(
      or(
        ilike(contacts.fullName, pattern),
        ilike(contacts.email, pattern),
        ilike(contacts.phone, pattern),
      ),
    )
    .orderBy(sql`${contacts.score} DESC NULLS LAST, ${contacts.lastTouchAt} DESC NULLS LAST`)
    .limit(8);
}
