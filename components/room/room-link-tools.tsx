"use client";

import { useActionState } from "react";
import type { LinkState } from "@/app/(questionnaire)/q/[token]/rooms/actions";
import { TEAM_COPY as T } from "@/lib/room/copy";
import type { Room } from "@/lib/room/model";
import { LinkBox } from "./link-box";

/**
 * The room's link and its life: make a new link (the old one stops working
 * at once; the new one shows here, once) and close or reopen the room.
 */
export function RoomLinkTools({
  token,
  room,
  rotate,
  setStatus,
}: {
  token: string;
  room: Room;
  rotate: (prev: LinkState, fd: FormData) => Promise<LinkState>;
  setStatus: (fd: FormData) => Promise<void>;
}) {
  const [link, submitRotate, rotating] = useActionState(rotate, null);
  const closed = room.status === "closed";
  return (
    <aside className="grid gap-6 border border-hairline bg-white p-5 sm:p-6" aria-labelledby="room-link-title">
      <div className="grid gap-3">
        <h2 id="room-link-title" className="t-h3 text-navy">
          {T.theirLink}
        </h2>
        {closed ? (
          <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="note">
            {T.isClosed}
          </p>
        ) : null}
        {link && "link" in link ? <LinkBox link={link.link} note={T.linkOnce} /> : <p className="t-small text-graphite-600">{T.theirLinkBody}</p>}
        {link && "error" in link ? (
          <p className="t-small text-warning" role="alert">
            {link.error}
          </p>
        ) : null}
        <form
          action={submitRotate}
          onSubmit={(e) => {
            if (!window.confirm(T.newLinkConfirm)) e.preventDefault();
          }}
        >
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="id" value={room.id} />
          <button type="submit" disabled={rotating || closed} className="btn btn-outline">
            {T.newLink}
          </button>
        </form>
      </div>
      <div className="grid gap-3 border-t border-hairline pt-5">
        <form action={setStatus}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="id" value={room.id} />
          <input type="hidden" name="status" value={closed ? "open" : "closed"} />
          <button type="submit" className="link-rule">
            {closed ? T.reopen : T.closeRoom}
          </button>
        </form>
        {!closed ? <p className="t-small text-graphite-600">{T.closeHint}</p> : null}
      </div>
    </aside>
  );
}
