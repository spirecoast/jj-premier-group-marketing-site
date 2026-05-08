import { and, asc, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { Activity, CheckCircle2, Flame, UserPlus2 } from "lucide-react";
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

const STAGE_LABEL: Record<(typeof STAGE_ORDER)[number], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  active: "Active",
  under_contract: "Under contract",
  closed: "Closed",
  nurture: "Nurture",
  lost: "Lost",
};

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
      .limit(8),
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
      .limit(8),
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
      .limit(8),
    db
      .select({
        id: events.id,
        eventType: events.eventType,
        contactId: events.contactId,
        occurredAt: events.occurredAt,
      })
      .from(events)
      .where(gte(events.occurredAt, since24h))
      .orderBy(desc(events.occurredAt))
      .limit(10),
  ]);

  const stageMap = new Map(stageCounts.map((s) => [s.stage ?? "new", s.count]));
  const totalLeads = [...stageMap.values()].reduce((a, b) => a + b, 0);
  const activePipeline =
    (stageMap.get("active") ?? 0) +
    (stageMap.get("under_contract") ?? 0) +
    (stageMap.get("qualified") ?? 0);

  const firstName = agent.name.split(" ")[0] ?? agent.name;

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto w-full">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="portal-h1 mb-1">Today</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {firstName}.
          </p>
        </div>
      </header>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="New (24h)" value={last24h[0]?.count ?? 0} />
        <Stat label="New (7d)" value={last7d[0]?.count ?? 0} />
        <Stat label="Active pipeline" value={activePipeline} />
        <Stat label="Total leads" value={totalLeads} />
      </div>

      {/* Two-column row: tasks + hot leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <Panel
          title="Your tasks"
          action={
            <Link
              href="/portal/tasks"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All →
            </Link>
          }
        >
          {myTasks.length === 0 ? (
            <Empty
              icon={<CheckCircle2 size={16} />}
              message="Nothing on your plate."
              hint="Failsafes auto-create tasks when leads go quiet."
            />
          ) : (
            <ul className="divide-y divide-border">
              {myTasks.map((t) => {
                const overdue =
                  t.dueAt !== null && t.dueAt.getTime() < Date.now();
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <PriorityDot priority={t.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
                        className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap hidden sm:inline"
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
        </Panel>

        <Panel title="Hot leads">
          {hotLeads.length === 0 ? (
            <Empty
              icon={<Flame size={16} />}
              message="No hot leads right now."
              hint="Engagement and recency drive temperature."
            />
          ) : (
            <ul className="divide-y divide-border">
              {hotLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-3 py-2.5">
                  <ScoreBadge
                    score={lead.score}
                    temperature={lead.temperature}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/portal/contacts/${lead.id}` as never}
                      className="text-sm font-medium text-foreground hover:text-brand truncate block"
                    >
                      {lead.fullName ?? lead.email ?? "—"}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {lead.sourceDetail ?? lead.source ?? "—"} ·{" "}
                      {lead.agentName ?? "unassigned"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelative(lead.lastTouchAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Pipeline */}
      <Panel title="Pipeline" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-border rounded-md overflow-hidden">
          {STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className="bg-surface px-3 py-3 min-h-[68px] flex flex-col"
            >
              <p className="portal-stat-label leading-tight">
                {STAGE_LABEL[stage]}
              </p>
              <p className="portal-stat-num text-foreground mt-auto">
                {stageMap.get(stage) ?? 0}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent leads */}
      <Panel
        title="Recent leads"
        action={
          <Link
            href="/portal/contacts"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        }
        className="mb-6"
      >
        {recentLeads.length === 0 ? (
          <Empty
            icon={<UserPlus2 size={16} />}
            message="No leads yet."
            hint="The contact form and newsletter feed this list."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <Th>Name</Th>
                  <Th>Score</Th>
                  <Th>Source</Th>
                  <Th>Owner</Th>
                  <Th className="text-right">Created</Th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors"
                  >
                    <Td>
                      <Link
                        href={`/portal/contacts/${lead.id}` as never}
                        className="text-foreground hover:text-brand font-medium"
                      >
                        {lead.fullName ?? lead.email ?? "—"}
                      </Link>
                    </Td>
                    <Td>
                      <ScoreBadge
                        score={lead.score}
                        temperature={lead.temperature}
                      />
                    </Td>
                    <Td className="text-muted-foreground">
                      {lead.sourceDetail ?? lead.source ?? "—"}
                    </Td>
                    <Td className="text-muted-foreground">
                      {lead.agentName ?? "—"}
                    </Td>
                    <Td className="text-muted-foreground text-right">
                      {formatRelative(lead.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Activity */}
      <Panel title="Activity (last 24h)">
        {recentActivity.length === 0 ? (
          <Empty
            icon={<Activity size={16} />}
            message="Quiet so far today."
            hint="Form submits, lifecycle changes, and notes show up here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((evt) => (
              <li
                key={evt.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">
                  {evt.eventType}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {formatRelative(evt.occurredAt)}
                </span>
                {evt.contactId ? (
                  <Link
                    href={`/portal/contacts/${evt.contactId}` as never}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ---------- presentation primitives ---------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-border rounded-md px-4 py-3">
      <p className="portal-stat-label">{label}</p>
      <p className="portal-stat-num text-foreground mt-2">{value}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-md ${className}`}
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="portal-h2">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Empty({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint?: string;
}) {
  return (
    <div className="px-3 py-8 text-center">
      <div className="mx-auto mb-2 size-8 rounded-full bg-surface-elevated flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-foreground font-medium">{message}</p>
      {hint ? (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 font-medium uppercase tracking-wider text-[10px] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
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
      ? "bg-danger/10 text-danger ring-danger/20"
      : temperature === "warm"
        ? "bg-warning/15 text-warning ring-warning/20"
        : "bg-surface-elevated text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ring-1 ring-inset ${palette}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string | null }) {
  const color =
    priority === "urgent"
      ? "bg-danger"
      : priority === "high"
        ? "bg-warning"
        : priority === "low"
          ? "bg-muted"
          : "bg-info";
  return (
    <span
      className={`inline-block size-2 rounded-full shrink-0 ${color}`}
      aria-label={`priority ${priority ?? "normal"}`}
    />
  );
}

