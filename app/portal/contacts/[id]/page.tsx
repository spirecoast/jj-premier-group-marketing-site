import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts, events, tasks } from "@/lib/db/schema";
import { formatDateTime, formatRelative } from "@/lib/format";
import { CompleteTaskButton } from "@/app/portal/tasks/complete-button";
import { ScoreBadge } from "@/app/portal/page";
import { NoteForm, StageEditor } from "./edit-controls";
import { NewTaskForm } from "./new-task-form";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: false },
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function ContactDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAgent();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const db = getDb();
  const [row] = await db
    .select({
      contact: contacts,
      agent: agents,
    })
    .from(contacts)
    .leftJoin(agents, eq(contacts.primaryAgentId, agents.id))
    .where(eq(contacts.id, id))
    .limit(1);

  if (!row) notFound();

  const [activity, openTasks] = await Promise.all([
    db
      .select()
      .from(events)
      .where(eq(events.contactId, id))
      .orderBy(desc(events.occurredAt))
      .limit(100),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        source: tasks.source,
        failsafeType: tasks.failsafeType,
        dueAt: tasks.dueAt,
      })
      .from(tasks)
      .where(and(eq(tasks.contactId, id), isNull(tasks.completedAt)))
      .orderBy(asc(tasks.dueAt)),
  ]);

  const c = row.contact;
  const displayName = c.fullName ?? c.email ?? "Unnamed contact";

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1200px] mx-auto w-full">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <Link
          href="/portal/contacts"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
        >
          <span>←</span> All contacts
        </Link>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="portal-h1 truncate">{displayName}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1.5 items-center">
              <ScoreBadge score={c.score} temperature={c.temperature} />
              {c.email ? <span>{c.email}</span> : null}
              {c.phone ? <span>· {c.phone}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StageEditor contactId={c.id} currentStage={c.lifecycleStage} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card title="Identity" className="lg:col-span-1">
          <DL
            items={[
              ["Name", c.fullName ?? "—"],
              ["Email", c.email ?? "—"],
              ["Phone", c.phone ?? "—"],
              ["Preferred", c.preferredChannel ?? "—"],
              ["Type", (c.type ?? []).join(", ") || "—"],
            ]}
          />
        </Card>

        <Card title="Pipeline" className="lg:col-span-1">
          <DL
            items={[
              ["Source", c.sourceDetail ?? c.source ?? "—"],
              ["Owner", row.agent?.name ?? "(unassigned)"],
              ["First touch", formatDateTime(c.firstTouchAt)],
              ["Last touch", formatDateTime(c.lastTouchAt)],
              ["Created", formatDateTime(c.createdAt)],
            ]}
          />
        </Card>

        <Card title="Consent" className="lg:col-span-1">
          <DL
            items={[
              [
                "Email",
                c.consentEmail
                  ? `opted in ${formatDateTime(c.consentEmailAt)}`
                  : "not opted in",
              ],
              [
                "SMS",
                c.consentSms
                  ? `opted in ${formatDateTime(c.consentSmsAt)}`
                  : "not opted in",
              ],
              ["Email unsub", c.unsubscribedEmail ? "yes" : "no"],
              ["SMS unsub", c.unsubscribedSms ? "yes" : "no"],
              ["Do-not-call", c.doNotCall ? "yes" : "no"],
            ]}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <Card title={`Open tasks (${openTasks.length})`}>
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-6 text-center">
              No open tasks for this contact.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {openTasks.map((t) => {
                const overdue =
                  t.dueAt !== null && t.dueAt.getTime() < Date.now();
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 px-3 py-2.5"
                  >
                    <PriorityDot priority={t.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.source === "failsafe"
                          ? `failsafe · ${t.failsafeType}`
                          : t.source ?? "manual"}
                        {t.dueAt
                          ? ` · ${overdue ? "overdue" : "due"} ${formatRelative(t.dueAt)}`
                          : null}
                      </p>
                      {t.description ? (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      ) : null}
                    </div>
                    <CompleteTaskButton taskId={t.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="New task">
          <div className="px-3 py-3">
            <NewTaskForm contactId={c.id} />
          </div>
        </Card>
      </div>

      <Card title="Add a note" className="mb-6">
        <div className="px-3 py-3">
          <NoteForm contactId={c.id} />
        </div>
      </Card>

      <Card title={`Activity (${activity.length})`}>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground px-3 py-6 text-center">
            No events recorded for this contact yet.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {activity.map((evt) => {
              const payload = evt.payload as Record<string, unknown> | null;
              const note =
                payload && typeof payload.note === "string"
                  ? (payload.note as string)
                  : null;
              return (
                <li key={evt.id} className="px-3 py-2.5 text-sm">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {evt.eventType}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatRelative(evt.occurredAt)}
                    </span>
                  </div>
                  {note ? (
                    <p className="mt-1 text-foreground leading-relaxed whitespace-pre-wrap">
                      {note}
                    </p>
                  ) : evt.payload ? (
                    <pre className="mt-1.5 text-[11px] text-muted-foreground bg-surface-elevated rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-md ${className}`}
    >
      <header className="px-3 py-2 border-b border-border">
        <h2 className="portal-h2">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

function DL({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="px-3 py-2.5 space-y-1.5 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
          <dt className="text-xs text-muted-foreground self-center">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
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
      className={`inline-block size-2 rounded-full shrink-0 mt-1.5 ${color}`}
      aria-label={`priority ${priority ?? "normal"}`}
    />
  );
}
