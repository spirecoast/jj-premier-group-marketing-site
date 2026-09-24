export default function ContactsLoading() {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto w-full">
      <div className="mb-6">
        <Skel className="h-7 w-32 mb-2" />
        <Skel className="h-4 w-24" />
      </div>
      <div className="bg-surface border border-border rounded-md">
        <div className="px-3 py-2.5 border-b border-border flex gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skel key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="px-3 py-2.5 border-b border-border last:border-0 flex items-center gap-3"
          >
            <Skel className="h-4 flex-1" />
            <Skel className="h-5 w-12" />
            <Skel className="h-4 flex-1" />
            <Skel className="h-4 flex-1" />
            <Skel className="h-5 w-16" />
            <Skel className="h-4 w-20" />
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
