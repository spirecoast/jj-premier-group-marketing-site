"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ShareButton } from "@/components/share-button";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";

/**
 * The close of an issue for a reader who already gets Tide: the one thing
 * the issue's numbers make them want is their own street. Tide Street's
 * two boxes inline (they go to /sell/sold with the street carried in the
 * link, as the page's own sign does), the Sale Calculator, and a share
 * action for the issue. Shown in place of the sign-up when the visit came
 * from the email (components/arrived-from.tsx).
 */
export function ReaderClose({ title }: { title: string }) {
  const uid = useId();
  const router = useRouter();
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = street.trim();
    if (s.length < 2) return;
    const p = new URLSearchParams({ street: s });
    if (zip.trim()) p.set("zip", zip.trim());
    router.push(`/sell/sold?${p}` as Route);
  }
  return (
    <section className="border-t border-rule bg-linen-100" aria-labelledby="reader-title" data-tide-reader-close="">
      <div className="container-site grid gap-8 py-14 md:grid-cols-2 md:items-center md:gap-12 lg:py-16">
        <div className="flex flex-col gap-3">
          <h2 id="reader-title" className="t-h2 text-navy">
            {W.readerHeading}
          </h2>
          <p className="t-body max-w-measure text-body">{W.readerBody}</p>
        </div>
        <div className="flex flex-col gap-5">
          <form onSubmit={onSubmit} role="search" aria-label={W.readerHeading} className="grid gap-3 sm:grid-cols-[1.6fr_1fr_auto] sm:items-end">
            <div className="field">
              <label htmlFor={`${uid}-street`} className="field-label">
                {W.readerStreet}
              </label>
              <input id={`${uid}-street`} name="street" value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="address-line1" maxLength={80} required minLength={2} className="field-input" />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-zip`} className="field-label">
                {W.readerZip}
              </label>
              <input id={`${uid}-zip`} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" maxLength={40} className="field-input" />
            </div>
            <button type="submit" className="btn btn-navy">
              {W.readerSubmit}
              <span className="btn-dash" aria-hidden="true" />
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/sell/net-proceeds" className="link-rule">
              {W.readerCalculator}
            </Link>
            <ShareButton title={title} what="tide-issue" label={W.readerForward} />
          </div>
        </div>
      </div>
    </section>
  );
}
