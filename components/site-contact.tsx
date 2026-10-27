"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The site's main number, for client components deep in a page that need a
 * call or text link (the lead forms' failure line). The layout provides it
 * from the site settings, the same number as the phone action bar.
 */
const Ctx = createContext<string | null>(null);

export function SiteContactProvider({ phoneE164, children }: { phoneE164: string; children: ReactNode }) {
  return <Ctx.Provider value={phoneE164}>{children}</Ctx.Provider>;
}

/** The main number in E.164, or null outside the site layout. */
export function useSitePhone(): string | null {
  return useContext(Ctx);
}
