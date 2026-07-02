export default function Loading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/60 px-3 sm:px-6 flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-44 rounded bg-muted animate-pulse" />
          <div className="hidden sm:block h-3 w-64 rounded bg-muted/70 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-7 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          <div className="h-3 w-72 rounded bg-muted/70 animate-pulse" />
          <div className="pt-2 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-11 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
