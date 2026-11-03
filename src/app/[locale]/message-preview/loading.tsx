export default function Loading() {
  return (
    <div className="space-y-5 p-6 motion-safe:animate-pulse">
      {/* Page title */}
      <div className="bg-muted h-8 w-44 rounded" />

      {/* Message preview card */}
      <div className="bg-muted/50 space-y-3 rounded-xl p-5">
        <div className="bg-muted h-5 w-36 rounded" />
        <div className="bg-muted h-32 rounded" />
        <div className="bg-muted h-16 rounded" />
      </div>
    </div>
  )
}
