export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Page title */}
      <div className="h-8 w-32 rounded bg-gray-200" />

      {/* Store configuration card */}
      <div className="space-y-3 rounded-xl bg-gray-100 p-5">
        <div className="h-5 w-44 rounded bg-gray-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-gray-200" />
        ))}
      </div>

      {/* Automation card */}
      <div className="space-y-3 rounded-xl bg-gray-100 p-5">
        <div className="h-5 w-36 rounded bg-gray-200" />
        <div className="h-10 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-10 rounded bg-gray-200" />
        </div>
      </div>

      {/* Subscription card */}
      <div className="space-y-3 rounded-xl bg-gray-100 p-5">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="h-20 rounded bg-gray-200" />
      </div>
    </div>
  )
}
