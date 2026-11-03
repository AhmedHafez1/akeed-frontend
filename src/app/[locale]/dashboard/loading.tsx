export default function Loading() {
  return (
    <div className="space-y-5 p-6 motion-safe:animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="bg-muted h-8 w-40 rounded" />
        <div className="bg-muted h-8 w-36 rounded" />
      </div>

      {/* Metric cards row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>

      {/* Metric cards row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>

      {/* Funnel card */}
      <div className="bg-muted h-40 rounded-xl" />
    </div>
  )
}
