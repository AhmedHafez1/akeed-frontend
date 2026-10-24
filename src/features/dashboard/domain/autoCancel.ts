import type { VerificationItem } from '../model/dashboard.model'

/**
 * What a row says about its automatic cancellation, as one compact marker:
 * which words (keys under `dashboard.confirmations.autoCancel.marker`) and,
 * for a scheduled one, the time. Null when there is nothing to tell: the
 * store does not use it, the order is settled, or it ran its course.
 */
export type AutoCancelMarker =
  | { key: 'scheduled'; time: string }
  | { key: 'paused'; reason: AutoCancelPauseReason }
  | { key: 'excluded' }
  | { key: 'inProgress' }
  | { key: 'failed' }

export type AutoCancelPauseReason =
  | 'initial_not_delivered'
  | 'reminder_blocked'
  | 'reminder_not_delivered'
  | 'unknown'

const PAUSE_REASONS: readonly AutoCancelPauseReason[] = [
  'initial_not_delivered',
  'reminder_blocked',
  'reminder_not_delivered',
]

function pauseReasonOf(reason: string | null): AutoCancelPauseReason {
  return (PAUSE_REASONS as readonly string[]).includes(reason ?? '')
    ? (reason as AutoCancelPauseReason)
    : 'unknown'
}

export function autoCancelMarker(
  row: VerificationItem
): AutoCancelMarker | null {
  const view = row.auto_cancel
  if (!view || row.status === 'confirmed' || row.status === 'canceled')
    return null
  if (view.state === 'in_progress' || view.state === 'awaiting_platform')
    return { key: 'inProgress' }
  if (view.excluded) return { key: 'excluded' }
  if (view.state === 'failed') return { key: 'failed' }
  if (view.state === 'paused')
    return { key: 'paused', reason: pauseReasonOf(view.reason) }
  if (view.scheduled_for) return { key: 'scheduled', time: view.scheduled_for }
  return null
}

/** Whether the merchant may keep the order out, or let it back in. */
export function canToggleAutoCancel(row: VerificationItem): boolean {
  if (row.status === 'no_reply') return false
  return (
    row.capabilities?.some(
      (capability) =>
        capability.action === 'auto_cancel_exclusion' && capability.supported
    ) ?? false
  )
}

/** The action the row offers: keep the order out, or let it back in. */
export function autoCancelToggleAction(
  row: VerificationItem
): 'exclude' | 'include' | null {
  if (!canToggleAutoCancel(row)) return null
  return row.auto_cancel?.excluded ? 'include' : 'exclude'
}
