export default function Loading() {
  return (
    <div className="space-y-5 p-6 motion-safe:animate-pulse">
      {/* Page title */}
      <div className="bg-muted h-8 w-48 rounded" />

      {/* Automation card */}
      <div className="bg-muted/50 space-y-3 rounded-xl p-5">
        <div className="bg-muted h-5 w-36 rounded" />
        <div className="bg-muted h-10 rounded" />
        <div className="bg-muted h-10 rounded" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="bg-muted h-10 rounded" />
          <div className="bg-muted h-10 rounded" />
          <div className="bg-muted h-10 rounded" />
        </div>
      </div>

      {/* Additional settings card */}
      <div className="bg-muted/50 space-y-3 rounded-xl p-5">
        <div className="bg-muted h-5 w-40 rounded" />
        <div className="bg-muted h-20 rounded" />
      </div>
    </div>
  )
}
