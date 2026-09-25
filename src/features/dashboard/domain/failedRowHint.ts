import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import type { VerificationItem } from '../model/dashboard.model'
import { deliveryFailureKey } from './deliveryFailure'

/** The one thing the merchant can do next about a failed send. */
export type FailedRowAction =
  | 'buyCredits'
  | 'openSettings'
  | 'retry'
  | 'details'

export interface FailedRowHint {
  /** Relative to `dashboard`: a short reason for the table cell. */
  reasonKey: string
  action: FailedRowAction
}

/**
 * Why a failed row failed, in a few words, and its next step. A cause the
 * merchant must clear first (credits, automation off) comes before a retry,
 * which would only fail again; anything else opens the row's details.
 */
export function failedRowHint(
  row: Pick<VerificationItem, 'status' | 'reason' | 'failure_code'>,
  canRetry: boolean
): FailedRowHint | null {
  if (row.status !== 'failed') return null
  const reason = row.reason
  if (creditFeedbackKey(reason))
    return { reasonKey: 'failedRow.reason.noCredits', action: 'buyCredits' }
  if (reason === 'auto_verify_disabled')
    return {
      reasonKey: 'failedRow.reason.autoVerifyOff',
      action: 'openSettings',
    }
  const reasonKey =
    reason === 'provider_delivery_failed'
      ? `confirmations.status.failure.${deliveryFailureKey(row.failure_code)}`
      : reason === 'provider_not_accepted'
        ? 'failedRow.reason.rejected'
        : 'confirmations.status.failure.notSent'
  return { reasonKey, action: canRetry ? 'retry' : 'details' }
}
