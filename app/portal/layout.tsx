import Link from "next/link";
import { requireAgent } from "@/lib/auth/server";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await requireAgent();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-border bg-surface-elevated">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/portal"
              className="font-display text-base tracking-tight"
            >
              [YOUR PLACEHOLDER] · Portal
            </Link>
            <nav className="hidden md:flex gap-6 text-sm" aria-label="Portal">
              <Link
                href="/portal"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Today
              </Link>
              <Link
                href="/portal/contacts"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contacts
              </Link>
              <Link
                href="/portal/tasks"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Tasks
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ThemeSwitcher />
            <span className="text-muted-foreground hidden sm:inline">
              {agent.name}
            </span>
            <Link
              href="/auth/logout"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
