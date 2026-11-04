"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The site's main number, for client components deep in a page that need a
 * call or text link (the lead forms' failure line). The layout provides it
 * from the site settings, the same number as the phone action bar.
 */
const Ctx = createContext<string | null>(null);

/** The two of us by name, and the team's one number as it's written, for the foot of a printed result (components/keep). */
export type SiteTeam = { names: string[]; phone: string | null };
const TeamCtx = createContext<SiteTeam>({ names: [], phone: null });

export function SiteContactProvider({
  phoneE164,
  phoneDisplay,
  names = [],
  children,
}: {
  phoneE164: string;
  phoneDisplay: string;
  names?: string[];
  children: ReactNode;
}) {
  return (
    <Ctx.Provider value={phoneE164}>
      <TeamCtx.Provider value={{ names, phone: phoneDisplay || null }}>{children}</TeamCtx.Provider>
    </Ctx.Provider>
  );
}

/** The team's names and number, or none outside the site layout. */
export function useSiteTeam(): SiteTeam {
  return useContext(TeamCtx);
}

/** The main number in E.164, or null outside the site layout. */
export function useSitePhone(): string | null {
  return useContext(Ctx);
}
