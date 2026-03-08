import { Button } from '@/shared/ui/button'

interface WaitlistSubmitButtonProps {
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
  onSubmit: () => void
}

export function WaitlistSubmitButton({
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
}: WaitlistSubmitButtonProps) {
  return (
    <Button
      onClick={onSubmit}
      disabled={isSubmitting}
      className="mt-6 w-full bg-linear-to-r from-orange-600 to-orange-500 py-6 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {submittingLabel}
        </span>
      ) : (
        submitLabel
      )}
    </Button>
  )
}
