"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { LeadForm } from "@/components/lead-form";
import { contactPrefill, listingsPrefill, type Prefill } from "@/lib/lead-prefill";

type Props = Omit<ComponentProps<typeof LeadForm>, "defaultMessage" | "hidden"> & {
  /** Which link the page reads: /contact's place and message, or /listings' market and budget. */
  prefill: "contact" | "listings";
  hidden?: Record<string, string | undefined>;
};

const READ = { contact: contactPrefill, listings: listingsPrefill } as const;

/**
 * A lead form on a static page that a link can fill in (lib/lead-prefill.ts).
 * The server renders it empty; in the browser the link's market goes into
 * the hidden fields and its words into the message, only if the visitor
 * hasn't started typing there. Nothing is remounted, so nothing typed is lost.
 */
export function UrlLeadForm({ prefill, hidden, placeholderMessage, ...rest }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [link, setLink] = useState<Prefill>({});

  useLayoutEffect(() => {
    const p = READ[prefill](new URLSearchParams(window.location.search));
    if (p.market || p.placeholder) setLink(p);
    const field = box.current?.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
    if (p.message && field && !field.value) field.value = p.message;
  }, [prefill]);

  return (
    <div ref={box}>
      <LeadForm {...rest} placeholderMessage={link.placeholder ?? placeholderMessage} hidden={{ ...hidden, market: link.market ?? hidden?.market }} />
    </div>
  );
}
