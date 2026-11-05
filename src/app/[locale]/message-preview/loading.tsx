export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Page title */}
      <div className="bg-border h-8 w-44 rounded" />

      {/* Message preview card */}
      <div className="bg-muted space-y-3 rounded-xl p-5">
        <div className="bg-border h-5 w-36 rounded" />
        <div className="bg-border h-32 rounded" />
        <div className="bg-border h-16 rounded" />
      </div>
    </div>
  )
}
