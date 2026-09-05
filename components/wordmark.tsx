import { cn } from "@/lib/utils";

type Props = {
  /** one-line: nav bars. waterline: the crossed lockup, once per page (footer). */
  variant?: "one-line" | "waterline";
  tone?: "light" | "dark";
  /** Ground colour class for the waterline knockout box. */
  ground?: string;
  className?: string;
};

/**
 * The wordmark, set live in Contralto (Cormorant Garamond stand-in).
 * Tracking and the waterline geometry follow the brand style document.
 */
export function Wordmark({
  variant = "one-line",
  tone = "light",
  ground = "bg-linen-200",
  className,
}: Props) {
  const color = tone === "light" ? "text-linen-200" : "text-navy";

  if (variant === "waterline") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-3", color, className)}>
        <span className="relative flex w-[220px] items-center justify-center">
          <span className="absolute inset-x-0 top-[62%] h-px bg-harbor-500" aria-hidden="true" />
          <span
            className={cn(
              "relative px-[15px] font-wordmark text-[56px] font-semibold leading-none tracking-[0.12em] indent-[0.12em]",
              ground,
            )}
          >
            JJ
          </span>
        </span>
        <span className="whitespace-nowrap font-wordmark text-[13px] font-semibold leading-none tracking-[0.44em] indent-[0.44em]">
          PREMIER GROUP
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-3.5", color, className)}>
      <span className="-mr-[0.1em] font-wordmark text-[30px] font-semibold leading-none tracking-[0.1em]">
        JJ
      </span>
      <span className="h-[30px] w-px bg-current opacity-50" aria-hidden="true" />
      <span className="-mr-[0.3em] font-wordmark text-[9px] font-semibold leading-[1.55] tracking-[0.3em]">
        PREMIER
        <br />
        GROUP
      </span>
    </span>
  );
}
