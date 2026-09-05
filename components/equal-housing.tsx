import { cn } from "@/lib/utils";

/** The Equal Housing Opportunity mark, drawn inline so it prints in any ink. */
export function EqualHousingMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-current", className)}
      title="Equal Housing Opportunity"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="none">
        <path d="M13 3.5 2.5 12h3v9.5h15V12h3L13 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 14.5h8M9 17.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
      <span className="sr-only">Equal Housing Opportunity</span>
    </span>
  );
}
