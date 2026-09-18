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
          className="border-warning-border bg-warning-subtle text-warning-subtle-foreground flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{tCredits(creditFeedbackMessageKey(creditDenialCode))}</span>
          {billingLink}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border px-4 py-3 text-sm"
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
              ? 'bg-primary-subtle border-primary-border text-primary'
              : testFeedback.tone === 'warning'
                ? 'bg-warning-subtle border-warning-border text-warning'
                : 'bg-destructive-subtle border-destructive-border text-destructive-subtle-foreground'
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
              ? 'bg-primary-subtle border-primary-border text-primary'
              : actionFeedback.tone === 'warning'
                ? 'bg-warning-subtle border-warning-border text-warning-subtle-foreground'
                : 'bg-destructive-subtle border-destructive-border text-destructive-subtle-foreground'
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
    'notProvisioned' | 'suspended' | 'debt' | 'insufficient' | 'reconciliation'
  > = {
    CREDIT_ACCOUNT_NOT_PROVISIONED: 'notProvisioned',
    CREDIT_ACCOUNT_SUSPENDED: 'suspended',
    CREDIT_DEBT_OUTSTANDING: 'debt',
    INSUFFICIENT_CREDITS: 'insufficient',
    PAYMENT_PENDING_RECONCILIATION: 'reconciliation',
  }
  return keys[code]
}
