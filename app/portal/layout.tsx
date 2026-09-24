import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Activity,
  CheckSquare,
  Home,
  Users,
} from "lucide-react";
import { Toaster } from "sonner";
import { requireAgent } from "@/lib/auth/server";
import { CommandPalette } from "@/components/command-palette";
import { CommandPaletteTrigger } from "@/components/command-palette-trigger";
import { ThemeSwitcher } from "@/components/theme-switcher";

const NAV = [
  { href: "/portal", label: "Today", icon: Home },
  { href: "/portal/contacts", label: "Contacts", icon: Users },
  { href: "/portal/tasks", label: "Tasks", icon: CheckSquare },
] as const;

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await requireAgent();

  return (
    <div data-portal className="min-h-screen flex bg-surface-elevated">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-background sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-border">
          <Link
            href="/portal"
            className="flex items-center gap-2 font-semibold text-sm tracking-tight"
          >
            <span className="size-6 rounded-md bg-foreground text-inverse flex items-center justify-center text-[11px] font-bold">
              JJ
            </span>
            <span className="truncate">JJ Premier Group</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Portal">
          <CommandPaletteTrigger />
          <div className="h-px bg-border my-2" />
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} icon={<item.icon size={16} />}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-3">
          <ThemeSwitcher />
          <div className="flex items-center gap-2.5">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {agent.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {agent.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-background h-12 px-4 flex items-center justify-between">
        <Link
          href="/portal"
          className="flex items-center gap-2 font-semibold text-sm"
        >
          <span className="size-6 rounded-md bg-foreground text-inverse flex items-center justify-center text-[10px] font-bold">
            YP
          </span>
          Portal
        </Link>
        <UserButton />
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border flex"
        aria-label="Portal mobile"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href as never}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</main>

      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-surface border border-border text-foreground rounded-md shadow-lg",
            description: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
