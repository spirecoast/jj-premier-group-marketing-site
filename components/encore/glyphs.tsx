/**
 * The 18px glyphs a quiet button carries on Encore: a bookmark for Save, a
 * pin for Nearby, chevrons for Prev and Next, a cross for Close and Clear,
 * a share arrow and a calendar for the two links on a phone. One stroke
 * weight, square ends, no fills except the saved bookmark's.
 */
type P = { className?: string };
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const, "aria-hidden": true as const };

export function Bookmark({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path className="encore-glyph-fill" d="M6 3.5h12v17l-6-4.5-6 4.5z" />
    </svg>
  );
}

export function Pin({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function ChevronLeft({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ChevronRight({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function ChevronDown({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </svg>
  );
}

export function Cross({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function Magnifier({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function ShareArrow({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5v12M7.5 8 12 3.5 16.5 8M5 13.5v6.5h14v-6.5" />
    </svg>
  );
}

export function CalendarPlus({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5h16v14H4zM4 10.5h16M8 4v4M16 4v4M12 13v5M9.5 15.5h5" />
    </svg>
  );
}
