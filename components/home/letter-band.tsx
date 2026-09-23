import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import type { ImageRef } from "@/lib/content/types";
import { site } from "@/lib/site";

/** 06 · The Coast Market Report. One line about what it is, and one field. */
export function LetterBand({ image }: { image: ImageRef }) {
  return (
    <CtaBand
      image={image}
      eyebrow={`06 · ${site.reportName}`}
      title="What happened on your street this quarter, in plain language."
      body="Once a quarter, one page on what happened in Lakewood Ranch, Sarasota and Bradenton, and what it means for you."
      minHeight="min-h-[560px]"
    >
      <LetterForm tone="dark" />
    </CtaBand>
  );
}
