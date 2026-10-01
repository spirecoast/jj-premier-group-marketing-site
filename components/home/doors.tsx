import { DoorsPhoto } from "./variants/doors-photo";
import { DoorsPlain } from "./variants/doors-plain";

export { DOORS, type Door } from "./doors-copy";

/**
 * 03 · Buy or sell. Two doors, one line each on what happens first, and a
 * quiet second link under each. The copy lives in ./doors-copy; the layout
 * is one of the treatments in ./variants, chosen here. "photo" is the one
 * that shipped; change the default to switch the home page.
 */
export type DoorsVariant = "plain" | "photo";

const VARIANTS = { plain: DoorsPlain, photo: DoorsPhoto } as const;

export function Doors({ variant = "photo" }: { variant?: DoorsVariant }) {
  const Variant = VARIANTS[variant];
  return <Variant />;
}
