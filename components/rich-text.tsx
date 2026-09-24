import { PortableText, type PortableTextComponents } from "next-sanity";
import type { RichText as RichTextValue } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const components: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a href={href} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
          {children}
        </a>
      );
    },
  },
};

export function RichText({ value, className }: { value: RichTextValue; className?: string }) {
  if (!value?.length) return null;
  return (
    <div className={cn("prose-jj", className)}>
      <PortableText value={value} components={components} />
    </div>
  );
}
