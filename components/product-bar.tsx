"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ProductLockup } from "@/components/brand/emblem";
import { productFamilies, type ProductFamily } from "@/lib/site";
import { IntentLink } from "@/components/intent-link";

/** The pages each family's bar shows on. Pages whose first screen sits under the header (a place, a venue, an issue) keep the header alone. */
const ROUTES: Record<ProductFamily["key"], RegExp[]> = {
  atlas: [/^\/neighborhoods$/, /^\/neighborhoods\/match$/, /^\/relocate$/],
  encore: [/^\/calendar(\/.*)?$/],
  tide: [/^\/tide$/, /^\/sell\/sold$/, /^\/sell\/net-proceeds$/],
};

export function familyFor(pathname: string): ProductFamily | undefined {
  return productFamilies.find((f) => ROUTES[f.key].some((r) => r.test(pathname)));
}

/**
 * The product bar: under the site header on every page of a data product,
 * the family's name and mark on its own ground, then a tab for each product
 * built on it. On a phone the tabs drop the family's name ("Match", "Move")
 * and scroll sideways.
 */
export function ProductBar() {
  const pathname = usePathname();
  const family = familyFor(pathname);
  const tabs = useRef<HTMLUListElement>(null);
  // The current product: the longest href the path is, or sits under.
  const current = family
    ? [...family.items].filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]
    : undefined;

  // On a phone the tabs scroll: the current one is brought into view, and
  // the fade at the right edge is only drawn while there is more to scroll to.
  useEffect(() => {
    const el = tabs.current;
    if (!el) return;
    const overflow = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      if (left || right) el.setAttribute("data-overflow", left && right ? "both" : left ? "left" : "right");
      else el.removeAttribute("data-overflow");
    };
    overflow();
    const ro = new ResizeObserver(overflow);
    ro.observe(el);
    el.addEventListener("scroll", overflow, { passive: true });
    const here = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (here) {
      const box = el.getBoundingClientRect();
      const r = here.getBoundingClientRect();
      if (r.left < box.left || r.right > box.right) here.scrollIntoView({ inline: "center", block: "nearest" });
    }
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", overflow);
    };
  }, [pathname, current?.href]);

  if (!family) return null;

  return (
    <nav data-product-bar data-ground="dark" data-family={family.key} aria-label={`${family.name} products`} className="product-bar">
      <div className="container-site flex h-full items-center gap-5 sm:gap-7">
        <IntentLink href={family.items[0]!.href as Route} className="flex shrink-0 items-center transition-opacity hover:opacity-85">
          <ProductLockup family={family.key} size="bar" byline={false} decorative />
          <span className="sr-only">{family.name}</span>
        </IntentLink>
        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-white/20 sm:block" />
        <ul ref={tabs} className="product-bar-tabs flex h-full min-w-0 flex-1 items-stretch gap-5 overflow-x-auto sm:gap-8">
          {family.items.map((i) => (
            <li key={i.href} className="flex">
              <IntentLink href={i.href as Route} aria-current={current?.href === i.href ? "page" : undefined} className="product-tab">
                <span className="hidden lg:inline">{i.label}</span>
                <span className="lg:hidden">{i.label.replace(`${family.name} `, "")}</span>
              </IntentLink>
            </li>
          ))}
        </ul>
        <IntentLink href="/tools" className="hidden shrink-0 text-[13px] tracking-[0.02em] text-linen-200/75 transition-colors hover:text-white md:inline">
          All tools <span aria-hidden="true">→</span>
        </IntentLink>
      </div>
    </nav>
  );
}
