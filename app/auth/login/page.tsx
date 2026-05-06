import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const agent = await getCurrentAgent();
  if (agent) {
    redirect("/portal");
  }

  return (
    <section className="px-6 lg:px-12 py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">Team sign-in</p>
        <h1 className="text-section mb-8">Welcome back.</h1>
        <LoginForm />
      </div>
    </section>
  );
}
