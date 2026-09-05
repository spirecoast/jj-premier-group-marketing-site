"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CbMark } from "./cb-mark";
import { Wordmark } from "./wordmark";

/** Routes whose first screen is a photograph the header sits over. */
const OVERLAY_ROUTES = [/^\/$/, /^\/neighborhoods\/[^/]+$/, /^\/venues\/[^/]+$/];

type Contact = { name: string; phone: string; phoneE164: string; email: string };

/**
 * The header is navy furniture. Over a photographic hero it starts
 * transparent and turns solid once the page scrolls; everywhere else it is
 * solid from the first pixel. Collapses to a full-navy menu below `lg`.
 */
export function SiteHeader({ contacts }: { contacts: Contact[] }) {
  const pathname = usePathname();
  const overlay = OVERLAY_ROUTES.some((r) => r.test(pathname));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
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

  const solid = !overlay || scrolled || open;
  // On the home page the hero content is inset 56px inside the framed photograph.
  const homeInset = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-header transition-[background-color,border-color] duration-300",
        solid
          ? "border-b border-sky-300/15 bg-navy/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className={cn("container-site flex h-full items-center justify-between gap-8", homeInset && "lg:px-[calc(var(--gutter)+3.5rem)]")}>
        <Link href="/" aria-label="JJ Premier Group home" className="shrink-0 transition-opacity hover:opacity-80">
          <Wordmark variant="one-line" tone="light" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "t-label border-b py-2 text-linen-200 transition-colors hover:text-white",
                  active ? "border-sky-300" : "border-transparent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-6">
          <CbMark tone="white" width={150} className="hidden opacity-90 md:block" />
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
          <nav aria-label="Primary, mobile" className="flex flex-col">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className="t-display border-b border-linen-200/15 py-4 text-linen-200 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {contacts.map((c) => (
                <div key={c.name} className="flex flex-col gap-1.5">
                  <p className="t-eyebrow text-mist">{c.name}</p>
                  <a href={`tel:${c.phoneE164}`} className="font-mono text-base text-linen-200 hover:text-white">
                    {c.phone}
                  </a>
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
