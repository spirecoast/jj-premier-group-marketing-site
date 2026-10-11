"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ViewTransition, useCallback, useEffect, useState } from "react";
import { SEARCH_COPY } from "@/lib/search/copy";
import { primaryNav, productFamilies, site } from "@/lib/site";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { CbMark } from "./cb-mark";
import { LinkPending } from "./link-pending";
import { ProductMenu } from "./product-menu";
import { TrackedLink } from "./tracked-link";
import { Wordmark } from "./wordmark";

/** Routes whose first screen is a photograph the header sits over. */
const OVERLAY_ROUTES = [/^\/$/, /^\/(buy|sell)$/, /^\/neighborhoods\/[^/]+$/, /^\/venues\/[^/]+$/, /^\/tide\/\d{4}-\d{2}$/];

type Contact = { name: string; phone: string; phoneE164: string; email: string };

/**
 * The header stays at the top of every page, however far it scrolls. Over a
 * photographic hero it starts transparent and turns to frosted glass once the
 * page scrolls (only if the page marks its hero with data-header-overlay);
 * everywhere else it is glass from the first pixel (.header-glass in
 * globals.css). The wordmark always returns to the very top of the home page.
 * Collapses to a full-navy menu below `lg`.
 */
export function SiteHeader({ contacts }: { contacts: Contact[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const overlay = OVERLAY_ROUTES.some((r) => r.test(pathname));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Which product menu is open on the desktop, if any; one at a time.
  const [menu, setMenu] = useState<string | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let ticking = false;
    const read = () => {
      setScrolled(window.scrollY > 24);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(read);
      }
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    // Everything behind the panel leaves the tab order while it is open.
    const behind = document.querySelectorAll<HTMLElement>("main, footer, [data-mobile-bar]");
    behind.forEach((el) => el.toggleAttribute("inert", open));
    return () => {
      document.documentElement.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ⌘K / Ctrl+K opens search from anywhere; on /search it puts the cursor back in the box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      const box = document.getElementById("site-search-q");
      if (box instanceof HTMLInputElement) {
        box.focus();
        box.select();
      } else router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const solid = !overlay || scrolled || open;
  // On the home page the hero content is inset 56px inside the framed
  // photograph, and from xl the header follows; between lg and xl the full
  // inset would push the brokerage mark past the frame, so the home header is
  // inset 16px there.
  const homeInset = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-header transition-[background-color,border-color] duration-300 ease-[var(--ease-brand)]",
        // No backdrop blur while the menu is open: a backdrop-filter makes the
        // header the containing block for the fixed menu panel, which would
        // then collapse to the header's own height.
        open
          ? "border-b border-sky-300/15 bg-navy"
          : solid
            ? "header-glass border-b border-sky-300/15"
            : // header-overlay: CSS keeps it solid unless the page really has a hero under it (data-header-overlay).
              "header-overlay border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "container-site flex h-full items-center justify-between gap-8",
          homeInset && "lg:gap-6 lg:px-[calc(var(--gutter)+1rem)] xl:gap-8 xl:px-[calc(var(--gutter)+3.5rem)]",
        )}
      >
        <Link
          href="/"
          aria-label="JJ Premier Group home"
          className="shrink-0 transition-opacity hover:opacity-80"
          onClick={(e) => {
            // Already home: back to the very top, the hero whole, no anchor left in the address.
            if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            window.history.replaceState(window.history.state, "", "/");
            window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
          }}
        >
          <Wordmark variant="one-line" tone="light" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-7">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className="nav-link relative flex h-8 items-center whitespace-nowrap text-linen-200 transition-colors hover:text-white"
              >
                <span className="t-label">{item.label}</span>
                <LinkPending />
                {active ? (
                  // The one Sky rule under the current page. It carries a view
                  // transition name, so on a route change it slides from the old
                  // item to the new one instead of blinking between them.
                  <ViewTransition name="nav-underline" default={reducedMotion ? "none" : "vt-underline"}>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-sky-300" />
                  </ViewTransition>
                ) : null}
              </Link>
            );
          })}
          {/* The hairline between the pages and the product families. */}
          <span aria-hidden="true" className="h-5 w-px shrink-0 self-center bg-linen-200/25" />
          {productFamilies.map((f) => (
            <ProductMenu
              key={f.key}
              family={f}
              pathname={pathname}
              open={menu === f.key}
              onOpen={() => setMenu(f.key)}
              onClose={closeMenu}
              solid={solid}
              reducedMotion={reducedMotion}
            />
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {/* A 44px target that takes 16px of the row: the negative margins tuck it into the gaps. */}
          <Link
            href="/search"
            aria-label={SEARCH_COPY.label}
            title={`${SEARCH_COPY.shortcut} (⌘K or Ctrl+K)`}
            aria-current={pathname === "/search" ? "page" : undefined}
            className="-ml-3 -mr-4 flex h-11 w-11 shrink-0 items-center justify-center text-linen-200 transition-colors hover:text-white"
          >
            <Search aria-hidden="true" size={19} strokeWidth={1.5} />
          </Link>
          <CbMark tone="white" width={185} className="hidden shrink-0 opacity-90 md:block" />
          <button
            type="button"
            className="t-label flex h-11 items-center px-2 text-linen-200 transition-colors hover:text-white lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* The one full-navy screen: the contact overlay from the web design. */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-header z-40 overflow-y-auto bg-navy lg:hidden"
      >
        <div className="container-site flex min-h-full flex-col justify-between gap-12 py-10">
          <div className="flex flex-col gap-10">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {primaryNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <div key={item.href} className="flex flex-col border-b border-linen-200/15">
                    <Link
                      href={item.href as Route}
                      aria-current={active ? "page" : undefined}
                      className="py-4 text-linen-200 transition-colors hover:text-white"
                    >
                      <span className="t-display">{item.label}</span>
                    </Link>
                    {item.secondary ? (
                      // The one quieter line under an item: the planner under Buy.
                      <Link
                        href={item.secondary.href as Route}
                        className="t-small -mt-1 self-start pb-4 text-linen-200/80 transition-colors hover:text-white"
                      >
                        {item.secondary.label}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </nav>
            <nav aria-label="Products, mobile" className="grid gap-8 sm:grid-cols-3">
              {productFamilies.map((f) => (
                <div key={f.key} className="flex flex-col gap-3">
                  <p className="flex items-baseline gap-3">
                    <span className="font-display text-[28px] font-light leading-none text-white">{f.name}</span>
                    <span className="text-[12px] text-linen-200/60">{f.title}</span>
                  </p>
                  <ul className="flex flex-col border-l border-sky-300/30 pl-4">
                    {f.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href as Route}
                          aria-current={pathname === i.href ? "page" : undefined}
                          className="block py-2 text-[16px] text-linen-200 transition-colors hover:text-white aria-[current=page]:text-sky-300"
                        >
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {contacts.map((c) => (
                <div key={c.name} className="flex flex-col gap-1.5">
                  <p className="t-eyebrow text-mist">{c.name}</p>
                  <TrackedLink
                    event="Phone tap"
                    props={{ where: "header" }}
                    href={`tel:${c.phoneE164}`}
                    className="font-mono text-base text-linen-200 hover:text-white"
                  >
                    {c.phone}
                  </TrackedLink>
                  <a href={`mailto:${c.email}`} className="t-small break-all text-linen-200 hover:text-white">
                    {c.email}
                  </a>
                </div>
              ))}
            </div>
            <p className="t-small text-linen-200/80">{site.brokerage}</p>
            <div className="flex items-center justify-between gap-6 border-t border-linen-200/15 pt-6">
              <Link href="/contact" className="btn btn-linen">
                Tell us the timing
              </Link>
              <CbMark tone="white" width={200} className="hidden sm:block opacity-90" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
