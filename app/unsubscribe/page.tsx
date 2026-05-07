import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsubscribe } from "@/lib/unsubscribe";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : "";
  const sig = typeof params.sig === "string" ? params.sig : "";

  const valid = isUuid(id) && verifyUnsubscribe(id, sig);

  return (
    <section className="px-6 lg:px-12 py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">
          Unsubscribe
        </p>
        <h1 className="text-section mb-8">[YOUR PLACEHOLDER]</h1>

        {!valid ? (
          <div className="bg-surface border border-border rounded-md p-8">
            <h2 className="text-heading mb-3">Link expired or invalid.</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              This unsubscribe link looks malformed. Reply to any of our emails
              with &ldquo;unsubscribe&rdquo; and we&rsquo;ll take you off the
              list manually.
            </p>
            <Link
              href="/"
              className="text-brand hover:text-brand-hover underline"
            >
              Back home
            </Link>
          </div>
        ) : (
          <UnsubscribeForm contactId={id} sig={sig} />
        )}
      </div>
    </section>
  );
}
