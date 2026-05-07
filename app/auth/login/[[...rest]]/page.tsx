import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="px-6 lg:px-12 py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">Team sign-in</p>
        <h1 className="text-section mb-8">Welcome back.</h1>
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/auth/login"
            signUpUrl="/auth/no-access"
            forceRedirectUrl="/portal"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Agents only. Access is restricted to invited team members.
        </p>
      </div>
    </section>
  );
}
