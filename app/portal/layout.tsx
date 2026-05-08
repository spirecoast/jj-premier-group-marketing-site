import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireAgent } from "@/lib/auth/server";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await requireAgent();

  return (
    <div data-portal className="min-h-screen flex flex-col bg-surface-elevated">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-14 flex items-center gap-6">
          <Link
            href="/portal"
            className="font-semibold text-sm tracking-tight whitespace-nowrap"
          >
            <span className="text-foreground">[YOUR PLACEHOLDER]</span>
            <span className="text-muted-foreground mx-1.5">/</span>
            <span className="text-muted-foreground">Portal</span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-0.5 text-sm"
            aria-label="Portal"
          >
            <NavLink href="/portal">Today</NavLink>
            <NavLink href="/portal/contacts">Contacts</NavLink>
            <NavLink href="/portal/tasks">Tasks</NavLink>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm">
            <ThemeSwitcher />
            <span className="text-muted-foreground hidden sm:inline text-xs">
              {agent.name}
            </span>
            <UserButton />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as never}
      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
    >
      {children}
    </Link>
  );
}
