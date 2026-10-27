import type { ReactNode } from "react";
import { TideMasthead } from "@/components/art/tide-art";
import { ProductLockup } from "@/components/brand/emblem";
import { Byline } from "@/components/byline";
import { getTeam } from "@/lib/content";
import { FamilyMotif } from "@/components/brand/marks";
import { productFamilies, site } from "@/lib/site";
import { MotionToggle } from "@/components/motion-toggle";
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
  /** On a phone, a short band (the lockup and the byline) so the page's own content starts inside the first screen. */
  compact?: boolean;
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
export async function Masthead({ route, title, titleId, as: Tag = "h1", crumbs, children, priority = true, titleClassName, className, compact = false }: Props) {
  const slot = mastheadSlot(route);
  // A product page, and the page of all of them, carries the team's photographs, small, as its maker's mark.
  const team = slot.kind === "photo" && (slot.family || route === "/tools") ? await getTeam() : [];
  const tide = slot.kind === "photo" && slot.family === "tide";
  // In the Tide grid every child but the lockup and the hairlines spans both columns.
  const span = tide ? "col-span-2" : "";
  const lockup = (() => {
    if (slot.kind !== "photo" || !slot.product) return null;
    for (const family of productFamilies) {
      const item = family.items.find((i) => i.id === slot.product);
      if (item) return { family, item };
    }
    return null;
  })();
  return (
    <section className={cn("relative grid grid-cols-1 overflow-hidden bg-navy", className)} aria-labelledby={titleId}>
      {/*
        The spacer, the band and the words share one grid cell. The spacer
        holds the band's proportion; the band stretches to the cell, so it
        grows with the words when they need more room (a long title on a phone).
      */}
      <div className={cn("col-start-1 row-start-1 sm:aspect-[2/1] lg:aspect-[3/1] lg:max-h-[600px]", compact ? "min-h-[160px]" : "aspect-[4/3]")} aria-hidden="true" />
      <div className="relative col-start-1 row-start-1">
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
            {/* Tide's motif sits with the words (below), not across the photograph. */}
            {slot.family !== "tide" ? <FamilyMotif family={slot.family} /> : null}
          </>
        ) : null}
      </div>
      {/* Encore's words start below its marquee's top. */}
      <div className={cn("relative col-start-1 row-start-1 flex flex-col justify-end", compact ? "pt-6 sm:pt-10" : "pt-10", slot.kind === "photo" && slot.family === "encore" && "md:pt-28")}>
        {/*
          Tide's masthead is a two-column grid so its three hairlines can run
          exactly the lockup's width (the first column is as wide as the
          lockup; everything else spans both), 16px under the byline.
        */}
        <div
          className={cn(
            "container-site gap-4",
            tide ? "grid grid-cols-[auto_minmax(0,1fr)]" : "flex flex-col",
            slot.kind === "photo" && (slot.family === "tide" || slot.family === "encore") ? cn(compact ? "pb-6" : "pb-14", "sm:pb-20 lg:pb-24") : "pb-10 sm:pb-12 lg:pb-16",
          )}
        >
          {crumbs ? <div className={span}>{crumbs}</div> : null}
          {lockup ? (
            <>
              {/* On a product's page the lockup is the title you see; the h1 says it in words, and one line of description follows. */}
              <Tag id={titleId} className="sr-only">
                {lockup.item.label}, by {site.name}
              </Tag>
              <ProductLockup family={lockup.family.key} product={lockup.item.label} size="hero" decorative className={cn("rise d1 mb-2 lg:mb-3", tide && "col-start-1")} />
            </>
          ) : null}
          {title && !lockup ? (
            <Tag id={titleId} className={cn("rise d2 t-display max-w-[820px] text-balance text-white text-shadow-photo", span, titleClassName)}>
              {title}
            </Tag>
          ) : null}
          {children ? <div className={cn("contents", tide && "[&>*]:col-span-2")}>{children}</div> : null}
          {team.length ? (
            <Byline people={team.map((m) => ({ name: m.name, headshot: m.headshot }))} tone="dark" size="sm" className={cn("rise d4 mt-2", span)} />
          ) : null}
          {tide ? (
            <div className="motif-tide-lockup col-start-1 mt-3" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </div>
      </div>
      {/* The one control for the band's drift, in the gutter below the words. */}
      <MotionToggle className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4" />
    </section>
  );
}
