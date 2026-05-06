"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import {
  leadConfirmationEmail,
  leadInternalNotifyEmail,
} from "@/lib/email/templates";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Please share your name").max(200),
  email: z.string().trim().email("A valid email is required").max(320),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
  message: z
    .string()
    .trim()
    .min(1, "Please write a short message")
    .max(5000),
  consentEmail: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  // Honeypot — hidden field; bots fill it.
  website: z.string().max(0).optional(),
});

export type ContactFormState = {
  ok: boolean;
  errors?: Partial<Record<keyof z.infer<typeof contactFormSchema>, string[]>>;
  formError?: string;
};

export const initialContactFormState: ContactFormState = { ok: false };

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = Object.fromEntries(formData);

  const parsed = contactFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Honeypot tripped — silent success so bots don't learn.
  if (data.website) {
    return { ok: true };
  }

  const now = new Date();
  const db = getDb();

  let contactId: string;
  try {
    const [row] = await db
      .insert(contacts)
      .values({
        fullName: data.name,
        email: data.email,
        phone: data.phone ?? null,
        type: ["lead"],
        lifecycleStage: "new",
        source: "organic",
        sourceDetail: "contact_form",
        consentEmail: data.consentEmail,
        consentEmailAt: data.consentEmail ? now : null,
        firstTouchAt: now,
        lastTouchAt: now,
      })
      .returning({ id: contacts.id });
    contactId = row.id;

    await db.insert(events).values({
      eventType: "form_submit",
      contactId,
      payload: {
        form: "contact",
        message: data.message,
        consent_email: data.consentEmail,
      },
    });
  } catch (err) {
    console.error("[contact form] db insert failed", err);
    return {
      ok: false,
      formError:
        "We couldn't save your message. Please try again, or email us directly.",
    };
  }

  // Emails are best-effort. The lead is captured; if email fails, the internal
  // notify path will be retried by Phase 5's failsafe loop.
  const teamEmail = process.env.TEAM_NOTIFY_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const sends: Promise<unknown>[] = [];

  // Confirmation to the lead — transactional, no marketing consent required.
  const confirmation = leadConfirmationEmail({ name: data.name });
  sends.push(
    sendEmail({
      to: data.email,
      subject: confirmation.subject,
      html: confirmation.html,
      replyTo: teamEmail,
    }),
  );

  // Internal notify — only if a recipient is configured.
  if (teamEmail) {
    const notify = leadInternalNotifyEmail({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      message: data.message,
      consentEmail: data.consentEmail,
      contactId,
      siteUrl,
    });
    sends.push(
      sendEmail({
        to: teamEmail,
        subject: notify.subject,
        html: notify.html,
        replyTo: data.email,
      }),
    );
  }

  const results = await Promise.allSettled(sends);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[contact form] email send rejected", r.reason);
    } else if (r.value && typeof r.value === "object" && "ok" in r.value && !r.value.ok) {
      console.error("[contact form] email send failed", r.value);
    }
  }

  return { ok: true };
}
