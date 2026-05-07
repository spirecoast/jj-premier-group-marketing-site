import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts, events, tasks } from "@/lib/db/schema";
import { formatDateTime, formatRelative } from "@/lib/format";
import { CompleteTaskButton } from "@/app/portal/tasks/complete-button";
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

  return (
    <section className="px-6 lg:px-12 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header>
          <Link
            href="/portal/contacts"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All contacts
          </Link>
          <h1 className="text-section mt-3">
            {c.fullName ?? c.email ?? "Unnamed contact"}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            {c.email ? <span>{c.email}</span> : null}
            {c.phone ? <span>· {c.phone}</span> : null}
            <span>
              · stage{" "}
              <span className="px-2 py-0.5 rounded-sm bg-brand-muted text-foreground text-xs">
                {c.lifecycleStage ?? "—"}
              </span>
            </span>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Identity">
            <DL items={[
              ["Name", c.fullName ?? "—"],
              ["Email", c.email ?? "—"],
              ["Phone", c.phone ?? "—"],
              ["Preferred", c.preferredChannel ?? "—"],
              ["Type", (c.type ?? []).join(", ") || "—"],
            ]} />
          </Card>

          <Card title="Pipeline">
            <DL items={[
              ["Source", c.sourceDetail ?? c.source ?? "—"],
              ["Owner", row.agent?.name ?? "(unassigned)"],
              ["First touch", formatDateTime(c.firstTouchAt)],
              ["Last touch", formatDateTime(c.lastTouchAt)],
              ["Created", formatDateTime(c.createdAt)],
            ]} />
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-eyebrow text-muted-foreground mb-2">Stage</p>
              <StageEditor contactId={c.id} currentStage={c.lifecycleStage} />
            </div>
          </Card>

          <Card title="Consent">
            <DL items={[
              [
                "Email",
                c.consentEmail
                  ? `opted in ${formatDateTime(c.consentEmailAt)}`
                  : "not opted in",
              ],
              [
                "SMS",
                c.consentSms
                  ? `opted in ${formatDateTime(c.consentSmsAt)} (${c.consentSmsMethod ?? "method unknown"})`
                  : "not opted in",
              ],
              ["Email unsubscribed", c.unsubscribedEmail ? "yes" : "no"],
              ["SMS unsubscribed", c.unsubscribedSms ? "yes" : "no"],
              ["Do-not-call", c.doNotCall ? "yes" : "no"],
            ]} />
          </Card>

          <Card title="Next">
            <DL items={[
              [
                "Action due",
                c.nextActionDueAt ? formatDateTime(c.nextActionDueAt) : "—",
              ],
              ["Archived", c.archivedAt ? "yes" : "no"],
            ]} />
          </Card>
        </div>

        <section className="grid md:grid-cols-2 gap-6">
          <Card title="Open tasks">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open tasks for this contact.
              </p>
            ) : (
              <ul className="space-y-3">
                {openTasks.map((t) => {
                  const overdue =
                    t.dueAt !== null && t.dueAt.getTime() < Date.now();
                  return (
                    <li
                      key={t.id}
                      className="border-b border-border last:border-0 pb-3 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t.source === "failsafe"
                              ? `failsafe · ${t.failsafeType}`
                              : t.source ?? "manual"}
                            {t.dueAt
                              ? ` · ${overdue ? "overdue" : "due"} ${formatRelative(t.dueAt)}`
                              : null}
                          </p>
                          {t.description ? (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {t.description}
                            </p>
                          ) : null}
                        </div>
                        <CompleteTaskButton taskId={t.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card title="New task">
            <NewTaskForm contactId={c.id} />
          </Card>
        </section>

        <section>
          <Card title="Add a note">
            <NoteForm contactId={c.id} />
          </Card>
        </section>

        <section>
          <h2 className="text-heading mb-4">Activity</h2>
          {activity.length === 0 ? (
            <div className="bg-surface border border-border rounded-md p-8 text-center text-muted-foreground text-sm">
              No events recorded for this contact yet.
            </div>
          ) : (
            <ol className="bg-surface border border-border rounded-md divide-y divide-border">
              {activity.map((evt) => (
                <li key={evt.id} className="px-4 py-3 text-sm">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {evt.eventType}
                    </span>
                    <span className="text-eyebrow text-muted-foreground ml-auto">
                      {formatRelative(evt.occurredAt)}
                    </span>
                  </div>
                  {evt.payload ? (
                    <pre className="mt-2 text-xs text-muted-foreground bg-surface-elevated rounded-sm p-3 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-md p-6">
      <p className="text-eyebrow text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function DL({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="space-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
