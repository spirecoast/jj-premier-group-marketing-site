import type { ReactNode } from "react";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

/**
 * Full-bleed photograph with centred type. The photograph is the layout:
 * remove it and the section has no reason to exist.
 */
export function CtaBand({
  image,
  eyebrow,
  title,
  body,
  children,
  className,
  minHeight = "min-h-[520px]",
}: {
  image: ImageRef;
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
  minHeight?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-navy", minHeight, className)}>
      <Photo image={image} sizes="100vw" />
      <div className="absolute inset-0 bg-linear-to-b from-harbor-950/58 to-harbor-950/72" aria-hidden="true" />
      <div className="container-site relative flex min-h-[inherit] flex-col items-center justify-center gap-7 py-24 text-center">
        {eyebrow ? <p className="t-eyebrow text-mist">{eyebrow}</p> : null}
        <h2 className="t-display max-w-[900px] text-balance font-light text-white text-shadow-photo">{title}</h2>
        {body ? <p className="t-body max-w-[560px] font-medium text-white text-shadow-soft">{body}</p> : null}
        {children}
      </div>
    </section>
  );
}
