import { NextResponse, type NextRequest } from "next/server";

/**
 * Sign-out is handled by Clerk's <UserButton /> in /portal — clicking
 * "Sign out" calls Clerk's clientside signOut and redirects.
 *
 * This route is kept as a fallback link target. It clears Clerk session
 * cookies set on the deployment domain and redirects home.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  // Clear Clerk session cookies (best-effort; Clerk's primary sign-out is
  // browser-side via <SignOutButton /> or auth().redirectToSignIn()).
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("__session") || cookie.name.startsWith("__clerk_")) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}

export const POST = GET;
