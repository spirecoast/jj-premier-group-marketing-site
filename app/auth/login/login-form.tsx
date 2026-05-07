"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialLoginState: LoginState = { ok: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    initialLoginState,
  );

  if (state.ok) {
    return (
      <div className="bg-surface border border-border rounded-md p-8">
        <p className="text-eyebrow text-accent mb-3">Check your email</p>
        <h2 className="text-heading mb-3">Sign-in link sent.</h2>
        <p className="text-muted-foreground leading-relaxed">
          We sent a one-time sign-in link to{" "}
          <strong className="text-foreground">{state.email}</strong>. Open it on
          this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-sm font-medium block mb-2">Work email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          defaultValue={state.email ?? ""}
          className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
          placeholder="[email protected]"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send sign-in link"}
      </button>

      <p className="text-xs text-muted-foreground">
        Agents only. Access is restricted to invited team members.
      </p>
    </form>
  );
}
