import { WhatWeDoPhoto } from "./variants/what-we-do-photo";
import { WhatWeDoPlain } from "./variants/what-we-do-plain";
import { WhatWeDoSpread } from "./variants/what-we-do-spread";
import { WhatWeDoTimeline } from "./variants/what-we-do-timeline";

export { BOTH_PROMISES, BUYER_PROMISES, SELLER_PROMISES, WHAT_WE_DO_COPY, type Step } from "./what-we-do-copy";

/**
 * 04 · What we do for you. The copy lives in ./what-we-do-copy; the layout is
 * one of the treatments in ./variants, chosen here. "timeline" is the one
 * that shipped (docs/screenshots/home-design/index.html has the four side by
 * side); change the default to switch the home page.
 */
export type WhatWeDoVariant = "plain" | "photo" | "timeline" | "spread";

const VARIANTS = {
  plain: WhatWeDoPlain,
  photo: WhatWeDoPhoto,
  timeline: WhatWeDoTimeline,
  spread: WhatWeDoSpread,
} as const;

export function WhatWeDo({ variant = "timeline" }: { variant?: WhatWeDoVariant }) {
  const Variant = VARIANTS[variant];
  return <Variant />;
}
