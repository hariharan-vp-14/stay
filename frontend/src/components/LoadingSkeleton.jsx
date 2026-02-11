export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden animate-pulse"
        >
          <div className="h-44 bg-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 bg-white/5 rounded-full w-14" />
              <div className="h-5 bg-white/5 rounded-full w-12" />
            </div>
            <div className="h-4 bg-white/5 rounded w-1/3 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
