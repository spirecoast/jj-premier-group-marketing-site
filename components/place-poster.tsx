import { MAP_COLORS } from "@/lib/neighborhoods/map-style";
import { POSTER_H, POSTER_W, posterMarks, type PosterPoint } from "@/lib/neighborhoods/poster";

/**
 * The still picture in a neighborhood page's map frame: the place in amber,
 * its children or parent as navy marks on linen with a faint survey grid, in
 * the map's own colours. Drawn on the server from the record's points, so it
 * is in the HTML and costs nothing; the live map replaces it when the frame
 * comes into view (components/place-map-island.tsx).
 */
export function PlacePoster({ points }: { points: PosterPoint[] }) {
  const marks = posterMarks(points);
  const self = marks.find((m) => m.kind === "self");
  const context = marks.filter((m) => m.kind !== "self");
  const labelled = context.length <= 10 ? context : [];
  const c = MAP_COLORS;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${POSTER_W} ${POSTER_H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={self ? `Where ${self.name} sits, as points on a map` : "Map"}
    >
      <defs>
        <pattern id="poster-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={c.navy} strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={POSTER_W} height={POSTER_H} fill="#f7f3ec" />
      <rect width={POSTER_W} height={POSTER_H} fill="url(#poster-grid)" />
      {context.map((m) => (
        <g key={`${m.kind}-${m.name}-${m.x}-${m.y}`}>
          <circle cx={m.x} cy={m.y} r={m.kind === "parent" ? 7 : 4} fill={m.kind === "parent" ? c.paper : c.navy} stroke={c.navy} strokeWidth={m.kind === "parent" ? 2 : 1} opacity="0.85" />
        </g>
      ))}
      {labelled.map((m) => (
        <text
          key={`label-${m.name}-${m.x}-${m.y}`}
          x={m.x}
          y={m.y + (m.kind === "parent" ? 20 : 17)}
          textAnchor="middle"
          fontFamily="var(--font-body), sans-serif"
          fontSize="11"
          fill={c.graphiteDark}
          stroke={c.paper}
          strokeWidth="3"
          paintOrder="stroke"
        >
          {m.name}
        </text>
      ))}
      {self ? (
        <>
          <circle cx={self.x} cy={self.y} r="16" fill={c.amber} opacity="0.18" />
          <circle cx={self.x} cy={self.y} r="8" fill={c.amber} stroke="#fff" strokeWidth="2.5" />
        </>
      ) : null}
    </svg>
  );
}
