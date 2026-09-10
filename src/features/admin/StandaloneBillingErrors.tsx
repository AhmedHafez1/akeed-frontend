'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import type { AdminApiError } from './adminApi'
import { Mono } from './StandaloneBillingAccountSections'

export function RequestError({
  error,
  onRetry,
}: {
  error: AdminApiError
  onRetry?: () => void
}) {
  const t = useTranslations('adminBillingOps')
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>{errorMessage(t, error)}</p>
      {error.requestId && (
        <p className="mt-2">
          <Mono>{error.requestId}</Mono>
        </p>
      )}
      {onRetry && (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  )
}

const ERROR_CODES = [
  'STANDALONE_BILLING_OPERATIONS_DISABLED',
  'STANDALONE_BILLING_OPERATOR_REQUIRED',
  'BILLING_ACCOUNT_NOT_FOUND',
  'BILLING_ACCOUNT_NOT_APPROVED',
  'CREDIT_PROJECTION_MISMATCH',
  'CREDIT_SOURCE_CONTRADICTORY',
  'BILLING_PREVIEW_NOT_FOUND',
  'BILLING_PREVIEW_STALE',
  'BILLING_PREVIEW_ALREADY_APPLIED',
  'BILLING_IDEMPOTENCY_KEY_REQUIRED',
  'BILLING_IDEMPOTENCY_CONFLICT',
  'BILLING_DISPATCH_NOT_FOUND',
  'BILLING_DISPATCH_NOT_CREDIT_BILLED',
  'MESSAGE_DISPATCH_RESOLUTION_CONFLICT',
  'BILLING_PURCHASE_NOT_FOUND',
  'BILLING_PURCHASE_NOT_ELIGIBLE',
  'REPAIR_SOURCE_CONTRADICTORY',
  'PAYMENT_PENDING_RECONCILIATION',
] as const

export function errorMessage(
  t: ReturnType<typeof useTranslations<'adminBillingOps'>>,
  error: AdminApiError
) {
  if (error.code && (ERROR_CODES as readonly string[]).includes(error.code))
    return t(`errors.${error.code as (typeof ERROR_CODES)[number]}`)
  if (error.status === 403) return t('errors.forbidden')
  if (error.status === 404) return t('errors.notFound')
  if (error.status === 400) return t('errors.invalid')
  if (error.status === 409) return t('errors.conflict')
  return t('errors.failed')
}
