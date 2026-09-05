import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const to = request.nextUrl.searchParams.get("to") ?? "/";
  // Same-origin paths only: "//host" and "/\\host" would leave the site.
  const target = new URL(/^\/(?![\/\\])/.test(to) ? to : "/", request.url);
  if (target.origin !== request.nextUrl.origin) target.pathname = "/";
  return NextResponse.redirect(target);
}
