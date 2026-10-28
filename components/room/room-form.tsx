"use client";

import { useActionState, useId } from "react";
import type { SaveState } from "@/app/(questionnaire)/q/[token]/rooms/actions";
import { KIND_LABEL, TEAM_COPY as T } from "@/lib/room/copy";
import { GUIDE_STEPS, ROOM_KINDS, guidesFor, stepKey, type Room } from "@/lib/room/model";
import { PlacePicker, type PickedPlace } from "./place-picker";

/**
 * Everything the team can change about a room, saved as one form: the
 * name and what they're doing, where they are in the guide, the places, the
 * two plan links and the notes. A plan link that isn't one is named, and the
 * rest still saves.
 */
export function RoomForm({
  token,
  room,
  places,
  datasetVersion,
  action,
}: {
  token: string;
  room: Room;
  places: PickedPlace[];
  datasetVersion: string;
  action: (prev: SaveState, fd: FormData) => Promise<SaveState>;
}) {
  const [state, submit, pending] = useActionState(action, null);
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const problems = state && !state.ok ? (state.problems ?? []) : [];
  const stepOptions = guidesFor(room.kind).flatMap((guide) => GUIDE_STEPS[guide].map((title, i) => ({ key: `${guide}:${i + 1}`, label: T.stepOption(i + 1, title, guide) })));

  return (
    <form action={submit} className="grid gap-10">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="id" value={room.id} />

      <fieldset className="grid gap-5">
        <legend className="t-h3 mb-4 text-navy">{T.about}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field">
            <label htmlFor={id("name")} className="field-label">
              {T.nameLabel}
            </label>
            <input id={id("name")} name="name" type="text" required maxLength={60} defaultValue={room.name} autoComplete="off" className="field-input" />
          </div>
          <div className="field">
            <label htmlFor={id("kind")} className="field-label">
              {T.kindLabel}
            </label>
            <select id={id("kind")} name="kind" defaultValue={room.kind} className="field-input">
              {ROOM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor={id("step")} className="field-label">
            {T.stepLabel}
          </label>
          <select id={id("step")} name="step" defaultValue={stepKey(room.content.step)} className="field-input">
            <option value="">{T.stepNone}</option>
            {stepOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="t-h3 mb-4 text-navy">{T.placesHeading}</legend>
        <PlacePicker initial={places} datasetVersion={datasetVersion} />
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="t-h3 mb-4 text-navy">{T.plansHeading}</legend>
        <div className="field">
          <label htmlFor={id("move")} className="field-label">
            {T.moveLabel}
          </label>
          <input
            id={id("move")}
            name="movePlan"
            type="text"
            inputMode="url"
            defaultValue={room.content.movePlan ? `/relocate?${room.content.movePlan}` : ""}
            autoComplete="off"
            className="field-input"
            aria-describedby={id("move-hint")}
            aria-invalid={problems.includes("move") || undefined}
          />
          <p id={id("move-hint")} className={problems.includes("move") ? "t-mono-sm text-warning" : "t-mono-sm text-graphite-500"}>
            {problems.includes("move") ? T.badMove : T.moveHint}
          </p>
        </div>
        <div className="field">
          <label htmlFor={id("visit")} className="field-label">
            {T.visitLabel}
          </label>
          <input
            id={id("visit")}
            name="visitPlan"
            type="text"
            inputMode="url"
            defaultValue={room.content.visitPlan ? `/calendar/plan?${room.content.visitPlan}` : ""}
            autoComplete="off"
            className="field-input"
            aria-describedby={id("visit-hint")}
            aria-invalid={problems.includes("visit") || undefined}
          />
          <p id={id("visit-hint")} className={problems.includes("visit") ? "t-mono-sm text-warning" : "t-mono-sm text-graphite-500"}>
            {problems.includes("visit") ? T.badVisit : T.visitHint}
          </p>
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="t-h3 mb-4 text-navy">{T.notesHeading}</legend>
        <div className="field">
          <label htmlFor={id("notes")} className="field-label">
            {T.notesHeading}
          </label>
          <textarea id={id("notes")} name="notes" rows={10} maxLength={8000} defaultValue={room.content.notes} className="field-input min-h-[12rem] leading-relaxed" aria-describedby={id("notes-hint")} />
          <p id={id("notes-hint")} className="t-mono-sm text-graphite-500">
            {T.notesHint}
          </p>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-navy">
          {pending ? T.saving : T.save}
        </button>
        <p className="t-small" role="status" aria-live="polite">
          {state?.ok ? T.saved : state && !state.ok ? <span className="text-warning">{state.error}</span> : null}
        </p>
      </div>
    </form>
  );
}
