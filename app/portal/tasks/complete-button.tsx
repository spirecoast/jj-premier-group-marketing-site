"use client";

import { useActionState } from "react";
import { completeTask, type TaskActionState } from "./actions";

const initialTaskState: TaskActionState = { ok: false };

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [state, formAction, isPending] = useActionState<
    TaskActionState,
    FormData
  >(completeTask, initialTaskState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors disabled:opacity-60"
      >
        {isPending ? "…" : state.ok ? "Done" : "Complete"}
      </button>
      {state.error ? (
        <span className="text-xs text-danger ml-2">{state.error}</span>
      ) : null}
    </form>
  );
}
