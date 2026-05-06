import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents, contacts, leadRoutingRules } from "@/lib/db/schema";

/**
 * Lead routing per ARCHITECTURE.md §10.
 *
 * Resolution order (first match wins):
 *   1. Existing relationship — if a prior contact with the same email already
 *      has a primary_agent_id, the new contact inherits it.
 *   2. Rules engine — first lead_routing_rules row whose match_conditions
 *      satisfies the facts, ordered by priority asc.
 *   3. Fallback — oldest active agent (deterministic).
 *
 * Returns null only if no agents exist at all.
 */

export type MatchConditions = {
  source?: string | string[];
  source_detail?: string | string[];
};

export type LeadFacts = {
  email?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
};

function valueMatches(
  rule: string | string[] | undefined,
  fact: string | null | undefined,
): boolean {
  if (rule === undefined) return true;
  if (fact == null) return false;
  return Array.isArray(rule) ? rule.includes(fact) : rule === fact;
}

function conditionsMatch(
  conditions: MatchConditions,
  facts: LeadFacts,
): boolean {
  return (
    valueMatches(conditions.source, facts.source) &&
    valueMatches(conditions.source_detail, facts.sourceDetail)
  );
}

export async function routeLead(facts: LeadFacts): Promise<string | null> {
  const db = getDb();

  if (facts.email) {
    const existing = await db
      .select({ agentId: contacts.primaryAgentId })
      .from(contacts)
      .where(
        and(
          eq(contacts.email, facts.email.toLowerCase()),
          isNotNull(contacts.primaryAgentId),
        ),
      )
      .orderBy(desc(contacts.createdAt))
      .limit(1);
    if (existing[0]?.agentId) return existing[0].agentId;
  }

  const rules = await db
    .select({
      matchConditions: leadRoutingRules.matchConditions,
      agentId: leadRoutingRules.agentId,
    })
    .from(leadRoutingRules)
    .where(eq(leadRoutingRules.active, true))
    .orderBy(asc(leadRoutingRules.priority));

  for (const rule of rules) {
    if (conditionsMatch(rule.matchConditions as MatchConditions, facts)) {
      return rule.agentId;
    }
  }

  const fallback = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.active, true))
    .orderBy(asc(agents.createdAt))
    .limit(1);

  return fallback[0]?.id ?? null;
}
