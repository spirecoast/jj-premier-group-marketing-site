/**
 * Tiny inline-SVG sparkline. No chart library needed at this scale.
 * Renders the data series as a smoothed line + soft area underneath.
 *
 * If every value is zero, draws a faint flat baseline so the card still has
 * a horizon line and doesn't look broken.
 */
export function Sparkline({
  data,
  className = "h-7 w-full",
}: {
  data: readonly number[];
  className?: string;
}) {
  if (data.length === 0) return null;

  const W = 100;
  const H = 32;
  const max = Math.max(...data);
  const range = max > 0 ? max : 1;

  const stepX = data.length > 1 ? W / (data.length - 1) : W;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - (v / range) * (H - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;
  const flat = max === 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {flat ? (
        <line
          x1="0"
          y1={H - 2}
          x2={W}
          y2={H - 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.25"
        />
      ) : (
        <>
          <path d={areaPath} fill="currentColor" opacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
