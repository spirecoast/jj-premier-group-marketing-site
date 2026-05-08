"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Visible "Search" button in the sidebar that also surfaces the keyboard
 * shortcut. Dispatches a synthetic Cmd+K keydown so we share one open path
 * with the actual hotkey listener inside <CommandPalette />.
 */
export function CommandPaletteTrigger() {
  const [shortcut, setShortcut] = useState("⌘K");

  useEffect(() => {
    const isMac = /Mac/i.test(navigator.userAgent ?? "");
    setShortcut(isMac ? "⌘K" : "Ctrl+K");
  }, []);

  function open() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
    });
    window.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      onClick={open}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
    >
      <Search size={14} />
      <span className="flex-1 text-left">Search</span>
      <kbd className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1 py-0.5">
        {shortcut}
      </kbd>
    </button>
  );
}
