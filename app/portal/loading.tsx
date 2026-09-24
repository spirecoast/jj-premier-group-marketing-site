export default function PortalLoading() {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto w-full">
      <div className="mb-6">
        <Skel className="h-7 w-24 mb-2" />
        <Skel className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-md px-4 py-3 space-y-3"
          >
            <Skel className="h-3 w-20" />
            <Skel className="h-7 w-12" />
            <Skel className="h-7 w-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <Panel />
        <Panel />
      </div>

      <Panel rows={4} />
    </div>
  );
}

function Panel({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-surface border border-border rounded-md">
      <div className="px-3 py-2 border-b border-border">
        <Skel className="h-4 w-24" />
      </div>
      <div className="px-3 py-3 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel className="size-2 rounded-full" />
            <Skel className="h-4 flex-1" />
            <Skel className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface-elevated border border-border/40 rounded animate-pulse ${className}`}
    />
  );
}
