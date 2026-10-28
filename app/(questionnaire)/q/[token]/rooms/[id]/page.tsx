import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoomForm } from "@/components/room/room-form";
import { RoomLinkTools } from "@/components/room/room-link-tools";
import { RoomView } from "@/components/room/room-view";
import { DATASET_VERSION, getIndexEntries } from "@/lib/neighborhoods/data";
import { roleForToken } from "@/lib/questionnaire/access";
import { TEAM_COPY as T } from "@/lib/room/copy";
import { getRoom } from "@/lib/room/store";
import { rotateLinkAction, saveRoomAction, setStatusAction } from "../actions";

/** The room changes between visits; never cache a render. */
export const dynamic = "force-dynamic";

/**
 * One room, for the team: the form that fills it, the link tools beside it,
 * and underneath, the client's page exactly as it stands.
 */
export default async function RoomEditPage({ params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const role = roleForToken(token);
  if (!role) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { state, room } = await getRoom(id);
  if (state === "ok" && !room) notFound();
  const base = `/q/${encodeURIComponent(token)}/rooms`;
  const entries = room?.content.places.length ? await getIndexEntries() : [];
  const by = new Map(entries.map((e) => [e.s, e]));
  const places = (room?.content.places ?? []).flatMap((s) => {
    const e = by.get(s);
    return e ? [{ s: e.s, n: e.n, m: e.m, l: e.l }] : [];
  });

  return (
    <>
      <header className="bg-navy text-linen-100">
        <div className="mx-auto flex max-w-[60rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
          <Link href={base as Route} className="t-label text-linen-100/80 underline-offset-4 hover:text-linen-100 hover:underline">
            {T.back}
          </Link>
          <span className="font-display text-[1.1875rem] leading-tight">{room ? T.roomOf(room.name) : T.heading}</span>
        </div>
      </header>
      <main className="mx-auto grid max-w-[60rem] gap-12 px-4 pb-24 pt-8 lg:px-6">
        {!room ? (
          <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="note">
            {state === "missing" ? T.missing : T.error}
          </p>
        ) : (
          <>
            <h1 className="t-h1 text-balance text-navy">{T.roomOf(room.name)}</h1>
            <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-12">
              <RoomForm token={token} room={room} places={places} datasetVersion={DATASET_VERSION} action={saveRoomAction} />
              <RoomLinkTools token={token} room={room} rotate={rotateLinkAction} setStatus={setStatusAction} />
            </div>
            <section className="grid gap-5" aria-labelledby="room-preview-title">
              <div className="grid gap-1">
                <h2 id="room-preview-title" className="t-h3 text-navy">
                  {T.preview}
                </h2>
                <p className="t-small text-graphite-600">{T.previewNote}</p>
              </div>
              <div className="border border-hairline bg-paper px-5 py-8 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-[44rem]">
                  <RoomView room={room} />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
