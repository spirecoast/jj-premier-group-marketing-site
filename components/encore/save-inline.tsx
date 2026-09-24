"use client";

import { SaveButton } from "./tile";
import { useMyList } from "./use-my-list";

/** The Save button on an event page, backed by the same list as the calendar. */
export function SaveInline({ slug, title }: { slug: string; title: string }) {
  const my = useMyList();
  return <SaveButton saved={my.has(slug)} onToggle={() => my.toggle(slug)} title={title} className="!min-h-9 !px-3 !text-[12px]" />;
}
