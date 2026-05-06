export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Page title */}
      <div className="h-8 w-44 rounded bg-gray-200" />

      {/* Message preview card */}
      <div className="space-y-3 rounded-xl bg-gray-100 p-5">
        <div className="h-5 w-36 rounded bg-gray-200" />
        <div className="h-32 rounded bg-gray-200" />
        <div className="h-16 rounded bg-gray-200" />
      </div>
    </div>
  )
}
