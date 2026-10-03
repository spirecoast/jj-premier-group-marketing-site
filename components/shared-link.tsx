"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useId, type ComponentProps } from "react";
import { markShared } from "@/lib/shared-element";
import { cn } from "@/lib/utils";
import { LinkPending } from "./link-pending";

const LinkKey = createContext<string | null>(null);

/** The key of the enclosing SharedLink, read by the SharedFrame inside it. */
export function useSharedLinkKey() {
  return useContext(LinkKey);
}

/* Link is generic over the typed route, so this stays generic too and a card's
   template href still typechecks. */
type Props<T extends string> = ComponentProps<typeof Link<T>> & {
  /** The view transition name the page it opens carries on its hero. */
  shared: string;
};

/**
 * A card link whose picture grows into the hero of the page it opens. On
 * click it records this link and the shared name, so the SharedFrame inside
 * it takes the name for the route change and pairs with the hero's. The
 * pair only forms when the page is ready at the moment of the change (a
 * loading state has no hero to pair with), so the link also prefetches on
 * hover, focus and touch, ahead of the viewport prefetch Link already does.
 */
export function SharedLink<T extends string>({ shared, onClick, onMouseEnter, onFocus, onTouchStart, className, children, ...rest }: Props<T>) {
  const key = useId();
  const router = useRouter();
  const warm = () => {
    if (typeof rest.href === "string") router.prefetch(rest.href);
  };
  return (
    <LinkKey.Provider value={key}>
      <Link
        {...rest}
        // relative, so the pending veil (components/link-pending.tsx) covers the card.
        className={cn("relative", className)}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          warm();
        }}
        onFocus={(e) => {
          onFocus?.(e);
          warm();
        }}
        onTouchStart={(e) => {
          onTouchStart?.(e);
          warm();
        }}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) markShared({ name: shared, key });
        }}
      >
        {children}
        <LinkPending />
      </Link>
    </LinkKey.Provider>
  );
}
