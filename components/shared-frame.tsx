"use client";

import { ViewTransition, type ReactNode } from "react";
import { useSharedTarget } from "@/lib/shared-element";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useSharedLinkKey } from "./shared-link";

type Props = {
  /** One name for the card and the hero, e.g. `evt-${slug}`. A CSS identifier: letters, digits, hyphens. */
  name: string;
  /** "source" is a card's picture, named only while it is the clicked one; "target" is a page hero, always named. */
  role: "source" | "target";
  className?: string;
  title?: string;
  children: ReactNode;
};

/**
 * The box a shared picture sits in. A card's box ("source") and the hero's
 * box ("target") carry the same view transition name during the route change
 * between them, so the picture grows from the card into the hero, and back
 * again on return (app/globals.css, ".vt-shared"). Nothing is named outside
 * that moment, and nothing moves for anyone who asked for reduced motion.
 */
export function SharedFrame({ name, role, className, title, children }: Props) {
  const target = useSharedTarget();
  const linkKey = useSharedLinkKey();
  const reduced = useReducedMotion();
  const active = role === "target" || (target !== null && target.name === name && target.key === linkKey);
  const on = active && !reduced;
  return (
    <ViewTransition name={on ? name : "auto"} share={on ? "vt-shared" : "none"} default="none">
      <div className={className} title={title}>
        {children}
      </div>
    </ViewTransition>
  );
}
