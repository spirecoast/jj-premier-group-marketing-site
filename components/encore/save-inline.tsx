"use client";

import { SaveButton } from "./tile";
import { useMyList } from "./use-my-list";

/** The Save button on an event page, backed by the same list as the calendar; here the word sits beside the bookmark. */
export function SaveInline({ slug, title }: { slug: string; title: string }) {
  const my = useMyList();
  return <SaveButton saved={my.has(slug)} onToggle={() => my.toggle(slug)} title={title} word />;
}
