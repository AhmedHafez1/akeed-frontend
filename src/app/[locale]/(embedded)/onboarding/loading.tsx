export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Page title */}
      <div className="bg-border h-8 w-36 rounded" />

      {/* Onboarding card */}
      <div className="bg-muted mx-auto max-w-3xl space-y-4 rounded-xl p-6">
        {/* Step counter */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-border h-8 w-24 rounded" />
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-3 pt-4">
          <div className="bg-border h-5 w-44 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-border h-10 rounded" />
          ))}
        </div>

        {/* Continue button */}
        <div className="flex justify-end pt-2">
          <div className="bg-border h-10 w-32 rounded" />
        </div>
      </div>
    </div>
  )
}
