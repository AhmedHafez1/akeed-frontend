export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-8 w-36 rounded bg-gray-200" />
      </div>

      {/* Metric cards row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>

      {/* Metric cards row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>

      {/* Funnel card */}
      <div className="h-40 rounded-xl bg-gray-200" />
    </div>
  )
}
