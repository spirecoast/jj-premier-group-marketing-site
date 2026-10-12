import type { ReactNode } from "react";
import { TideMasthead } from "@/components/art/tide-art";
import { ProductLockup } from "@/components/brand/emblem";
import { FamilyMotif } from "@/components/brand/marks";
import { productFamilies } from "@/lib/site";
import { Photo } from "@/components/photo";
import { mastheadPhoto, mastheadSlot, type MastheadRoute } from "@/lib/content/mastheads";
import { cn } from "@/lib/utils";

type Props = {
  /** Which slot in lib/content/mastheads.ts to draw from. */
  route: MastheadRoute;
  /** Without a title the band carries only the crumbs: the heading stays on the page below. */
  title?: ReactNode;
  /** The id the page's landmark points at; set on the heading. */
  titleId?: string;
  as?: "h1" | "h2";
  /** Something above the title: a breadcrumb, usually. */
  crumbs?: ReactNode;
  /** Something after the title: a line of links, a short note. */
  children?: ReactNode;
  /** The masthead is the first paint on every page that opens with it; pass false when it is not. */
  priority?: boolean;
  titleClassName?: string;
  className?: string;
};

/**
 * The masthead: a full-width band that opens a page, 3:1 from the desktop
 * and 4:3 on phones, with the page's heading set over the calm
 * lower third in the hero grammar of /buy. The band is a photograph or a
 * piece drawn from the product's data, chosen in one data file
 * (lib/content/mastheads.ts) so a page never names its own picture. One
 * motion only, the slow drift the home hero uses (the art drifts the same
 * way), and none at all for anyone who asked for reduced motion.
 */
export function Masthead({ route, title, titleId, as: Tag = "h1", crumbs, children, priority = true, titleClassName, className }: Props) {
  const slot = mastheadSlot(route);
  const lockup = (() => {
    if (slot.kind !== "photo" || !slot.product) return null;
    for (const family of productFamilies) {
      const item = family.items.find((i) => i.id === slot.product);
      if (item) return { family, item };
    }
    return null;
  })();
  return (
    <section className={cn("relative overflow-hidden bg-navy", className)} aria-labelledby={titleId}>
      <div className="relative aspect-[4/3] sm:aspect-[2/1] lg:aspect-[3/1] lg:max-h-[600px]">
        {slot.kind === "art" ? (
          <TideMasthead alt={slot.alt} />
        ) : (
          /* The band is the viewport's width at every size; it is the page's first paint, so it loads eagerly. */
          <Photo image={mastheadPhoto(slot)} priority={priority} sizes="100vw" className="masthead-img" />
        )}
        <div className={cn("masthead-shade", slot.kind === "art" && "masthead-shade-art")} aria-hidden="true" />
        {slot.kind === "photo" && slot.family ? (
          <>
            <div className={`masthead-tint-${slot.family} absolute inset-0`} aria-hidden="true" />
            <FamilyMotif family={slot.family} />
          </>
        ) : null}
      </div>
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className={cn("container-site flex flex-col gap-4", slot.kind === "photo" && (slot.family === "tide" || slot.family === "encore") ? "pb-14 sm:pb-20 lg:pb-24" : "pb-10 sm:pb-12 lg:pb-16")}>
          {crumbs}
          {lockup ? (
            <ProductLockup family={lockup.family.key} familyName={lockup.family.name} name={lockup.item.label} tone="dark" size="hero" className="rise d1 mb-1" />
          ) : null}
          {title ? (
            <Tag id={titleId} className={cn("rise d2 t-display max-w-[820px] text-balance text-white text-shadow-photo", titleClassName)}>
              {title}
            </Tag>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
