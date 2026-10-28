import { ROOM_COPY } from "@/lib/room/copy";

/** An unknown, retired or closed room link. Says nothing about what the link was for. */
export default function RoomNotFound() {
  return (
    <main className="mx-auto max-w-[36rem] px-4 py-24">
      <h1 className="t-h2 mt-3 text-navy">{ROOM_COPY.notFoundTitle}</h1>
      <p className="t-body mt-4">{ROOM_COPY.notFoundBody}</p>
    </main>
  );
}
