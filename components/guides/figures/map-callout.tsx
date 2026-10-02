import type { MapCalloutFigure } from "@/lib/guides/types";

/** The portals and offices a reader goes to, one card each with a drawn mark. */
export function MapCalloutView({ figure }: { figure: MapCalloutFigure }) {
  return (
    <ol className={`grid gap-4 ${figure.places.length === 4 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {figure.places.map((p, i) => (
        <li key={p.name} className="flex flex-col gap-3 border border-hairline bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
              <circle cx="14" cy="14" r="12.5" className="fill-none stroke-harbor-800" strokeWidth="1.25" />
              <path d="M14 7 L17 14 L14 12.5 L11 14 Z" className="fill-coral" />
              <path d="M14 21 L11 14 L14 15.5 L17 14 Z" className="fill-harbor-800" />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">0{i + 1}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{p.covers}</span>
            <span className="t-h4 text-navy">{p.name}</span>
          </div>
          <p className="text-[14px] leading-snug text-body">{p.body}</p>
          <a href={p.href} target="_blank" rel="noopener noreferrer" className="link-rule mt-auto self-start break-all">
            {p.cta}
          </a>
        </li>
      ))}
    </ol>
  );
}
