"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The site's main number, for client components deep in a page that need a
 * call or text link (the lead forms' failure line). The layout provides it
 * from the site settings, the same number as the phone action bar.
 */
const Ctx = createContext<string | null>(null);

/** The two of us by name and number, for the foot of a printed result (components/keep). */
export type TeamContact = { name: string; phone: string };
const TeamCtx = createContext<TeamContact[]>([]);

export function SiteContactProvider({ phoneE164, team = [], children }: { phoneE164: string; team?: TeamContact[]; children: ReactNode }) {
  return (
    <Ctx.Provider value={phoneE164}>
      <TeamCtx.Provider value={team}>{children}</TeamCtx.Provider>
    </Ctx.Provider>
  );
}

/** The team's names and numbers, or none outside the site layout. */
export function useSiteTeam(): TeamContact[] {
  return useContext(TeamCtx);
}

/** The main number in E.164, or null outside the site layout. */
export function useSitePhone(): string | null {
  return useContext(Ctx);
}
