import type { Metadata } from "next";
import Link from "next/link";
import { UNSUBSCRIBE_PAGE_COPY as COPY } from "@/lib/newsletter/copy";
import { isNewsletterList } from "@/lib/newsletter/lists";
import { verifyUnsubscribeTarget } from "@/lib/newsletter/service";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/**
 * /unsubscribe?s=<subscription id>&sig=<HMAC>&list=tide|encore|all (the links
 * in the site's own emails), or ?id=<contact id>&sig=<HMAC> (older links that
 * stop everything). A GET only shows the buttons; the POST from one does it.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const sig = str("sig");
  const s = str("s");
  const id = str("id");
  const kind = s ? ("subscription" as const) : ("contact" as const);
  const target = s || id;
  const valid = isUuid(target) && Boolean(sig) && verifyUnsubscribeTarget({ kind, id: target, sig });
  const listParam = str("list");
  const list = kind === "subscription" && isNewsletterList(listParam) ? listParam : null;

  return (
    <section className="px-6 lg:px-12 py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">{COPY.eyebrow}</p>
        <h1 className="text-section mb-8">{COPY.title}</h1>

        {!valid ? (
          <div className="bg-surface border border-border rounded-md p-8">
            <h2 className="text-heading mb-3">{COPY.invalidTitle}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{COPY.invalidBody}</p>
            <Link href="/" className="text-brand hover:text-brand-hover underline">
              {COPY.home}
            </Link>
          </div>
        ) : (
          <UnsubscribeForm kind={kind} id={target} sig={sig} list={list} />
        )}
      </div>
    </section>
  );
}
