import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import type { ImageRef, Post } from "@/lib/content/types";

/** 07 · The quarterly letter. The latest headline, and one field. */
export function LetterBand({ image, latest }: { image: ImageRef; latest?: Post }) {
  return (
    <CtaBand
      image={image}
      eyebrow="07 · The quarterly letter"
      title={latest?.title ?? "Inventory doubled on the Ranch this quarter and prices did not move."}
      body="One page, once a quarter, no pitch. What your street actually did, and what we got wrong last time."
      minHeight="min-h-[560px]"
    >
      <LetterForm tone="dark" />
    </CtaBand>
  );
}
