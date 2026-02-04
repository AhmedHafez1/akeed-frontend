interface OnboardingErrorProps {
  message: string
}

export function OnboardingError({ message }: OnboardingErrorProps) {
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
