"use client";

import { useActionState } from "react";
import {
  createManualTask,
  initialTaskState,
  type TaskActionState,
} from "@/app/portal/tasks/actions";

export function NewTaskForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState<
    TaskActionState,
    FormData
  >(createManualTask, initialTaskState);

  return (
    <form
      action={formAction}
      className="space-y-3"
      key={state.ok ? "fresh" : "open"}
    >
      <input type="hidden" name="contactId" value={contactId} />

      <label className="block">
        <span className="text-eyebrow text-muted-foreground mb-1 block">
          Title
        </span>
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          placeholder="Call them about Tuesday's showing"
          className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-eyebrow text-muted-foreground mb-1 block">
          Notes (optional)
        </span>
        <textarea
          name="description"
          rows={2}
          maxLength={2000}
          placeholder="What needs to happen?"
          className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none resize-y"
        />
      </label>

      <div className="flex gap-3 flex-wrap">
        <label className="block flex-1 min-w-[160px]">
          <span className="text-eyebrow text-muted-foreground mb-1 block">
            Due
          </span>
          <input
            type="datetime-local"
            name="dueAt"
            className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block flex-1 min-w-[120px]">
          <span className="text-eyebrow text-muted-foreground mb-1 block">
            Priority
          </span>
          <select
            name="priority"
            defaultValue="normal"
            className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none"
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-brand text-inverse text-sm rounded-sm hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Adding…" : "Add task"}
        </button>
        {state.error ? (
          <span className="text-xs text-danger" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.ok ? <span className="text-xs text-success">Added.</span> : null}
      </div>
    </form>
  );
}
