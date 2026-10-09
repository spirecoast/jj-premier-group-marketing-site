import { z } from "zod";
import { emailList } from "@/lib/email/recipients";

const envSchema = z.object({
  // Supabase (DB / Storage / Realtime): the lead mirror, consent records and the questionnaire
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  // Email
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  // One inbox or several, comma-separated (lib/email/recipients.ts).
  TEAM_NOTIFY_EMAIL: z
    .string()
    .refine((v) => emailList(v).length > 0 && emailList(v).every((a) => z.string().email().safeParse(a).success), "one or more email addresses, separated by commas"),
  UNSUBSCRIBE_SECRET: z.string().min(32),
  // Misc
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
