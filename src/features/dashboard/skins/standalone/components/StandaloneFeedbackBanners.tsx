import Link from 'next/link'
import type { TestFeedback } from '@/features/dashboard/domain/dashboard.types'
import { useTranslations } from 'next-intl'
import type { CreditDenialCode } from '@/shared/lib/creditFeedback'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'

interface StandaloneFeedbackBannersProps {
  error: string | null
  testFeedback: TestFeedback | null
  onDismissTestFeedback: () => void
  actionFeedback?: TestFeedback | null
  onDismissActionFeedback?: () => void
  creditDenialCode?: CreditDenialCode | null
}

export function StandaloneFeedbackBanners({
  error,
  testFeedback,
  onDismissTestFeedback,
  actionFeedback,
  onDismissActionFeedback,
  creditDenialCode,
}: StandaloneFeedbackBannersProps) {
  const t = useTranslations('dashboard')
  const tCredits = useTranslations('creditErrors')
  const { locale } = useLocaleInfo()
  const billingLink = (
    <Link
      href={withLocale('/billing', locale)}
      className="shrink-0 font-semibold underline underline-offset-4"
    >
      {tCredits('billingLink')}
    </Link>
  )
  return (
    <>
      {creditDenialCode && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{tCredits(creditFeedbackMessageKey(creditDenialCode))}</span>
          {billingLink}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {testFeedback && (
        <div
          role={testFeedback.tone === 'critical' ? 'alert' : 'status'}
          aria-live="polite"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            testFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : testFeedback.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span className="me-auto">{testFeedback.message}</span>
          {testFeedback.billingLink && billingLink}
          <button
            type="button"
            aria-label={t('table.actions.dismiss')}
            onClick={onDismissTestFeedback}
            className="ms-3 font-semibold opacity-60 transition hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {actionFeedback && (
        <div
          role={actionFeedback.tone === 'critical' ? 'alert' : 'status'}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            actionFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : actionFeedback.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span className="me-auto">{actionFeedback.message}</span>
          {actionFeedback.billingLink && billingLink}
          <button
            type="button"
            aria-label={t('table.actions.dismiss')}
            onClick={onDismissActionFeedback}
            className="ms-3 font-semibold opacity-60 transition hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

function creditFeedbackMessageKey(code: CreditDenialCode) {
  const keys: Record<
    CreditDenialCode,
    | 'approvalRequired'
    | 'suspended'
    | 'debt'
    | 'insufficient'
    | 'reconciliation'
  > = {
    STANDALONE_APPROVAL_REQUIRED: 'approvalRequired',
    CREDIT_ACCOUNT_SUSPENDED: 'suspended',
    CREDIT_DEBT_OUTSTANDING: 'debt',
    INSUFFICIENT_CREDITS: 'insufficient',
    PAYMENT_PENDING_RECONCILIATION: 'reconciliation',
  }
  return keys[code]
}
