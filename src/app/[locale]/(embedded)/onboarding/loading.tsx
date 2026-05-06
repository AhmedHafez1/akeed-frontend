export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {/* Page title */}
      <div className="h-8 w-36 rounded bg-gray-200" />

      {/* Onboarding card */}
      <div className="mx-auto max-w-3xl space-y-4 rounded-xl bg-gray-100 p-6">
        {/* Step counter */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded bg-gray-200" />
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-3 pt-4">
          <div className="h-5 w-44 rounded bg-gray-200" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-gray-200" />
          ))}
        </div>

        {/* Continue button */}
        <div className="flex justify-end pt-2">
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
