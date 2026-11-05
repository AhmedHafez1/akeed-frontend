export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="bg-border h-8 w-48 rounded" />
        <div className="bg-border h-8 w-36 rounded" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-border h-8 w-20 rounded" />
        ))}
      </div>

      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-border h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
