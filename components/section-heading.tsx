import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** "02" — the running number from the home page composition. Optional elsewhere. */
  number?: string;
  eyebrow: string;
  title: ReactNode;
  /** Right-hand slot: a link, a short note. */
  aside?: ReactNode;
  tone?: "light" | "dark";
  size?: "display" | "h1";
  as?: "h1" | "h2";
  className?: string;
  titleClassName?: string;
};

export function SectionHeading({
  number,
  eyebrow,
  title,
  aside,
  tone = "light",
  size = "h1",
  as: Tag = "h2",
  className,
  titleClassName,
}: Props) {
  const eyebrowColor = tone === "dark" ? "text-mist" : "text-amber";
  const titleColor = tone === "dark" ? "text-white" : "text-navy";
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-3.5">
        <p className={cn("t-eyebrow", eyebrowColor)}>
          {number ? `${number} · ` : null}
          {eyebrow}
        </p>
        <Tag className={cn(size === "display" ? "t-display" : "t-h1", titleColor, titleClassName)}>{title}</Tag>
      </div>
      {aside ? <div className="shrink-0 md:pb-1">{aside}</div> : null}
    </div>
  );
}
