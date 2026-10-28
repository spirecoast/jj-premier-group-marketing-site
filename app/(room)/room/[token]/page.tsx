import { notFound } from "next/navigation";
import { PrintButton } from "@/components/questionnaire/print-button";
import { RoomView } from "@/components/room/room-view";
import { ROOM_COPY } from "@/lib/room/copy";
import { loadRoomByToken } from "@/lib/room/store";

/** The room changes between visits; never cache a render. */
export const dynamic = "force-dynamic";

/**
 * A client's room: everything the team has put together for them, at a link
 * only they have. An unknown, retired or closed link is a bare 404 that says
 * nothing about what the link was for.
 */
export default async function RoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const room = await loadRoomByToken(token);
  if (!room) notFound();
  return (
    <>
      <header className="bg-navy text-linen-100 print:hidden">
        <div className="mx-auto flex max-w-[44rem] items-center gap-x-4 px-5 py-3 sm:px-8">
          <span className="whitespace-nowrap font-wordmark text-[13px] font-semibold leading-none tracking-[0.3em]">{ROOM_COPY.bar.toUpperCase()}</span>
          <span className="t-mono-sm ml-auto hidden whitespace-nowrap text-linen-100/70 sm:inline">{ROOM_COPY.privateMark}</span>
          <PrintButton label={ROOM_COPY.print} className="t-label border border-linen-100/45 px-3 py-1.5 text-linen-100 transition-colors hover:bg-linen-100/10" />
        </div>
      </header>
      <main className="mx-auto max-w-[44rem] px-5 pb-24 pt-10 sm:px-8 lg:pt-14 print:max-w-none print:px-0 print:pt-0">
        <RoomView room={room} />
      </main>
    </>
  );
}
