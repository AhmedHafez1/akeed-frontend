import type { TestFeedback } from '@/features/dashboard/domain/dashboard.types'

interface StandaloneFeedbackBannersProps {
  error: string | null
  testFeedback: TestFeedback | null
  onDismissTestFeedback: () => void
}

export function StandaloneFeedbackBanners({
  error,
  testFeedback,
  onDismissTestFeedback,
}: StandaloneFeedbackBannersProps) {
  return (
    <>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {testFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            testFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : testFeedback.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{testFeedback.message}</span>
          <button
            type="button"
            onClick={onDismissTestFeedback}
            className="ms-3 font-semibold opacity-60 transition hover:opacity-100"
          >
            x
          </button>
        </div>
      )}
    </>
  )
}
