import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import type { ImageRef } from "@/lib/content/types";

/** Tide, the newsletter: one line about what it is, and one field. */
export function LetterBand({ image }: { image: ImageRef }) {
  return (
    <CtaBand
      image={image}
      title="Get the monthly market report for Lakewood Ranch, Sarasota and Bradenton."
      minHeight="min-h-[560px]"
    >
      <LetterForm tone="dark" />
    </CtaBand>
  );
}
