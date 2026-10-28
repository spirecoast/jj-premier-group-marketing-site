import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewRoom } from "@/components/room/new-room";
import { roleForToken } from "@/lib/questionnaire/access";
import { KIND_LABEL, TEAM_COPY as T } from "@/lib/room/copy";
import { updatedLabel } from "@/lib/room/model";
import { listRooms } from "@/lib/room/store";
import { cn } from "@/lib/utils";
import { createRoomAction } from "./actions";

/** Rooms change between visits; never cache a render. */
export const dynamic = "force-dynamic";

/**
 * The team's room console, behind each person's own private link
 * (/q/<token>/rooms): make a room, see every room, open one to edit it.
 */
export default async function RoomsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const role = roleForToken(token);
  if (!role) notFound();
  const { state, rooms } = await listRooms();
  const base = `/q/${encodeURIComponent(token)}/rooms`;

  return (
    <>
      <header className="bg-navy text-linen-100">
        <div className="mx-auto flex max-w-[60rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
          <span className="font-display text-[1.1875rem] leading-tight">{T.heading}</span>
        </div>
      </header>
      <main className="mx-auto grid max-w-[60rem] gap-10 px-4 pb-24 pt-8 lg:px-6">
        <section className="grid gap-4">
          <h1 className="t-h1 text-balance text-navy">{T.heading}</h1>
          <p className="t-body max-w-[40em]">{T.intro}</p>
          {state !== "ok" ? (
            <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="note">
              {state === "missing" ? T.missing : T.error}
            </p>
          ) : null}
        </section>

        {state === "ok" ? <NewRoom token={token} action={createRoomAction} /> : null}

        <section className="grid gap-4" aria-labelledby="rooms-list-title">
          <h2 id="rooms-list-title" className="t-h3 text-navy">
            {T.listHeading}
          </h2>
          {rooms.length ? (
            <ul className="divide-y divide-hairline border-y border-hairline">
              {rooms.map((r) => (
                <li key={r.id}>
                  <Link href={`${base}/${r.id}` as Route} className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 transition-colors hover:text-navy", r.status === "closed" && "opacity-60")}>
                    <span className="font-display text-[1.25rem] font-light leading-tight text-navy">{r.name}</span>
                    <span className="t-mono-sm text-graphite-500">{KIND_LABEL[r.kind]}</span>
                    {r.status === "closed" ? <span className="t-mono-sm text-graphite-500">{T.closedMark}</span> : null}
                    <span className="t-mono-sm ml-auto text-graphite-500">{T.updatedAgo(updatedLabel(r.updatedAt))}</span>
                    <span className="t-mono-sm hidden text-harbor-700 sm:inline">{T.open}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : state === "ok" ? (
            <p className="t-body text-graphite-600">{T.listEmpty}</p>
          ) : null}
        </section>
      </main>
    </>
  );
}
