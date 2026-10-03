/**
 * Route-level loading state for every public page: a thin indeterminate bar
 * in the brand's navy and sky pinned under the top of the viewport, so a
 * navigation that waits on data shows something instead of nothing. As a
 * segment loading file it is the Suspense fallback: it replaces the page body
 * with the bar and a placeholder until the route resolves. The bar waits
 * 150 ms before it appears, so a route that resolves quickly, the usual case
 * with prefetching, never flashes it; the links themselves carry a soft veil
 * in the meantime (components/link-pending.tsx).
 */
export default function SiteLoading() {
  return (
    <>
      <style>{`
        @keyframes site-loading-sweep {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(60%); }
          100% { transform: translateX(100%); }
        }
        .site-loading-bar {
          opacity: 1;
          transition: opacity 120ms ease 150ms;
        }
        @starting-style {
          .site-loading-bar { opacity: 0; }
        }
        .site-loading-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(90deg, var(--color-navy), var(--color-sky-700), var(--color-amber));
          animation: site-loading-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .site-loading-bar::after { animation: none; width: 100%; opacity: 0.6; }
        }
      `}</style>
      <div
        role="progressbar"
        aria-label="Loading the page"
        aria-busy="true"
        className="site-loading-bar fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-navy/10"
      />
      <div className="min-h-[60vh]" aria-hidden="true" />
    </>
  );
}
