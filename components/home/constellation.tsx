/**
 * The Suncoast bbox, projected into a small box the way the share images do
 * it: every third place in the catalog as a point. `fill` lets the band set
 * the points on linen; the default is the Wave 0 card.
 */
export function Constellation({ points, className = "h-auto w-full max-w-[320px]", fill = "var(--color-navy)", opacity = 0.45 }: { points: [number, number][]; className?: string; fill?: string; opacity?: number }) {
  const W = 320;
  const H = 300;
  const bbox = { w: -82.79, e: -82.24, s: 27.16, n: 27.68 };
  const cosLat = Math.cos((27.42 * Math.PI) / 180);
  const spanX = (bbox.e - bbox.w) * cosLat;
  const spanY = bbox.n - bbox.s;
  const scale = Math.min((W - 16) / spanX, (H - 16) / spanY);
  const ox = (W - spanX * scale) / 2;
  const oy = (H - spanY * scale) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true">
      {points.map(([lng, lat], i) => (
        <circle key={i} cx={(ox + (lng - bbox.w) * cosLat * scale).toFixed(1)} cy={(oy + (bbox.n - lat) * scale).toFixed(1)} r="1.4" fill={fill} fillOpacity={opacity} />
      ))}
    </svg>
  );
}
