"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ViewTransition, useEffect, useState } from "react";
import { SEARCH_COPY } from "@/lib/search/copy";
import { primaryNav, productFamilies, site, teamMenu } from "@/lib/site";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { Emblem } from "./brand/emblem";
import { CbMark } from "./cb-mark";
import { LinkPending } from "./link-pending";
import { ProductMenu, ProductMenuFoot, useMenuRow, type MenuSpec } from "./product-menu";
import { TrackedLink } from "./tracked-link";
import { Wordmark } from "./wordmark";

type Contact = { name: string; phone: string; phoneE164: string; email: string };

/** How far the page must move before the header tucks away on a phone, and the dead band a trackpad's tremor stays inside. */
const TUCK_AFTER = 160;
const DEAD_BAND = 6;

/**
 * The header stays at the top of every page. Its ground is decided by the
 * stylesheet (app/globals.css, ".site-header") from what the page says and
 * what this component measures: transparent over a page that marks its
 * photographic hero (data-header-overlay) until the page has moved 24px,
 * frosted glass everywhere else, solid navy while the phone menu is open.
 * On a phone it tucks away on a scroll down past the first screen and comes
 * back on the first scroll up, a route change, focus, or the menu
 * (html[data-scroll], which the action bar reads too). The wordmark always
 * returns to the very top of the home page.
 */
