import type { ReactNode } from "react";
import { TideMasthead } from "@/components/art/tide-art";
import { Photo } from "@/components/photo";
import { mastheadPhoto, mastheadSlot, type MastheadRoute } from "@/lib/content/mastheads";
import { cn } from "@/lib/utils";

type Props = {
  /** Which slot in lib/content/mastheads.ts to draw from. */
  route: MastheadRoute;
  eyebrow?: ReactNode;
  /** Without a title the band carries only the crumbs (and the eyebrow, if given): the heading stays on the page below. */
  title?: ReactNode;
  /** The id the page's landmark points at; set on the heading. */
  titleId?: string;
  as?: "h1" | "h2";
  /** Something above the eyebrow: a breadcrumb, usually. */
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
 * and 4:3 on phones, with the page's eyebrow and heading set over the calm
 * lower third in the hero grammar of /buy. The band is a photograph or a
 * piece drawn from the product's data, chosen in one data file
 * (lib/content/mastheads.ts) so a page never names its own picture. One
 * motion only, the slow drift the home hero uses (the art drifts the same
 * way), and none at all for anyone who asked for reduced motion.
 */
export function Masthead({ route, eyebrow, title, titleId, as: Tag = "h1", crumbs, children, priority = true, titleClassName, className }: Props) {
  const slot = mastheadSlot(route);
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
      </div>
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="container-site flex flex-col gap-4 pb-10 sm:pb-12 lg:pb-16">
          {crumbs}
          {eyebrow ? <p className="rise d1 t-eyebrow text-mist text-shadow-soft">{eyebrow}</p> : null}
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
