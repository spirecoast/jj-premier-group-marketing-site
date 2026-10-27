"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps, type FocusEvent, type MouseEvent, type TouchEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A link that fetches its page when someone shows they mean to follow it
 * (pointer over it, keyboard focus, a finger down) instead of as soon as it
 * scrolls into view. For the footer, the menus and other secondary links: a
 * page with the header and footer on it would otherwise fetch fifty routes on
 * load. The primary nav keeps next/link's viewport prefetch.
 *
 * `prefetch={false}` on a Link also turns off its own hover prefetch, which is
 * why this calls router.prefetch itself.
 */
export function IntentLink({ href, onMouseEnter, onFocus, onTouchStart, ...rest }: Props) {
  const router = useRouter();
  const done = useRef(false);
  const warm = () => {
    if (done.current || typeof href !== "string" || !href.startsWith("/")) return;
    done.current = true;
    router.prefetch(href);
  };
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        warm();
        onFocus?.(e);
      }}
      onTouchStart={(e: TouchEvent<HTMLAnchorElement>) => {
        warm();
        onTouchStart?.(e);
      }}
      {...rest}
    />
  );
}
