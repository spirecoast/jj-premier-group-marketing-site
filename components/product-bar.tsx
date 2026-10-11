"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FamilyMark } from "@/components/brand/marks";
import { productFamilies, type ProductFamily } from "@/lib/site";

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
  if (!family) return null;
  // The current product: the longest href the path is, or sits under.
  const current = [...family.items]
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav data-product-bar data-family={family.key} aria-label={`${family.name} products`} className="product-bar">
      <div className="container-site flex h-full items-center gap-5 sm:gap-7">
        <Link href={family.items[0]!.href as Route} className="flex shrink-0 items-center gap-2.5 text-white transition-opacity hover:opacity-85">
          <span className="font-display text-[24px] font-extralight leading-none tracking-[-0.01em] sm:text-[27px]">{family.name}</span>
          <FamilyMark family={family.key} className="mt-1" />
        </Link>
        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-white/20 sm:block" />
        <ul className="product-bar-tabs flex h-full min-w-0 flex-1 items-stretch gap-5 overflow-x-auto sm:gap-8">
          {family.items.map((i) => (
            <li key={i.href} className="flex">
              <Link href={i.href as Route} aria-current={current?.href === i.href ? "page" : undefined} className="product-tab">
                <span className="hidden lg:inline">{i.label}</span>
                <span className="lg:hidden">{i.label.replace(`${family.name} `, "")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/tools" className="hidden shrink-0 text-[13px] tracking-[0.02em] text-linen-200/75 transition-colors hover:text-white md:inline">
          All tools <span aria-hidden="true">→</span>
        </Link>
      </div>
    </nav>
  );
}
