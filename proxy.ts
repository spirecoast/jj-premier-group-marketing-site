import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isProtected = createRouteMatcher(["/portal(.*)"]);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (isProtected(request)) {
    await auth.protect();
  }
});

/**
 * Clerk guards the portal. The public site is deployed without Clerk keys,
 * and clerkMiddleware throws at request time without them, so in that case
 * the portal is closed outright and every other route passes straight through.
 */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    if (isProtected(request)) {
      return NextResponse.redirect(new URL("/auth/no-access", request.url));
    }
    return NextResponse.next();
  }
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
