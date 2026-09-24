"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "editorial-coast", label: "Editorial Coast" },
  { id: "modern-luxe", label: "Modern Luxe" },
  { id: "coastal-soft", label: "Coastal Soft" },
] as const;

const STORAGE_KEY = "preview-theme";

/**
 * Internal-only theme preview switcher. Live-swaps `data-theme` on <html> so
 * agents can preview the three example themes before brand work lands.
 *
 * Choice persists in localStorage on the agent's machine — does NOT update
 * the server-side default. The marketing site continues to render with
 * data-theme="editorial-coast" until brand selection happens in code.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>("editorial-coast");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  function apply(next: string) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <select
      value={theme}
      onChange={(e) => apply(e.target.value)}
      aria-label="Preview theme"
      className="text-xs px-2 py-1 bg-surface border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:border-brand"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
