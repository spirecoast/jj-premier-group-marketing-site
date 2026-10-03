import { fill } from "@/lib/issues/copy";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import type { NoteSlot } from "@/lib/tide/notes";

/**
 * The signed notes on a Tide issue: one from Joelyn, one from Jessica, each in
 * her own words and signed with her name. A slot shows only when its note is
 * written (lib/tide/issues.ts, `commentary`); with none written the section
 * isn't drawn at all. In sample previews an empty slot shows as a dashed box
 * marked "Placeholder, not published".
 */
export function TeamNotes({ notes, eyebrow }: { notes: NoteSlot[]; eyebrow: string }) {
  if (!notes.length) return null;
  return (
    <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="notes-title" data-tide-notes="">
      <div className="flex max-w-[760px] flex-col gap-3">
        <p className="t-eyebrow text-amber">{eyebrow}</p>
        <h2 id="notes-title" className="t-h1 text-navy">
          {W.notesHeading}
        </h2>
      </div>
      <div className={notes.length > 1 ? "grid gap-5 md:grid-cols-2" : "grid max-w-[760px] gap-5"}>
        {notes.map((n) =>
          n.paragraphs ? (
            <figure key={n.key} className="flex flex-col gap-5 border-l-2 border-amber bg-white py-6 pr-6 pl-6 md:pl-8" data-note={n.key}>
              <blockquote className="flex flex-col gap-4 text-[1.125rem] leading-[1.65] text-ink">
                {n.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </blockquote>
              <figcaption className="t-label text-linen-700">{fill(W.noteSign, { name: n.name })}</figcaption>
            </figure>
          ) : (
            <div key={n.key} className="flex flex-col gap-2 border-2 border-dashed border-warning bg-warning-fill p-6" role="note" data-note-placeholder={n.key}>
              <p className="t-mono-sm text-warning">{W.placeholderLabel}</p>
              <p className="t-body text-ink italic">{fill(W.notePlaceholder, { first: n.first })}</p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
