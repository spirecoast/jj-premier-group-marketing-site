"use client";

import { cn } from "@/lib/utils";
import { useMyPlaces } from "./use-my-places";
import "./atlas-save.css";

/** The bookmark: an outline until saved, then filled in Atlas ink. */
export function BookmarkGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true">
      <path className="atlas-glyph-fill" d="M6 3.5h12v17l-6-4.5-6 4.5z" />
    </svg>
  );
}

/**
 * Save a neighborhood to My places. One 44px square by default (the word is
 * the tooltip and the accessible name); `word` puts "Save" or "Saved" beside
 * the bookmark where there is room. Backed by the one list in this browser,
 * so every button for a place agrees.
 */
export function SavePlaceButton({ slug, name, word = false, className, tone = "light" }: { slug: string; name: string; word?: boolean; className?: string; tone?: "light" | "dark" }) {
  const my = useMyPlaces();
  const saved = my.has(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        my.toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from my places` : `Save ${name} to my places`}
      title={saved ? "Saved" : "Save"}
      className={cn("btn-quiet atlas-save", !word && "is-square", tone === "dark" && "is-dark", className)}
    >
      <BookmarkGlyph />
      {word ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
