"use client";

import type { Route } from "next";
import Link from "next/link";
import { ViewTransition, useEffect, useId, useRef } from "react";
import { FamilyMark } from "@/components/brand/marks";
import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  family: ProductFamily;
  pathname: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Over the hero photograph the label gets a faint shadow. */
  solid: boolean;
  reducedMotion: boolean;
};

/**
 * One product family in the desktop header: the family's name as a button,
 * and under it a frosted panel listing each product with a few words on
 * what it does. Opens on hover for a mouse, on click or Enter for everyone;
 * Escape or a click elsewhere closes it and gives focus back to the button.
 */
export function ProductMenu({ family, pathname, open, onOpen, onClose, solid, reducedMotion }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = family.items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      button.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, onClose]);

  useEffect(() => () => {
    if (leave.current) clearTimeout(leave.current);
  }, []);

  const hoverIn = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (leave.current) clearTimeout(leave.current);
    onOpen();
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    leave.current = setTimeout(onClose, 160);
  };

  return (
    <div ref={root} className="relative" onPointerEnter={hoverIn} onPointerLeave={hoverOut}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? onClose() : onOpen())}
        className={cn(
          "nav-link relative flex h-8 items-center gap-1.5 whitespace-nowrap text-linen-200 transition-colors hover:text-white",
          open && "text-white",
          !solid && "[text-shadow:0_1px_2px_rgb(0_0_0/0.35)]",
        )}
      >
        <span className="font-display text-[19px] font-light leading-none tracking-[-0.01em]">{family.name}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={cn("mt-0.5 transition-transform duration-300", open && "rotate-180")}>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {active ? (
          <ViewTransition name="nav-underline" default={reducedMotion ? "none" : "vt-underline"}>
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-sky-300" />
          </ViewTransition>
        ) : null}
      </button>

      <div id={id} className="product-menu" data-open={open ? "true" : undefined} hidden={!open && reducedMotion}>
        <div className="product-menu-panel">
          <p className="flex items-center justify-between gap-3 px-5 pb-2 pt-4 text-[12px] tracking-[0.02em] text-linen-200/70">
            {family.title}
            <FamilyMark family={family.key} />
          </p>
          <ul className="flex flex-col pb-2">
            {family.items.map((i) => {
              const here = pathname === i.href;
              return (
                <li key={i.href}>
                  <Link
                    href={i.href as Route}
                    aria-current={here ? "page" : undefined}
                    onClick={onClose}
                    tabIndex={open ? undefined : -1}
                    className="product-menu-item"
                  >
                    <span className="font-display text-[19px] font-light leading-tight text-white">{i.label}</span>
                    <span className="text-[13px] leading-snug text-linen-200/75">{i.short}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/tools"
            onClick={onClose}
            tabIndex={open ? undefined : -1}
            className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[12px] tracking-[0.04em] text-linen-200/80 transition-colors hover:text-white"
          >
            All tools
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
