import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import type { ImageRef } from "@/lib/content/types";
import { site } from "@/lib/site";

/** 10 · Tide, the newsletter. One line about what it is, and one field. */
export function LetterBand({ image }: { image: ImageRef }) {
  return (
    <CtaBand
      image={image}
      eyebrow={`10 · ${site.reportLong}`}
      title="One page a month on the three markets, written in plain language."
      body="Once a month, one page on what happened in Lakewood Ranch, Sarasota and Bradenton, and what it means for you."
      minHeight="min-h-[560px]"
    >
      <LetterForm tone="dark" />
    </CtaBand>
  );
}
