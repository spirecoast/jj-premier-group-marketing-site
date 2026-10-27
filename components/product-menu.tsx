"use client";

import type { Route } from "next";
import { ViewTransition, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Emblem } from "@/components/brand/emblem";
import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";
import { IntentLink } from "@/components/intent-link";

/** One menu in the desktop header's row: a product family, or the team. */
export type MenuSpec = {
  key: string;
  /** The button's text. */
  name: string;
  /** The panel's first line, what the menu is for. */
  title: string;
  items: readonly { href: string; label: string; short: string }[];
  /** The pages the Sky rule marks under this name. Default: any item's page. A page that belongs to a product family is marked under that family instead. */
  activeWhen?: readonly string[];
  /** A product family: its emblem on the panel and its name set in the display serif. */
  family?: ProductFamily["key"];
  /** The panel's last row. */
  foot?: ReactNode;
};

const OPEN_INTENT_MS = 120;
const CLOSE_AFTER_MS = 200;

/**
 * Hover intent for a row of menus. A mouse must rest on a name for 120ms
 * before its panel opens, so a sweep across the row opens nothing; once one
 * is open its siblings take over at once (menu-bar behaviour, a cross-fade
 * in place of the slide); and the row closes 200ms after the pointer has
 * left it altogether. Click, Enter and the arrow keys are instant, and
 * touch never opens on hover.
 */
export function useMenuRow(pathname: string) {
  const [menu, setMenu] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const current = useRef<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  };
  const set = useCallback((key: string | null, viaSwitch = false) => {
    current.current = key;
    setSwitching(viaSwitch);
    setMenu(key);
  }, []);

  const enter = useCallback(
    (key: string) => {
      clearTimers();
      if (current.current === key) return;
      if (current.current !== null) set(key, true);
      else openTimer.current = setTimeout(() => set(key), OPEN_INTENT_MS);
    },
    [set],
  );
  const leave = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => set(null), CLOSE_AFTER_MS);
  }, [set]);
  const toggle = useCallback(
    (key: string) => {
      clearTimers();
      set(current.current === key ? null : key);
    },
    [set],
  );
  const open = useCallback(
    (key: string) => {
      clearTimers();
      set(key);
    },
    [set],
  );
  /** Close one menu (only if it is the open one), or whichever is open. */
  const close = useCallback(
    (key?: string) => {
      clearTimers();
      if (key === undefined || current.current === key) set(null);
    },
    [set],
  );

  // A route change closes whatever is open: adjusted during the render that sees the new path, not in an effect.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setSwitching(false);
    setMenu(null);
  }
  useEffect(() => {
    current.current = menu;
  }, [menu]);
  useEffect(() => clearTimers, [pathname]);

  return { menu, switching, enter, leave, toggle, open, close };
}

type Props = {
  menu: MenuSpec;
  pathname: string;
  open: boolean;
  /** Another menu was open when this one took over: a cross-fade, no slide. */
  switching: boolean;
  row: ReturnType<typeof useMenuRow>;
  /** Over the hero photograph the label gets a faint shadow. */
  solid: boolean;
  reducedMotion: boolean;
};

/**
 * One menu in the desktop header: its name as a button and under it a
 * frosted panel listing each item with a few words on what it is. Opens on
 * hover intent for a mouse, on click, Enter or ArrowDown for everyone;
 * Escape, a click elsewhere, or focus leaving the menu closes it, and the
 * arrow keys walk the panel.
 */
export function ProductMenu({ menu, pathname, open, switching, row, solid, reducedMotion }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusFirstWhenOpen = useRef(false);
  const active = (menu.activeWhen ?? menu.items.map((i) => i.href)).some((href) => pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      row.close(menu.key);
      button.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) row.close(menu.key);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, row, menu.key]);

  const links = () => Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);

  // ArrowDown on the name opens the panel and lands on its first link.
  useEffect(() => {
    if (!open || !focusFirstWhenOpen.current) return;
    focusFirstWhenOpen.current = false;
    links()[0]?.focus();
  });

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    if (open) links()[0]?.focus();
    else {
      focusFirstWhenOpen.current = true;
      row.open(menu.key);
    }
  };
  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = links();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (to < 0) button.current?.focus();
    else all[Math.min(to, all.length - 1)]?.focus();
  };

  const hoverIn = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    row.enter(menu.key);
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    row.leave();
  };
  // Focus moving anywhere outside this menu (the next item, the search button, the page) closes it.
  const onBlur = (e: React.FocusEvent) => {
    if (open && !root.current?.contains(e.relatedTarget as Node | null)) row.close(menu.key);
  };

  return (
    <div ref={root} className="relative" onPointerEnter={hoverIn} onPointerLeave={hoverOut} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => row.toggle(menu.key)}
        onKeyDown={onButtonKey}
        className={cn(
          "nav-link relative flex h-8 items-center gap-1.5 whitespace-nowrap text-linen-200 transition-colors hover:text-white",
          open && "text-white",
          !solid && "[text-shadow:0_1px_2px_rgb(0_0_0/0.35)]",
        )}
      >
        {menu.family ? (
          <span className="font-display text-[19px] font-light leading-none tracking-[-0.01em]">{menu.name}</span>
        ) : (
          <span className="t-label">{menu.name}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={cn("mt-0.5 transition-transform duration-(--dur-panel)", open && "rotate-180")}>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {active ? (
          <ViewTransition name="nav-underline" default={reducedMotion ? "none" : "vt-underline"}>
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-sky-300" />
          </ViewTransition>
        ) : null}
      </button>

      <div
        id={id}
        ref={panel}
        className="product-menu"
        data-open={open ? "true" : undefined}
        data-switch={switching ? "true" : undefined}
        hidden={!open && reducedMotion}
        onKeyDown={onPanelKey}
      >
        <div className="product-menu-panel">
          <p className="flex items-center gap-2.5 px-5 pb-2 pt-4 text-[12px] tracking-[0.02em] text-linen-200/70">
            {menu.family ? <Emblem family={menu.family} className="size-5" /> : null}
            {menu.title}
          </p>
          <ul className="flex flex-col pb-2">
            {menu.items.map((i) => {
              const here = pathname === i.href;
              return (
                <li key={i.href}>
                  <IntentLink
                    href={i.href as Route}
                    aria-current={here ? "page" : undefined}
                    onClick={() => row.close()}
                    tabIndex={open ? undefined : -1}
                    className="product-menu-item"
                  >
                    <span className="font-display text-[19px] font-light leading-tight text-white">{i.label}</span>
                    <span className="text-[13px] leading-snug text-linen-200/75">{i.short}</span>
                  </IntentLink>
                </li>
              );
            })}
          </ul>
          {menu.foot}
        </div>
      </div>
    </div>
  );
}

/** The "All tools" row under a product family's panel. */
export function ProductMenuFoot({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <IntentLink
      href="/tools"
      onClick={onClose}
      tabIndex={open ? undefined : -1}
      className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[12px] tracking-[0.04em] text-linen-200/80 transition-colors hover:text-white"
    >
      All tools
      <span aria-hidden="true">→</span>
    </IntentLink>
  );
}
