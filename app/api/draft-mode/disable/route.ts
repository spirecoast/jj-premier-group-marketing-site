import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const to = request.nextUrl.searchParams.get("to") ?? "/";
  return NextResponse.redirect(new URL(to.startsWith("/") ? to : "/", request.url));
}
