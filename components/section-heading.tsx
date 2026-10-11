import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
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
  title,
  aside,
  tone = "light",
  size = "h1",
  as: Tag = "h2",
  className,
  titleClassName,
}: Props) {
  const titleColor = tone === "dark" ? "text-white" : "text-navy";
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="flex flex-col gap-4">
        <Tag className={cn(size === "display" ? "t-display" : "t-h1", titleColor, titleClassName)}>{title}</Tag>
      </div>
      {aside ? <div className="shrink-0 lg:max-w-[40%] lg:pb-1">{aside}</div> : null}
    </div>
  );
}
