export function BuildCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BuildCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LineSkeleton({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />;
}
