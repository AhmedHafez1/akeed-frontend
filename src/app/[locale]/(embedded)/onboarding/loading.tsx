export default function Loading() {
  return (
    <div className="space-y-5 p-6 motion-safe:animate-pulse">
      {/* Page title */}
      <div className="bg-muted h-8 w-36 rounded" />

      {/* Onboarding card */}
      <div className="bg-muted/50 mx-auto max-w-3xl space-y-4 rounded-xl p-6">
        {/* Step counter */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-8 w-24 rounded" />
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-3 pt-4">
          <div className="bg-muted h-5 w-44 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-10 rounded" />
          ))}
        </div>

        {/* Continue button */}
        <div className="flex justify-end pt-2">
          <div className="bg-muted h-10 w-32 rounded" />
        </div>
      </div>
    </div>
  )
}
