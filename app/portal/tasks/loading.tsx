export default function TasksLoading() {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Skel className="h-7 w-20 mb-2" />
        <Skel className="h-4 w-40" />
      </div>
      <div className="bg-surface border border-border rounded-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="px-3 py-3 border-b border-border last:border-0 flex items-start gap-3"
          >
            <Skel className="size-2 rounded-full mt-1.5" />
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-2/3" />
              <Skel className="h-3 w-1/3" />
            </div>
            <Skel className="h-7 w-20" />
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
