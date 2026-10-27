"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A labelled control: the `.field` block from app/globals.css with the label,
 * the control, an optional hint and the error under it, wired together. The
 * control reads its id, `aria-describedby` and `aria-invalid` from the Field
 * through context, so a form never hand-rolls that again:
 *
 *   <Field label="Arriving" hint="Up to 14 days.">
 *     <Input type="date" … />
 *   </Field>
 *
 * `optional` adds the "(optional)" tag in Graphite 500 (5.4:1 on Paper), the
 * one way the site says a field can be skipped.
 */
type FieldContext = { id: string; describedBy?: string; invalid: boolean };
const Ctx = createContext<FieldContext | null>(null);

export function Field({
  id: given,
  label,
  hint,
  error,
  optional = false,
  tone = "light",
  className,
  labelClassName,
  children,
}: {
  id?: string;
  label: ReactNode;
  /** One line under the control: what the figure includes, what to type. */
  hint?: ReactNode;
  /** The first validation message; it announces itself. */
  error?: string;
  optional?: boolean;
  tone?: "light" | "dark";
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  const uid = useId();
  const id = given ?? uid;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [errId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <Ctx.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("field", className)}>
        <label htmlFor={id} className={cn("field-label", tone === "dark" && "text-mist", labelClassName)}>
          {label}
          {optional ? <OptionalTag tone={tone} /> : null}
        </label>
        {children}
        {hint ? (
          <p id={hintId} className="t-note">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errId} className="t-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

/** "(optional)" after a label: sentence case, no tracking, readable on both grounds. */
export function OptionalTag({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <span className={cn("normal-case tracking-normal", tone === "light" ? "text-graphite-500" : "text-mist")}> (optional)</span>;
}

function useControl(className?: string, invalid?: boolean) {
  const ctx = useContext(Ctx);
  return {
    id: ctx?.id,
    "aria-describedby": ctx?.describedBy,
    "aria-invalid": invalid ?? (ctx?.invalid || undefined),
    className: cn("field-input", className),
  };
}

export function Input({ className, ...rest }: Omit<ComponentProps<"input">, "id">) {
  const ctl = useControl(className);
  return <input {...ctl} {...rest} />;
}

export function Select({ className, children, ...rest }: Omit<ComponentProps<"select">, "id">) {
  const ctl = useControl(className);
  return (
    <select {...ctl} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: Omit<ComponentProps<"textarea">, "id">) {
  const ctl = useControl(cn("resize-y", className));
  return <textarea {...ctl} {...rest} />;
}

/** A labelled check box on one line, the label as the hit area. */
export function Checkbox({ className, children, ...rest }: { className?: string; children: ReactNode } & Omit<ComponentProps<"input">, "type" | "className" | "children">) {
  return (
    <label className={cn("t-small flex cursor-pointer items-start gap-3 text-body", className)}>
      <input type="checkbox" className="mt-1 size-4 shrink-0 accent-navy" {...rest} />
      <span>{children}</span>
    </label>
  );
}
