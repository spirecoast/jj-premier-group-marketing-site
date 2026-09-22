import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import type { ImageRef, Post } from "@/lib/content/types";
import { site } from "@/lib/site";

/** 06 · The Coast Market Report. The latest headline, and one field. */
export function LetterBand({ image, latest }: { image: ImageRef; latest?: Post }) {
  return (
    <CtaBand
      image={image}
      eyebrow={`06 · ${site.reportName}`}
      title={latest?.title ?? "What happened on your street this quarter, in plain language."}
      body="Once a quarter, one page: what happened in Lakewood Ranch, Sarasota and Bradenton, what it means for you, and no sales pitch."
      minHeight="min-h-[560px]"
    >
      <LetterForm tone="dark" />
    </CtaBand>
  );
}
