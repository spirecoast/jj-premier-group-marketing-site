import { and, asc, eq, isNull, or } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { contacts, tasks } from "@/lib/db/schema";
import { formatRelative } from "@/lib/format";
import { CompleteTaskButton } from "./complete-button";

export const metadata: Metadata = {
  title: "Tasks",
  robots: { index: false, follow: false },
};

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

export default async function TasksPage() {
  const agent = await requireAgent();
  const db = getDb();

  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      source: tasks.source,
      failsafeType: tasks.failsafeType,
      dueAt: tasks.dueAt,
      contactId: tasks.contactId,
      contactName: contacts.fullName,
      contactEmail: contacts.email,
    })
    .from(tasks)
    .leftJoin(contacts, eq(tasks.contactId, contacts.id))
    .where(
      and(
        or(eq(tasks.agentId, agent.id), isNull(tasks.agentId)),
        isNull(tasks.completedAt),
      ),
    )
    .orderBy(asc(tasks.dueAt));

  const sorted = rows.sort((a, b) => {
    const pa =
      PRIORITY_ORDER[(a.priority as keyof typeof PRIORITY_ORDER) ?? "normal"] ??
      2;
    const pb =
      PRIORITY_ORDER[(b.priority as keyof typeof PRIORITY_ORDER) ?? "normal"] ??
      2;
    return pa - pb;
  });

  return (
    <section className="px-6 lg:px-12 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-eyebrow text-muted-foreground mb-3">Tasks</p>
          <h1 className="text-section">Open</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {sorted.length} open task{sorted.length === 1 ? "" : "s"} assigned
            to you or unassigned.
          </p>
        </header>

        {sorted.length === 0 ? (
          <div className="bg-surface border border-border rounded-md p-12 text-center text-muted-foreground">
            Nothing in the queue. Failsafes auto-create tasks when leads go
            quiet.
          </div>
        ) : (
          <ul className="bg-surface border border-border rounded-md divide-y divide-border">
            {sorted.map((t) => {
              const overdue =
                t.dueAt !== null && t.dueAt.getTime() < Date.now();
              return (
                <li key={t.id} className="px-4 py-4 flex items-start gap-4">
                  <PriorityDot priority={t.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-medium">{t.title}</span>
                      {t.source === "failsafe" ? (
                        <span className="text-eyebrow text-warning">
                          failsafe · {t.failsafeType}
                        </span>
                      ) : null}
                      <span
                        className={
                          overdue
                            ? "text-eyebrow text-danger"
                            : "text-eyebrow text-muted-foreground"
                        }
                      >
                        {t.dueAt
                          ? overdue
                            ? `overdue · ${formatRelative(t.dueAt)}`
                            : `due ${formatRelative(t.dueAt)}`
                          : "no due date"}
                      </span>
                    </div>
                    {t.description ? (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {t.description}
                      </p>
                    ) : null}
                    {t.contactId ? (
                      <Link
                        href={`/portal/contacts/${t.contactId}` as never}
                        className="text-sm text-brand hover:text-brand-hover mt-2 inline-block"
                      >
                        {t.contactName ?? t.contactEmail ?? "View contact"}
                      </Link>
                    ) : null}
                  </div>
                  <CompleteTaskButton taskId={t.id} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
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
      className={`inline-block size-2 rounded-full mt-2 ${color}`}
      aria-label={`priority ${priority ?? "normal"}`}
    />
  );
}
