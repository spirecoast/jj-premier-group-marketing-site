"use client";

import { useActionState, useEffect, useState } from "react";
import { readUtm } from "@/components/utm-tracker";
import {
  initialContactFormState,
  submitContactForm,
  type ContactFormState,
} from "./actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-sm text-danger mt-1" role="alert">
      {messages[0]}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactForm, initialContactFormState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    setUtm(readUtm());
  }, []);

  if (state.ok) {
    return (
      <div className="bg-surface border border-border rounded-md p-8">
        <p className="text-eyebrow text-accent mb-3">Thanks</p>
        <h2 className="text-heading mb-3">Message received.</h2>
        <p className="text-muted-foreground leading-relaxed">
          We&rsquo;ve got your note and will follow up shortly. Check your inbox
          for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={`utm__${k}`} value={v} />
      ))}
      {/* Honeypot — visually hidden from humans, present for bots. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium block mb-2">Name</span>
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
          placeholder="Your name"
          aria-invalid={!!state.errors?.name}
        />
        <FieldError messages={state.errors?.name} />
      </label>

      <label className="block">
        <span className="text-sm font-medium block mb-2">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
          placeholder="you@example.com"
          aria-invalid={!!state.errors?.email}
        />
        <FieldError messages={state.errors?.email} />
      </label>

      <label className="block">
        <span className="text-sm font-medium block mb-2">
          Phone <span className="text-muted-foreground">(optional)</span>
        </span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
          placeholder="(555) 555-5555"
          aria-invalid={!!state.errors?.phone}
        />
        <FieldError messages={state.errors?.phone} />
      </label>

      <label className="block">
        <span className="text-sm font-medium block mb-2">Message</span>
        <textarea
          name="message"
          rows={5}
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
          placeholder="Tell us a bit about what you&rsquo;re looking for"
          aria-invalid={!!state.errors?.message}
        />
        <FieldError messages={state.errors?.message} />
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="consentEmail"
          value="on"
          className="mt-1 size-4 accent-brand"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          Send me listing updates and market info by email. I can unsubscribe at
          any time.
        </span>
      </label>

      {state.formError ? (
        <p className="text-sm text-danger" role="alert">
          {state.formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>

      <p className="text-xs text-muted-foreground">
        We&rsquo;ll only use your information to follow up. Your message is sent
        directly to the team.
      </p>
    </form>
  );
}
