"use client";

import { useActionState } from "react";
import type { CreateState } from "@/app/(questionnaire)/q/[token]/rooms/actions";
import { KIND_LABEL, TEAM_COPY as T } from "@/lib/room/copy";
import { ROOM_KINDS } from "@/lib/room/model";
import { LinkBox } from "./link-box";

/** The form that makes a room: a first name and what they're doing. The link shows once, here. */
export function NewRoom({ token, action }: { token: string; action: (prev: CreateState, fd: FormData) => Promise<CreateState> }) {
  const [state, submit, pending] = useActionState(action, null);
  const made = state && state.ok ? state : null;
  return (
    <section className="grid gap-5 border border-hairline bg-white p-5 sm:p-6" aria-labelledby="new-room-title">
      <h2 id="new-room-title" className="t-h3 text-navy">
        {T.newHeading}
      </h2>
      {made ? (
        <div className="grid gap-3">
          <p className="t-body text-navy">{T.made(made.name)}</p>
          <LinkBox link={made.link} note={T.linkOnce} />
        </div>
      ) : null}
      <form action={submit} key={made ? made.link : "new"} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <div className="field">
          <label htmlFor="new-room-name" className="field-label">
            {T.nameLabel}
          </label>
          <input id="new-room-name" name="name" type="text" required maxLength={60} autoComplete="off" className="field-input" aria-describedby="new-room-name-hint" />
          <p id="new-room-name-hint" className="t-mono-sm text-graphite-500">
            {T.nameHint}
          </p>
        </div>
        <fieldset className="grid gap-2">
          <legend className="field-label mb-2">{T.kindLabel}</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {ROOM_KINDS.map((k, i) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 t-body text-body">
                <input type="radio" name="kind" value={k} defaultChecked={i === 0} className="size-4 accent-sky-700" />
                {KIND_LABEL[k]}
              </label>
            ))}
          </div>
        </fieldset>
        {state && !state.ok ? (
          <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="alert">
            {state.error}
          </p>
        ) : null}
        <div>
          <button type="submit" disabled={pending} className="btn btn-navy">
            {pending ? T.making : T.create}
          </button>
        </div>
      </form>
    </section>
  );
}
