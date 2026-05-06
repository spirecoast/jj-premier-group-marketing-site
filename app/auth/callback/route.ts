import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkAuthUserToAgent } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/portal";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth callback] exchange failed", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_link", request.url),
    );
  }

  // Link this auth user to their agent row by email match (idempotent).
  const linked = await linkAuthUserToAgent({
    authUserId: data.user.id,
    email: data.user.email ?? "",
  });

  if (!linked) {
    return NextResponse.redirect(new URL("/auth/no-access", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
