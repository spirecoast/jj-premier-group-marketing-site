import { ThreePictures } from "./variants/three-pictures";
import { ThreePlain } from "./variants/three-plain";
import type { ThreeFacts } from "./three-facts";

export type { ThreeFacts } from "./three-facts";

/**
 * 05 · The three. Atlas, Encore and Tide as one family: the name set large,
 * what it is in a line, and a live fact from each so the panel is never
 * decorative. Nothing here is typed by hand; every number comes from the
 * data behind the product. The layout is one of the treatments in
 * ./variants, chosen here. "pictures" is the one that shipped; change the
 * default to switch the home page.
 */
export type ThreeVariant = "plain" | "pictures";

const VARIANTS = { plain: ThreePlain, pictures: ThreePictures } as const;

export function Three({ facts, variant = "pictures" }: { facts: ThreeFacts; variant?: ThreeVariant }) {
  const Variant = VARIANTS[variant];
  return <Variant facts={facts} />;
}
