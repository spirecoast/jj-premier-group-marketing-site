import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  className,
  children,
  type = "button",
  ...rest
}: Common & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button type={type} className={cn("btn", variantClass[variant], className)} {...rest}>
      {children}
      {dash ? <span className="btn-dash" aria-hidden="true" /> : null}
    </button>
  );
}

/** "All 34 listings" — the uppercase link with a rule underneath. */
export function RuleLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href as Route} className={cn("link-rule", className)}>
      {children}
    </Link>
  );
}
