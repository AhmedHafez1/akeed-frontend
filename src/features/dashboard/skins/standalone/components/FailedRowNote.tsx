'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { canRetryVerification } from '../../../domain/verificationLifecycle'
import { failedRowHint } from '../../../domain/failedRowHint'
import type { VerificationItem } from '../../../model/dashboard.model'

const actionClass =
  'text-primary inline-flex min-h-11 items-center text-xs font-semibold underline-offset-4 hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 md:min-h-0'

/**
 * Under a failed row's badge: why it failed, in a few words, and the one
 * next step -- buy credits, turn automation back on, retry, or the details.
 */
export function FailedRowNote({
  verification,
  canRetryVerifications,
  acting,
  onRetry,
  onOpenDetails,
}: {
  verification: VerificationItem
  canRetryVerifications: boolean
  /** Another row action is running; the retry waits for it. */
  acting: boolean
  onRetry: (verificationId: string) => void
  onOpenDetails: (
    verificationId: string,
    trigger: HTMLButtonElement | null
  ) => void
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const detailsRef = useRef<HTMLButtonElement>(null)
  const hint = failedRowHint(
    verification,
    canRetryVerifications && canRetryVerification(verification.capabilities)
  )
  if (!hint) return null

  return (
    <div className="mt-1.5 max-w-56 space-y-0.5">
      <p className="text-destructive-subtle-foreground text-xs leading-5">
        {t(hint.reasonKey)}
      </p>
      {hint.action === 'buyCredits' && (
        <Link href={withLocale('/billing', locale)} className={actionClass}>
          {t('failedRow.action.buyCredits')}
        </Link>
      )}
      {hint.action === 'openSettings' && (
        <Link
          href={`${withLocale('/settings', locale)}#automation-settings`}
          className={actionClass}
        >
          {t('failedRow.action.openSettings')}
        </Link>
      )}
      {hint.action === 'retry' && (
        <button
          type="button"
          disabled={acting}
          onClick={() => onRetry(verification.id)}
          className={actionClass}
        >
          {t('table.actions.retry')}
        </button>
      )}
      {hint.action === 'details' && (
        <button
          ref={detailsRef}
          type="button"
          onClick={() => onOpenDetails(verification.id, detailsRef.current)}
          className={actionClass}
        >
          {t('failedRow.action.details')}
        </button>
      )}
    </div>
  )
}
