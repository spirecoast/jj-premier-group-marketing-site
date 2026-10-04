import { NextResponse, type NextRequest } from "next/server";
import { fill } from "@/lib/issues/copy";
import { ONE_CLICK_COPY } from "@/lib/newsletter/copy";
import { LIST_NAME, isNewsletterList } from "@/lib/newsletter/lists";
import { applyUnsubscribe, verifyUnsubscribeTarget } from "@/lib/newsletter/service";

/**
 * The List-Unsubscribe target in every email to a subscriber
 * (lib/newsletter/headers.ts).
 *
 * POST   One-click unsubscribe (RFC 8058): a mail app's "Unsubscribe" button
 *        posts `List-Unsubscribe=One-Click` here and the address is off that
 *        list at once, no page and no second step. `?s=<subscription id>
 *        &sig=<HMAC>&list=tide|encore`.
 * GET    A person who opened the link: sent on to the /unsubscribe page,
 *        where a button does it. A GET never unsubscribes, since mail
 *        scanners open every link.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function params(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const s = sp.get("s") ?? "";
  const sig = sp.get("sig") ?? "";
  const list = sp.get("list");
  return { s, sig, list };
}

const text = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const { s, sig, list } = params(request);
  if (!UUID.test(s) || !sig || !isNewsletterList(list) || !verifyUnsubscribeTarget({ kind: "subscription", id: s, sig })) {
    return text(ONE_CLICK_COPY.invalid, 400);
  }
  try {
    await applyUnsubscribe({ kind: "subscription", id: s, sig }, list, "one-click");
    return text(fill(ONE_CLICK_COPY.done, { product: LIST_NAME[list] }), 200);
  } catch (err) {
    console.error("[newsletter] one-click unsubscribe failed", err);
    // A 5xx tells the mail app to try again later.
    return text(ONE_CLICK_COPY.invalid, 503);
  }
}

export function GET(request: NextRequest) {
  const { s, sig, list } = params(request);
  const target = new URL("/unsubscribe", request.nextUrl.origin);
  if (s) target.searchParams.set("s", s);
  if (sig) target.searchParams.set("sig", sig);
  if (list) target.searchParams.set("list", list);
  return NextResponse.redirect(target, 303);
}
