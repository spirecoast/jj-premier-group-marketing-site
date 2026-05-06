import { desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts, events } from "@/lib/db/schema";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = {
  title: "Today",
  robots: { index: false, follow: false },
};

const STAGE_ORDER = [
  "new",
  "contacted",
  "qualified",
  "active",
  "under_contract",
  "closed",
  "nurture",
  "lost",
] as const;

export default async function PortalToday() {
  const agent = await requireAgent();
  const db = getDb();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [stageCounts, last24h, last7d, recentLeads, recentActivity] =
    await Promise.all([
      db
        .select({
          stage: contacts.lifecycleStage,
          count: sql<number>`count(*)::int`,
        })
        .from(contacts)
        .groupBy(contacts.lifecycleStage),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(gte(contacts.createdAt, since24h)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(gte(contacts.createdAt, since7d)),
      db
        .select({
          id: contacts.id,
          fullName: contacts.fullName,
          email: contacts.email,
          source: contacts.source,
          sourceDetail: contacts.sourceDetail,
          createdAt: contacts.createdAt,
          agentName: agents.name,
        })
        .from(contacts)
        .leftJoin(agents, eq(contacts.primaryAgentId, agents.id))
        .orderBy(desc(contacts.createdAt))
        .limit(10),
      db
        .select({
          id: events.id,
          eventType: events.eventType,
          contactId: events.contactId,
          payload: events.payload,
          occurredAt: events.occurredAt,
        })
        .from(events)
        .where(gte(events.occurredAt, since24h))
        .orderBy(desc(events.occurredAt))
        .limit(20),
    ]);

  const stageMap = new Map(stageCounts.map((s) => [s.stage ?? "new", s.count]));

  return (
    <section className="px-6 lg:px-12 py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <header>
          <p className="text-eyebrow text-muted-foreground mb-3">Today</p>
          <h1 className="text-section">
            Welcome, {agent.name.split(" ")[0]}.
          </h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="New (24h)" value={last24h[0]?.count ?? 0} />
          <Stat label="New (7d)" value={last7d[0]?.count ?? 0} />
          <Stat
            label="Active pipeline"
            value={
              (stageMap.get("active") ?? 0) +
              (stageMap.get("under_contract") ?? 0) +
              (stageMap.get("qualified") ?? 0)
            }
          />
          <Stat
            label="Total leads"
            value={[...stageMap.values()].reduce((a, b) => a + b, 0)}
          />
        </div>

        <section>
          <h2 className="text-heading mb-4">Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {STAGE_ORDER.map((stage) => (
              <div
                key={stage}
                className="bg-surface border border-border rounded-md p-3"
              >
                <p className="text-eyebrow text-muted-foreground mb-2">
                  {stage.replace(/_/g, " ")}
                </p>
                <p className="text-2xl font-display">
                  {stageMap.get(stage) ?? 0}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-heading">Recent leads</h2>
            <Link
              href="/portal/contacts"
              className="text-sm text-brand hover:text-brand-hover underline"
            >
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState message="No leads yet. The contact form and newsletter feed this list." />
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-eyebrow text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Owner</th>
                    <th className="text-left px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          href={`/portal/contacts/${lead.id}` as never}
                          className="text-brand hover:text-brand-hover"
                        >
                          {lead.fullName ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.sourceDetail ?? lead.source ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.agentName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRelative(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-heading mb-4">Activity (last 24h)</h2>
          {recentActivity.length === 0 ? (
            <EmptyState message="Nothing in the last 24 hours." />
          ) : (
            <ul className="bg-surface border border-border rounded-md divide-y divide-border">
              {recentActivity.map((evt) => (
                <li key={evt.id} className="px-4 py-3 text-sm flex gap-4">
                  <span className="text-eyebrow text-muted-foreground whitespace-nowrap w-24">
                    {formatRelative(evt.occurredAt)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {evt.eventType}
                  </span>
                  {evt.contactId ? (
                    <Link
                      href={`/portal/contacts/${evt.contactId}` as never}
                      className="text-brand hover:text-brand-hover ml-auto text-xs"
                    >
                      View contact
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <p className="text-eyebrow text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-display">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface border border-border rounded-md p-8 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
