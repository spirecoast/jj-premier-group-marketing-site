import type { ComponentProps, ReactNode } from "react";

/**
 * A link that opens in a new tab (a county source, a venue's own page, a
 * statute): the target and rel every such link needs, and a cue for a
 * screen reader that it leaves the site, which sighted visitors get from
 * the tab itself.
 */
export function ExternalLink({ children, ...rest }: { children: ReactNode } & Omit<ComponentProps<"a">, "target" | "rel" | "children">) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <NewTabCue />
    </a>
  );
}

export function NewTabCue() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}
