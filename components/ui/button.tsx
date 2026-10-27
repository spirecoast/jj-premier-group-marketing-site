import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The site's buttons, on the `.btn` classes in app/globals.css: one height
 * (--btn-h), square corners, a hairline dash after a primary label. Every
 * button and button-shaped link on the site should come from here rather
 * than from a raw `btn …` class string, so a change to the system lands in
 * one place.
 */
export type ButtonVariant = "navy" | "linen" | "outline" | "outline-light" | "teal";

const variantClass: Record<ButtonVariant, string> = {
  navy: "btn-navy",
  linen: "btn-linen",
  outline: "btn-outline",
  "outline-light": "btn-outline-light",
  teal: "btn-teal",
};

type Common = {
  variant?: ButtonVariant;
  /** The 22px hairline that trails the label on primary actions. */
  dash?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "navy",
  dash,
  className,
  children,
  ...rest
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href as Route} className={cn("btn", variantClass[variant], className)} {...rest}>
      {children}
      {dash ? <span className="btn-dash" aria-hidden="true" /> : null}
    </Link>
  );
}

export function Button({
  variant = "navy",
  dash,
  pending = false,
  pendingLabel,
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: Common & {
  /** While a submission is in flight: the button is busy and cannot be pressed twice; the label can change. */
  pending?: boolean;
  pendingLabel?: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button type={type} className={cn("btn", variantClass[variant], className)} aria-busy={pending || undefined} disabled={disabled || pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
      {dash ? <span className="btn-dash" aria-hidden="true" /> : null}
    </button>
  );
}

/** "All 34 listings" — the uppercase link with a rule underneath. */
export function RuleLink({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href as Route} className={cn("link-rule", className)} {...rest}>
      {children}
    </Link>
  );
}

/** The same rule link as a button, for Back, Skip, Copy and the like. */
export function RuleButton({ className, children, type = "button", ...rest }: { className?: string; children: ReactNode } & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button type={type} className={cn("link-rule", className)} {...rest}>
      {children}
    </button>
  );
}
