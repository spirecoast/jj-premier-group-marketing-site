"use client";

import { Command } from "cmdk";
import { CheckSquare, Home, Search, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchContacts, type ContactHit } from "@/app/portal/search-actions";

const PAGES = [
  { href: "/portal", label: "Today", icon: Home },
  { href: "/portal/contacts", label: "All contacts", icon: Users },
  { href: "/portal/tasks", label: "Tasks", icon: CheckSquare },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ContactHit[]>([]);
  const [isSearching, startSearch] = useTransition();

  // Keyboard: Cmd+K / Ctrl+K toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        const result = await searchContacts(query);
        setHits(result);
      });
    }, 120);
    return () => clearTimeout(handle);
  }, [query, open]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href as never);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search size={16} className="text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search contacts or jump to a page…"
              className="flex-1 py-3 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-1">
            {hits.length === 0 && query.length === 0 ? (
              <Command.Group
                heading="Pages"
                className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-1.5 pb-0.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-0.5"
              >
                {PAGES.map((p) => (
                  <Command.Item
                    key={p.href}
                    value={`page:${p.label}`}
                    onSelect={() => go(p.href)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded text-sm cursor-pointer aria-selected:bg-surface-elevated"
                  >
                    <p.icon size={14} className="text-muted-foreground" />
                    {p.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {hits.length > 0 ? (
              <Command.Group
                heading="Contacts"
                className="text-[10px] uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-0.5"
              >
                {hits.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`contact:${c.id}:${c.fullName ?? c.email ?? ""}`}
                    onSelect={() => go(`/portal/contacts/${c.id}`)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded text-sm cursor-pointer aria-selected:bg-surface-elevated"
                  >
                    <UserRound size={14} className="text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {c.fullName ?? c.email ?? "Unnamed"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.email ?? c.phone ?? "—"}
                        {c.lifecycleStage ? ` · ${c.lifecycleStage}` : null}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      {c.score}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {query.length > 0 && hits.length === 0 && !isSearching ? (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No matches.
              </Command.Empty>
            ) : null}
          </Command.List>

          <footer className="border-t border-border px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>↑ ↓ to navigate · ↵ to open</span>
            {isSearching ? <span>searching…</span> : <span />}
          </footer>
        </Command>
      </div>
    </div>
  );
}