export function SiteHeader({ contacts, phoneE164 }: { contacts: Contact[]; phoneE164: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  // On the home page the hero photograph sits inside a paper frame; while it is under the header the glass follows the frame.
  const [cover, setCover] = useState(false);
  const [open, setOpen] = useState(false);
  const row = useMenuRow(pathname);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY;
    let ticking = false;
    const read = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const hero = document.querySelector("[data-header-overlay]");
      setCover(hero ? hero.getBoundingClientRect().bottom > (root.querySelector("header")?.offsetHeight ?? 70) : false);
      const delta = y - last;
      if (delta > DEAD_BAND && y > TUCK_AFTER) root.setAttribute("data-scroll", "down");
      else if (delta < -DEAD_BAND || y <= 24) root.setAttribute("data-scroll", "up");
      last = y;
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.removeAttribute("data-scroll");
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) document.documentElement.setAttribute("data-scroll", "up");
    // Everything behind the panel leaves the tab order while it is open.
    const behind = document.querySelectorAll<HTMLElement>("main, footer, [data-mobile-bar], [data-mobile-pill]");
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

  // The menus' labels get a faint shadow while the header is see-through over a photograph.
  const solid = scrolled || open;
  // On the home page the hero content is inset 56px inside the framed
  // photograph, and from xl the header follows; between lg and xl the full
  // inset would push the brokerage mark past the frame, so the home header is
  // inset 16px there.
  const home = pathname === "/";
  // One underline at a time: a page that belongs to a product (Tide Street under /sell) underlines its family, not the plain page.
  const inFamily = productFamilies.some((f) => f.items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)));
  const menus: MenuSpec[] = productFamilies.map((f) => ({
    key: f.key,
    name: f.name,
    title: f.title,
    items: f.items,
    family: f.key,
    foot: <ProductMenuFoot open={row.menu === f.key} onClose={() => row.close()} />,
  }));
  const team: MenuSpec = {
    ...teamMenu,
    foot: (
      <ul className="flex flex-col gap-1 border-t border-white/10 px-5 py-3">
        {contacts.map((c) => (
          <li key={c.name} className="flex items-baseline justify-between gap-4 text-[13px]">
            <span className="text-linen-200/75">{c.name.split(" ")[0]}</span>
            <TrackedLink
              event="Phone tap"
              props={{ where: "header" }}
              href={`tel:${c.phoneE164}`}
              tabIndex={row.menu === "team" ? undefined : -1}
              className="font-mono text-linen-200 transition-colors hover:text-white"
            >
              {c.phone}
            </TrackedLink>
          </li>
        ))}
      </ul>
    ),
  };

  return (
    <header
      data-ground="dark"
      data-scrolled={scrolled ? "true" : "false"}
      data-open={open ? "true" : "false"}
      data-home={home ? "true" : undefined}
      data-cover={cover ? "true" : undefined}
      className="site-header"
      // Keyboard users tabbing into a tucked header get it back.
      onFocusCapture={() => document.documentElement.setAttribute("data-scroll", "up")}
    >
      <div
        className={cn(
          "container-site flex h-full items-center justify-between gap-8",
          home && "lg:gap-6 lg:px-[calc(var(--gutter)+1rem)] xl:gap-8 xl:px-[calc(var(--gutter)+3.5rem)]",
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

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-6">
          {primaryNav.map((item) => {
            // The team is a small menu in the product menus' style: About, the timing form, referrals, reviews, and the two numbers.
            if (item.href === "/about") {
              return (
                <ProductMenu
                  key={item.href}
                  menu={team}
                  pathname={pathname}
                  open={row.menu === "team"}
                  switching={row.switching}
                  row={row}
                  solid={solid}
                  reducedMotion={reducedMotion}
                />
              );
            }
            const active = !inFamily && (pathname === item.href || pathname.startsWith(`${item.href}/`));
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
          {menus.map((m) => (
            <ProductMenu
              key={m.key}
              menu={m}
              pathname={pathname}
              open={row.menu === m.key}
              switching={row.switching}
              row={row}
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
            aria-label={open ? "Close the menu" : "Menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {/* The two words share one box and cross-fade, so the button never changes width. */}
            <span className="grid" aria-hidden="true">
              <span className="menu-toggle-word col-start-1 row-start-1" data-show={open ? "false" : "true"}>
                Menu
              </span>
              <span className="menu-toggle-word col-start-1 row-start-1 text-center" data-show={open ? "true" : "false"}>
                Close
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* The one full-navy screen: the contact overlay from the web design. */}
      <div id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu" hidden={!open} className="site-menu lg:hidden">
        <div className="container-site flex min-h-full flex-col gap-9 pt-6">
          <nav aria-label="Primary, mobile" className="flex flex-col">
            {primaryNav.map((item, i) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <div key={item.href} className="site-menu-item flex flex-col border-b border-linen-200/15" style={{ ["--i" as string]: i }}>
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
          {/* The three families side by side from 360px, so the menu fits about one screen. */}
          <nav aria-label="Products, mobile" className="grid gap-x-6 gap-y-7 min-[360px]:grid-cols-2 sm:grid-cols-3">
            {productFamilies.map((f, i) => (
              <div key={f.key} className="site-menu-item flex flex-col gap-3" style={{ ["--i" as string]: primaryNav.length + i }}>
                <p className="flex flex-col gap-1">
                  <span className="flex items-center gap-3">
                    <Emblem family={f.key} className="size-7" />
                    <span className={`font-display text-[28px] font-light leading-none text-white ${f.key === "encore" ? "italic" : ""}`}>{f.name}</span>
                  </span>
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
                        {i.label.replace(`${f.name} `, "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="site-menu-item flex flex-col gap-6" style={{ ["--i" as string]: primaryNav.length + productFamilies.length }}>
            <div className="grid gap-5 sm:grid-cols-2">
              {contacts.map((c) => (
                <div key={c.name} className="flex flex-col gap-1">
                  <p className="text-[14px] font-medium text-white">{c.name}</p>
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
            <div className="flex items-center justify-between gap-6">
              <p className="t-small text-linen-200/80">{site.brokerage}</p>
              <CbMark tone="white" width={160} className="hidden shrink-0 opacity-90 sm:block" />
            </div>
          </div>
          {/* Pinned to the foot of the panel whatever the screen's height: the warmest part of the menu, always in reach. */}
          <div className="site-menu-foot">
            <TrackedLink event="Phone tap" props={{ where: "header" }} href={`tel:${phoneE164}`} className="btn btn-outline-light">
              Call
            </TrackedLink>
            <TrackedLink event="Phone tap" props={{ where: "header-text" }} href={`sms:${phoneE164}`} className="btn btn-outline-light">
              Text
            </TrackedLink>
            <Link href="/contact" className="btn btn-linen">
              Tell us the timing
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
