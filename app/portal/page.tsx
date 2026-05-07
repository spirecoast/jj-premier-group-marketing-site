import { and, asc, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts, events, tasks } from "@/lib/db/schema";
import { formatRelative } from "@/lib/format";
import { CompleteTaskButton } from "./tasks/complete-button";

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

  const [
    stageCounts,
    last24h,
    last7d,
    hotLeads,
    myTasks,
    recentLeads,
    recentActivity,
  ] = await Promise.all([
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
        score: contacts.score,
        temperature: contacts.temperature,
        sourceDetail: contacts.sourceDetail,
        source: contacts.source,
        lastTouchAt: contacts.lastTouchAt,
        agentName: agents.name,
      })
      .from(contacts)
      .leftJoin(agents, eq(contacts.primaryAgentId, agents.id))
      .where(eq(contacts.temperature, "hot"))
      .orderBy(desc(contacts.score), desc(contacts.lastTouchAt))
      .limit(10),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        priority: tasks.priority,
        source: tasks.source,
        failsafeType: tasks.failsafeType,
        dueAt: tasks.dueAt,
        contactId: tasks.contactId,
        contactName: contacts.fullName,
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .where(
        and(
          or(eq(tasks.agentId, agent.id), isNull(tasks.agentId)),
          isNull(tasks.completedAt),
        ),
      )
      .orderBy(asc(tasks.dueAt))
      .limit(10),
    db
      .select({
        id: contacts.id,
        fullName: contacts.fullName,
        email: contacts.email,
        source: contacts.source,
        sourceDetail: contacts.sourceDetail,
        score: contacts.score,
        temperature: contacts.temperature,
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
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-heading">Your tasks</h2>
            <Link
              href="/portal/tasks"
              className="text-sm text-brand hover:text-brand-hover underline"
            >
              All tasks →
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState message="Nothing on your plate. Failsafes auto-create tasks when leads go quiet." />
          ) : (
            <ul className="bg-surface border border-border rounded-md divide-y divide-border">
              {myTasks.map((t) => {
                const overdue =
                  t.dueAt !== null && t.dueAt.getTime() < Date.now();
                return (
                  <li
                    key={t.id}
                    className="px-4 py-3 flex items-center gap-4"
                  >
                    <span
                      className={`inline-block size-2 rounded-full shrink-0 ${
                        t.priority === "urgent"
                          ? "bg-danger"
                          : t.priority === "high"
                            ? "bg-warning"
                            : "bg-info"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.source === "failsafe"
                          ? `failsafe · ${t.failsafeType}`
                          : t.source ?? "manual"}
                        {t.dueAt
                          ? ` · ${overdue ? "overdue" : "due"} ${formatRelative(t.dueAt)}`
                          : null}
                      </p>
                    </div>
                    {t.contactId ? (
                      <Link
                        href={`/portal/contacts/${t.contactId}` as never}
                        className="text-xs text-brand hover:text-brand-hover whitespace-nowrap"
                      >
                        {t.contactName ?? "Contact"}
                      </Link>
                    ) : null}
                    <CompleteTaskButton taskId={t.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-heading mb-4">Hot leads</h2>
          {hotLeads.length === 0 ? (
            <EmptyState message="No hot leads right now. Engagement and recency drive temperature." />
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-eyebrow text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Owner</th>
                    <th className="text-left px-4 py-3">Last touch</th>
                  </tr>
                </thead>
                <tbody>
                  {hotLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          href={`/portal/contacts/${lead.id}` as never}
                          className="text-brand hover:text-brand-hover"
                        >
                          {lead.fullName ?? lead.email ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge
                          score={lead.score}
                          temperature={lead.temperature}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.sourceDetail ?? lead.source ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.agentName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRelative(lead.lastTouchAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
                    <th className="text-left px-4 py-3">Score</th>
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
                      <td className="px-4 py-3">
                        <ScoreBadge
                          score={lead.score}
                          temperature={lead.temperature}
                        />
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

export function ScoreBadge({
  score,
  temperature,
}: {
  score: number;
  temperature: string | null;
}) {
  const palette =
    temperature === "hot"
      ? "bg-danger/10 text-danger"
      : temperature === "warm"
        ? "bg-warning/15 text-warning"
        : "bg-surface-elevated text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-sm text-xs font-mono ${palette}`}
    >
      <span aria-hidden="true">●</span>
      {score}
    </span>
  );
}
